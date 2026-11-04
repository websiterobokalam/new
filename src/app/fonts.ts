import { Poppins, JetBrains_Mono, Anek_Telugu, Anek_Devanagari, Cinzel } from "next/font/google";

// Poppins: the typeface of the original robokalam.com and of Vedantu. Headings and body.
export const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", display: "swap", weight: ["400", "500", "600", "700", "800"] });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });
// Telugu and Hindi load only when glyphs are used (unicode-range), no preload.
export const anekTe = Anek_Telugu({ subsets: ["telugu"], variable: "--font-anek-te", display: "swap", preload: false });
export const anekHi = Anek_Devanagari({ subsets: ["devanagari"], variable: "--font-anek-hi", display: "swap", preload: false });
// Wordmark only: closest open font to the flared capitals of the ROBOKALAM logo.
export const brand = Cinzel({ subsets: ["latin"], variable: "--font-brand", display: "swap", weight: ["700"] });
