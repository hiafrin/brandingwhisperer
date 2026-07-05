import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Runs the /api/generate serverless function locally during `vite dev`,
// so the app behaves the same as it will on Vercel. The API key is read
// from a local .env file (which is gitignored and never pushed).
function localApi(env) {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api/generate", async (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch (_) {
            req.body = {};
          }
          // Adapt Node's raw response to the Vercel-style res.status().json() API.
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (obj) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(obj));
          };
          // Make the key available to the handler, which reads process.env.
          process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
          const mod = await import("./api/generate.js");
          await mod.default(req, res);
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), localApi(env)],
  };
});
