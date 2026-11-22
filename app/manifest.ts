import type { MetadataRoute } from "next";

/** Lets classmates add Class Hub to their home screen and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Class Hub · CPE 3C",
    short_name: "Class Hub",
    description: "CPE 3C class website",
    start_url: "/",
    display: "standalone",
    background_color: "#efefef",
    theme_color: "#ffffff",
    // The calendar fills the whole tile (no white around it), so phones can cut it into their own shape ("maskable");
    // the 3C sits inside the safe circle.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
