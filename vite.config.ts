import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import dotenv from "dotenv";

const PROJECT_ROOT = import.meta.dirname;

// Load .env so server-side API handlers can access DATABASE_URL, JWT_SECRET, etc.
dotenv.config({ path: path.resolve(PROJECT_ROOT, ".env") });

/**
 * Vite plugin that handles /api/* requests during local dev.
 * Uses Vite's ssrLoadModule to import the API handler TypeScript
 * with full module resolution (aliases, .ts extensions, etc.).
 * For production, the API functions are pre-built with esbuild
 * and deployed as Vercel serverless functions.
 */
function apiDevPlugin(): Plugin {
  return {
    name: "api-dev",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (nodeReq: IncomingMessage, nodeRes: ServerResponse, next: () => void) => {
        const url = nodeReq.url;
        if (!url?.startsWith("/api/")) return next();

        try {
          // Determine which handler module to load
          let modulePath: string | null = null;
          if (url.startsWith("/api/trpc")) {
            modulePath = path.resolve(PROJECT_ROOT, "server/api/trpc/[...trpc].ts");
          } else if (url === "/api/auth/google" || url.startsWith("/api/auth/google?")) {
            modulePath = path.resolve(PROJECT_ROOT, "server/api/auth/google.ts");
          } else if (url.startsWith("/api/auth/callback")) {
            modulePath = path.resolve(PROJECT_ROOT, "server/api/auth/callback.ts");
          } else if (url === "/api/auth/logout") {
            modulePath = path.resolve(PROJECT_ROOT, "server/api/auth/logout.ts");
          }

          if (!modulePath) return next();

          // Load handler via Vite's SSR module loader (handles TS, aliases, etc.)
          const handlerModule = await server.ssrLoadModule(modulePath);
          const handler = handlerModule.default;
          if (typeof handler !== "function") {
            nodeRes.statusCode = 500;
            nodeRes.end("Handler module has no default export");
            return;
          }

          // Convert Node IncomingMessage → Fetch Request
          const fullUrl = new URL(url, `http://${nodeReq.headers.host || "localhost:3000"}`);
          const headers = new Headers();
          for (const [key, value] of Object.entries(nodeReq.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
          }

          let body: Buffer | undefined;
          if (nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
            body = await new Promise<Buffer>((resolve, reject) => {
              const chunks: Buffer[] = [];
              nodeReq.on("data", (chunk: Buffer) => chunks.push(chunk));
              nodeReq.on("end", () => resolve(Buffer.concat(chunks)));
              nodeReq.on("error", reject);
            });
          }

          const fetchReq = new Request(fullUrl.toString(), {
            method: nodeReq.method,
            headers,
            body,
            // @ts-ignore — duplex is needed for Node fetch with body
            duplex: body ? "half" : undefined,
          });

          // Call the handler
          const fetchRes: Response = await handler(fetchReq);

          // Convert Fetch Response → Node ServerResponse
          nodeRes.statusCode = fetchRes.status;
          fetchRes.headers.forEach((value, key) => {
            nodeRes.appendHeader(key, value);
          });

          const resBody = await fetchRes.arrayBuffer();
          nodeRes.end(Buffer.from(resBody));
        } catch (error) {
          console.error("[api-dev] Error:", error);
          if (!nodeRes.headersSent) {
            nodeRes.statusCode = 500;
            nodeRes.end(JSON.stringify({ error: "Internal Server Error" }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(PROJECT_ROOT, "client", "src"),
      "@shared": path.resolve(PROJECT_ROOT, "shared"),
    },
  },
  root: path.resolve(PROJECT_ROOT, "client"),
  publicDir: path.resolve(PROJECT_ROOT, "client", "public"),
  build: {
    outDir: path.resolve(PROJECT_ROOT, "dist/public"),
    emptyOutDir: true,
  },
});
