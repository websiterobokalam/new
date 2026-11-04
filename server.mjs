// Entry file for Hostinger (hPanel → Node.js app → Entry file: server.mjs).
//
// Hostinger runs `next start` when no entry file is set, which would skip our
// launch checks and database updates. This file runs them first, then serves
// the built site on the port Hostinger gives us (PORT).
//
//   1. scripts/preflight.mjs --on-start  launch checks; on https://robokalam.com a
//                                        blocker stops the start (see docs/PHASE-6.md)
//   2. scripts/migrate.mjs --on-start    creates or updates tables; never blocks
//   3. Next.js production server
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
process.chdir(root);
process.env.NODE_ENV ||= "production";

const run = (script) => spawnSync(process.execPath, [script, "--on-start"], { stdio: "inherit", env: process.env, cwd: root });

const pre = run("scripts/preflight.mjs");
if (pre.status !== 0) {
  console.error("[server] Launch checks failed, so the live site was not started. See the [preflight] lines above.");
  process.exit(pre.status ?? 1);
}
run("scripts/migrate.mjs");

const { default: next } = await import("next");
const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir: root, port });
await app.prepare();
const handle = app.getRequestHandler();
createServer((req, res) => handle(req, res)).listen(port, () => {
  console.log(`[server] Robokalam is running on port ${port}`);
});
