export type Check = { id: string; area: string; label: string; ok: boolean; severity: "blocker" | "warn"; detail: string; fix: string };
export const COMPANY: string;
export function isLiveSite(env?: Record<string, string | undefined>): boolean;
export function envChecks(env?: Record<string, string | undefined>, now?: Date): Check[];
export function dbChecks(q: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>, expectedMigrations?: number): Promise<Check[]>;
export function summarise(checks: Check[]): { total: number; passed: number; blockers: Check[]; warnings: Check[]; ready: boolean };
