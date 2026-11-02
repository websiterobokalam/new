import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Anek_Telugu, Anek_Devanagari } from "next/font/google";

export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", weight: ["500", "600", "700", "800"] });
export const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });
// Telugu and Hindi load only when glyphs are used (unicode-range), no preload.
export const anekTe = Anek_Telugu({ subsets: ["telugu"], variable: "--font-anek-te", display: "swap", preload: false });
export const anekHi = Anek_Devanagari({ subsets: ["devanagari"], variable: "--font-anek-hi", display: "swap", preload: false });
