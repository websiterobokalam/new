import { HttpError, requireAccount } from "./api";

export async function requireRole(...roles: string[]) {
  const a = await requireAccount();
  if (!roles.includes(a.role)) throw new HttpError(403, "Not allowed");
  return a;
}
