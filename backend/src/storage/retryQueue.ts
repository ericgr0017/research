import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(here, "../../.data/outcome-retries.db");

let db: Database.Database | null = null;

const initDb = (): Database.Database => {
  if (db) return db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS outcome_retries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      next_attempt_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_retries_next ON outcome_retries (next_attempt_at);
  `);
  db = conn;
  return conn;
};

export interface OutcomeJobPayload {
  meeting_id: string;
  decision: "Send Invitation" | "Do Not Send";
  transcript: string;
  notes: string | null;
  interviewer: { email: string; name: string; zoho_user_id: string };
  steps_complete: {
    meeting_update: boolean;
    contact_update: boolean;
    email_sent: boolean;
    insight_saved: boolean;
  };
}

export interface RetryRow {
  id: number;
  meeting_id: string;
  decision: string;
  payload_json: string;
  attempts: number;
  last_error: string | null;
  next_attempt_at: number;
  created_at: number;
}

export const enqueueRetry = (payload: OutcomeJobPayload, error: string): number => {
  const conn = initDb();
  const stmt = conn.prepare(
    `INSERT INTO outcome_retries (meeting_id, decision, payload_json, attempts, last_error, next_attempt_at, created_at)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
  );
  const now = Date.now();
  const result = stmt.run(
    payload.meeting_id,
    payload.decision,
    JSON.stringify(payload),
    error,
    now + 30_000,
    now,
  );
  return Number(result.lastInsertRowid);
};

export const dueRetries = (limit = 5): RetryRow[] => {
  const conn = initDb();
  const stmt = conn.prepare(
    `SELECT * FROM outcome_retries WHERE next_attempt_at <= ? ORDER BY next_attempt_at ASC LIMIT ?`,
  );
  return stmt.all(Date.now(), limit) as RetryRow[];
};

export const markRetryDone = (id: number): void => {
  const conn = initDb();
  conn.prepare(`DELETE FROM outcome_retries WHERE id = ?`).run(id);
};

export const markRetryFailed = (id: number, error: string): void => {
  const conn = initDb();
  const row = conn.prepare(`SELECT attempts FROM outcome_retries WHERE id = ?`).get(id) as
    | { attempts: number }
    | undefined;
  if (!row) return;
  const attempts = row.attempts + 1;
  // Cap at 10 attempts. After that, leave the row in place so it surfaces in
  // any operator dashboard but stop scheduling it for retry.
  const nextAttempt =
    attempts >= 10 ? Number.MAX_SAFE_INTEGER : Date.now() + 60_000 * Math.pow(2, attempts);
  conn
    .prepare(`UPDATE outcome_retries SET attempts = ?, last_error = ?, next_attempt_at = ? WHERE id = ?`)
    .run(attempts, error, nextAttempt, id);
};

export const updateRetryPayload = (id: number, payload: OutcomeJobPayload): void => {
  const conn = initDb();
  conn.prepare(`UPDATE outcome_retries SET payload_json = ? WHERE id = ?`).run(JSON.stringify(payload), id);
};

export const closeDb = (): void => {
  db?.close();
  db = null;
};
