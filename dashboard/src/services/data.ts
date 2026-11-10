import { Service } from "@/models/service";
export const ServicesData: (Service & {
  featured?: boolean;
  imagePaths?: string[];
})[] = [
  {
    id: "001",
    name: "Clase de Yoga Vinyasa",
    categoryId: "Clases Grupales",
    durationMinutes: 5,
    featured: true,
    imagePaths: ["/images/probeBanner.png", "/images/probeBanner.png"],
  },
  {
    id: "002",
    name: "Plan Nutricional Básico",
    categoryId: "Nutrición",
    durationMinutes: 5,
    featured: true,
    imagePaths: ["/images/probeBanner.png"],
  },
  {
    id: "004",
    name: "Acceso a Sala de Pesas",
    categoryId: "Acceso Gimnasio",
    durationMinutes: null,
    featured: false,
    imagePaths: ["/images/probeBanner.png"],
  },
  {
    id: "005",
    name: "Acceso a Sala de Pesas",
    categoryId: "Acceso Gimnasio",
    durationMinutes: null,
    featured: false,
    imagePaths: [],
  },
];
