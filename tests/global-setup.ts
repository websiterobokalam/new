import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Reset the test database and load sample fixtures before each run. */
export default function globalSetup() {
  const env = Object.fromEntries(readFileSync("scripts/test.env", "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split(/=(.*)/s).slice(0, 2)));
  execFileSync("node", ["scripts/migrate.mjs", "--reset", "--sample"], { env: { ...process.env, ...env }, stdio: "inherit" });
}
