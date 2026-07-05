import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Runs the serverless functions in /api locally during `vite dev`, so the
// app behaves the same as it will on Vercel. Secrets are read from a local
// .env file (which is gitignored and never pushed).
function localApi(env) {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        if (req.method !== "POST") return next();
        // "/generate" → api/generate.js, "/email" → api/email.js
        const name = (req.url || "").split("?")[0].replace(/^\//, "");
        if (!/^[a-z]+$/.test(name)) return next();
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
          // Make secrets available to the handler, which reads process.env.
          // (Assigning undefined to process.env would store the string "undefined".)
          for (const key of ["ANTHROPIC_API_KEY", "SHEETS_WEBHOOK_URL"]) {
            if (env[key]) process.env[key] = env[key];
            else delete process.env[key];
          }
          try {
            const mod = await import(`./api/${name}.js`);
            await mod.default(req, res);
          } catch (_) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Not found" }));
          }
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
