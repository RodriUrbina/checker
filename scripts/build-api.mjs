import { build } from "esbuild";
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// On Vercel infra the build output is at /vercel/output, locally at .vercel/output
const outputBase = existsSync("/vercel/output")
  ? "/vercel/output"
  : resolve(root, ".vercel/output");
const functionsDir = resolve(outputBase, "functions");

const vcConfig = JSON.stringify({
  runtime: "nodejs20.x",
  handler: "index.mjs",
  launcherType: "Nodejs",
  supportsResponseStreaming: true,
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
    // Bundle ALL dependencies for self-contained functions
    alias: {
      "@shared": resolve(root, "shared"),
    },
    sourcemap: false,
    minify: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
  });

  writeFileSync(resolve(funcDir, ".vc-config.json"), vcConfig);
  console.log(`  Built ${entry.funcPath}`);
}

console.log("API functions built successfully.");
