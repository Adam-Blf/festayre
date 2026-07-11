/**
 * manifest.ts, manifeste PWA genere par Next (route /manifest.webmanifest).
 * C'est lui qui rend Festayre installable sur l'ecran d'accueil.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Festayre, les ferias du Sud-Ouest",
    short_name: "Festayre",
    description:
      "Toilettes, alcool pas cher, programme et meteo de toutes les ferias du Sud-Ouest.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf6f0",
    theme_color: "#c8102e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
