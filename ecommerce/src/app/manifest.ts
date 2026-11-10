import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VITALFIT GYM",
    short_name: "VITALFIT",
    description: "Reserva clases y gestiona tu membresía",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",

    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    shortcuts: [
      {
        name: "Inicio",
        short_name: "Inicio",
        description: "Ir a la página principal",
        url: "/",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Ver Sucursales",
        short_name: "Sucursales",
        description: "Encuentra tu gimnasio",
        url: "/es/branches",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
