import { build } from "esbuild";
import { mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Debug: find the correct output directory on Vercel
console.log("  [debug] root:", root);
console.log("  [debug] cwd:", process.cwd());
console.log("  [debug] VERCEL:", process.env.VERCEL);

// Check possible output locations
const candidates = [
  resolve(root, ".vercel/output"),
  "/vercel/output",
  resolve(root, ".vercel/output0"),
];
for (const c of candidates) {
  console.log(`  [debug] ${c} exists:`, existsSync(c));
  if (existsSync(c)) {
    try {
      console.log(`  [debug] ${c} contents:`, readdirSync(c));
    } catch (e) {
      console.log(`  [debug] ${c} readdir error:`, e.message);
    }
  }
}

// Use /vercel/output on Vercel infra, .vercel/output locally
const outputBase = existsSync("/vercel/output")
  ? "/vercel/output"
  : resolve(root, ".vercel/output");
const functionsDir = resolve(outputBase, "functions");

console.log("  [debug] functionsDir:", functionsDir);

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

// Debug: verify output
console.log("  [debug] functionsDir contents:", readdirSync(functionsDir));
console.log("API functions built successfully.");
