import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frontendPort = parseInt(env.PORT_FRONTEND ?? "5173", 10);
  const backendPort = parseInt(env.PORT_BACKEND ?? "3001", 10);

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        "/api": `http://localhost:${backendPort}`,
        "/health": `http://localhost:${backendPort}`,
      },
    },
  };
});
