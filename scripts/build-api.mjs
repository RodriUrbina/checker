import { build } from "esbuild";
import { rmSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "api-dist");

// Clean output
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const entries = [
  { entryPoint: "api/trpc/[...trpc].ts", outfile: "api-dist/trpc/[...trpc].mjs" },
  { entryPoint: "api/auth/google.ts", outfile: "api-dist/auth/google.mjs" },
  { entryPoint: "api/auth/callback.ts", outfile: "api-dist/auth/callback.mjs" },
  { entryPoint: "api/auth/logout.ts", outfile: "api-dist/auth/logout.mjs" },
];

for (const entry of entries) {
  await build({
    entryPoints: [resolve(root, entry.entryPoint)],
    outfile: resolve(root, entry.outfile),
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    // Keep node_modules as external — Vercel installs them
    packages: "external",
    // Resolve path aliases
    alias: {
      "@shared": resolve(root, "shared"),
    },
    sourcemap: false,
    minify: false,
  });
  console.log(`  Built ${entry.outfile}`);
}

console.log("API functions built successfully.");
