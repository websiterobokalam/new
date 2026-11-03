import { notFound } from "next/navigation";
import { appContext } from "../app";
import { staffFor, type Staff } from "./core";

/** For school portal pages: signed-in staff of an active school, or 404. */
export async function schoolContext(next: string, ...roles: Staff["role"][]) {
  const { account } = await appContext(next, "school");
  const staff = await staffFor(account);
  if (!staff || (roles.length && !roles.includes(staff.role))) notFound();
  return { account, staff };
}

export const ist = (d: Date | string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) =>
  new Date(d).toLocaleString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });

export const WORLD_LABEL: Record<string, string> = { robotics: "Robotics", iot: "IoT", ai: "AI", coding: "Coding", finlit: "Financial Literacy", space: "Space" };
export const WORLD_OPTIONS: [string, string][] = Object.entries(WORLD_LABEL);
export const CATEGORY_LABEL: Record<string, string> = { kit_missing: "Kit missing or short", device: "Laptop or tablet", robot: "Robot", sensor: "Sensor or component", network: "Network or internet", furniture: "Furniture or power", other: "Something else" };
export const STATUS_LABEL: Record<string, string> = { open: "Open", acknowledged: "Seen by Robokalam", dispatched: "Replacement on the way", resolved: "Marked fixed, please confirm", closed: "Closed" };
