import { Permission } from "@vitalfit/sdk";
export type Roles = {
  id: string;
  name: string;
  description: string;
  Permission: Permission[];
};

export const PERMITS_ROLES: { key: string; label: string }[] = [
  {
    key: "inscripcion",
    label: "Inscripción totalmente gratuita por tiempo limitado.",
  },
  {
    key: "membresia",
    label:
      "Membresía flexible con un periodo mínimo de cancelación de solo 1 mes",
  },
  {
    key: "entrenador",
    label:
      "Acceso a entrenador personal de planta sin costo adicional en cada horario",
  },
  {
    key: "seguridad",
    label: "Compromiso con la seguridad: Instalaciones seguras y monitoreadas",
  },
  { key: "adultos", label: "Clases especializadas para adultos +50 años" },
  {
    key: "amigo",
    label:
      "Beneficio 'Trae un amigo': 15 días de acceso gratuito para un acompañante.",
  },
  {
    key: "grupales",
    label:
      "Diversidad de clases grupales incluidas: Baile, Boxeo, Yoga, y más.",
  },
  {
    key: "estacionamiento",
    label: "Estacionamiento exclusivo/gratuito para miembros.",
  },
];
