import { build } from "esbuild";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
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
});

// Wrapper that converts Node.js (req, res) to Fetch API (Request) -> Response
const wrapper = `
import { Readable } from 'node:stream';
import handler from './fn.mjs';

export default async function(req, res) {
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = new URL(req.url, proto + '://' + host);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? 'half' : undefined,
    });

    const response = await handler(request);

    res.statusCode = response.status;
    for (const [key, value] of response.headers) {
      res.appendHeader(key, value);
    }

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Function error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
    }
    res.end('Internal Server Error');
  }
}
`.trim();

const entries = [
  { entryPoint: "server/api/trpc/[...trpc].ts", funcPath: "api/trpc/[...trpc].func" },
  { entryPoint: "server/api/auth/google.ts", funcPath: "api/auth/google.func" },
  { entryPoint: "server/api/auth/callback.ts", funcPath: "api/auth/callback.func" },
  { entryPoint: "server/api/auth/logout.ts", funcPath: "api/auth/logout.func" },
];

for (const entry of entries) {
  const funcDir = resolve(functionsDir, entry.funcPath);
  mkdirSync(funcDir, { recursive: true });

  // Build the actual handler to fn.mjs
  await build({
    entryPoints: [resolve(root, entry.entryPoint)],
    outfile: resolve(funcDir, "fn.mjs"),
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    alias: {
      "@shared": resolve(root, "shared"),
    },
    sourcemap: false,
    minify: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
  });

  // Write the Node.js <-> Fetch API adapter wrapper
  writeFileSync(resolve(funcDir, "index.mjs"), wrapper);
  writeFileSync(resolve(funcDir, ".vc-config.json"), vcConfig);
  console.log(`  Built ${entry.funcPath}`);
}

console.log("API functions built successfully.");
