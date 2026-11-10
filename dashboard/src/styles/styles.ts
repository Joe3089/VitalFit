import { Montserrat, Bebas_Neue } from "next/font/google";

// Tipografias
export const montserrat = Montserrat({
  weight: ["400", "500", "700", "800"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const bebas = Bebas_Neue({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const typography = {
  h1: "text-[3rem] leading-[3.5rem] font-extrabold font-sans",
  h2: "text-[2.25rem] leading-[2.5rem] font-bold font-sans",
  h3: "text-[1.875rem] leading-[2.25rem] font-bold font-sans",
  h4: "text-[1.5rem] leading-[2rem] font-medium font-sans",
  h5: "text-[1.25rem] leading-[1.75rem] font-medium font-sans",
  body: "text-[1rem] leading-[1.5rem] font-normal font-sans",
  heading: "font-heading text-[2.5rem] tracking-wide",
};

export const colors = {
  primary: "#F27F2A", // Naranja Vital
  complementary: {
    black: "#1A1A1A", // Negro Carbón
    darkGray: "#5C5E60", // Gris Oscuro
    white: "#FFFFFF", // Blanco Puro
    lightGray: "#E5E5E5", // gris claro
  },
  accents: {
    red: "#EA232D", // Rojo Intenso
    green: "#42672D", // Verde Vital
  },
};
