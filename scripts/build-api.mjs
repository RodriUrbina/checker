import { build } from "esbuild";
import { rmSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "api");

// Clean output
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const entries = [
  { entryPoint: "server/api/trpc/[...trpc].ts", outfile: "api/trpc/[...trpc].mjs" },
  { entryPoint: "server/api/auth/google.ts", outfile: "api/auth/google.mjs" },
  { entryPoint: "server/api/auth/callback.ts", outfile: "api/auth/callback.mjs" },
  { entryPoint: "server/api/auth/logout.ts", outfile: "api/auth/logout.mjs" },
];

for (const entry of entries) {
  await build({
    entryPoints: [resolve(root, entry.entryPoint)],
    outfile: resolve(root, entry.outfile),
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    // Bundle ALL dependencies for self-contained serverless functions
    alias: {
      "@shared": resolve(root, "shared"),
    },
    sourcemap: false,
    minify: false,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
  });
  console.log(`  Built ${entry.outfile}`);
}

console.log("API functions built successfully.");
