import { useToasts } from "../store/toasts.js";

export const Toaster = (): React.ReactElement => {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "rounded-md shadow-md px-4 py-3 text-sm border " +
            (t.tone === "error"
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-white border-rule text-ink")
          }
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div>{t.message}</div>
              {t.detail && (
                <div className="text-xs text-muted mt-1 font-mono break-words">
                  {t.detail}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs text-muted hover:text-ink shrink-0"
              aria-label="Dismiss"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
