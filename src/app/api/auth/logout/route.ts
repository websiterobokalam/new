import { handler, ok } from "@/lib/api";
import { endSession } from "@/lib/auth/session";
export const POST = handler(async () => { await endSession(); return ok(); });
