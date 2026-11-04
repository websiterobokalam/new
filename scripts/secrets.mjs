// Prints fresh random secrets to paste into hPanel → Environment variables.
//   npm run secrets
import { randomBytes } from "node:crypto";
const s = (n) => randomBytes(n).toString("hex");
console.log(`SESSION_SECRET=${s(32)}`);
console.log(`CRON_SECRET=${s(16)}`);
console.log("\nKeep these private. Changing SESSION_SECRET signs everyone out.");
