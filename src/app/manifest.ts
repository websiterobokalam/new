import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Robokalam",
    short_name: "Robokalam",
    description: "Literature of Technologies. Build real tech, from age 6.",
    start_url: "/app",
    display: "standalone",
    background_color: "#F6FBFD",
    theme_color: "#0A4060",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
