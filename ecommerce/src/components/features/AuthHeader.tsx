import Image from "next/image";
import React from "react";
import { colors } from "@/styles/styles";

const AuthHeader: React.FC = () => {
  const componentStyles: { [key: string]: React.CSSProperties } = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    },
    logo: {
      marginBottom: "0.5rem",
    },
    title: {
      fontSize: "2.5rem", // Cambiado a 2.5rem
      fontFamily: "'Bebas Neue', sans-serif", // Fuente directa
      color: colors.complementary.black,
      letterSpacing: "0.05em", // Ajuste para el tracking
    },
  };

  return (
    <div style={componentStyles.container}>
      <div style={componentStyles.logo}>
        <Image
          src="/images/isotipo 1.svg"
          alt="Logo"
          width={150}
          height={150}
        />
      </div>
      <h1 style={componentStyles.title} className="tracking-wide">
        Iniciar sesión
      </h1>
    </div>
  );
};

export default AuthHeader;
