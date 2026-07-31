import type { MetadataRoute } from "next";

/** §21 — PWA instalável: ícone na tela inicial, abre em tela cheia sem barra do navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PROSPECTA Finance",
    short_name: "PROSPECTA",
    description: "Gestão financeira pessoal e familiar",
    start_url: "/painel",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
