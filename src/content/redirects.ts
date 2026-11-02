/** Typed view of src/content/redirects.json (the JSON is read directly by next.config.mjs). */
import data from "./redirects.json";

export type Redirect = { from: string; to: string; verified: boolean };
export const legacyRedirects: Redirect[] = data.redirects;
