import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Anek_Telugu, Anek_Devanagari, Cinzel, Caveat } from "next/font/google";

export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", weight: ["500", "600", "700", "800"] });
export const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });
// Telugu and Hindi load only when glyphs are used (unicode-range), no preload.
export const anekTe = Anek_Telugu({ subsets: ["telugu"], variable: "--font-anek-te", display: "swap", preload: false });
export const anekHi = Anek_Devanagari({ subsets: ["devanagari"], variable: "--font-anek-hi", display: "swap", preload: false });
// Wordmark only: closest open font to the flared capitals of the ROBOKALAM logo. Replace with the official logo font file if you have it.
export const brand = Cinzel({ subsets: ["latin"], variable: "--font-brand", display: "swap", weight: ["700"] });
// Handwritten margin notes in the hero notebook only. Not preloaded.
export const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap", weight: ["500", "700"], preload: false });
