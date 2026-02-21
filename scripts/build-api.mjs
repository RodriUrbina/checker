import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const functionsDir = resolve(root, ".vercel/output/functions");

const vcConfig = JSON.stringify({
  runtime: "edge",
  entrypoint: "index.mjs",
});

const entries = [
  { entryPoint: "server/api/trpc/[...trpc].ts", funcPath: "api/trpc/[...trpc].func" },
  { entryPoint: "server/api/auth/google.ts", funcPath: "api/auth/google.func" },
  { entryPoint: "server/api/auth/callback.ts", funcPath: "api/auth/callback.func" },
  { entryPoint: "server/api/auth/logout.ts", funcPath: "api/auth/logout.func" },
];

for (const entry of entries) {
  const funcDir = resolve(functionsDir, entry.funcPath);
  mkdirSync(funcDir, { recursive: true });

  await build({
    entryPoints: [resolve(root, entry.entryPoint)],
    outfile: resolve(funcDir, "index.mjs"),
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    // Bundle ALL dependencies for self-contained edge functions
    alias: {
      "@shared": resolve(root, "shared"),
    },
    sourcemap: false,
    minify: true,
  });

  writeFileSync(resolve(funcDir, ".vc-config.json"), vcConfig);
  console.log(`  Built ${entry.funcPath}`);
}

console.log("API functions built successfully.");
