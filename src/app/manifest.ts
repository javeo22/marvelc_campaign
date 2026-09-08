import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Core Protocol Companion",
    short_name: "Core Protocol",
    description: "Offline-first campaign companion for physical Core Protocol play.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F1E4",
    theme_color: "#0C1F3D",
    icons: [
      {
        src: "/original-ui-only/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
