import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Robokalam",
    short_name: "Robokalam",
    description: "Literature of Technologies. Build real tech, from age 6.",
    start_url: "/app",
    display: "standalone",
    background_color: "#F2F6FF",
    theme_color: "#00445F",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
