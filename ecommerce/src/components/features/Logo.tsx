import React from "react";
import Image from "next/image";

interface LogoProps {
  slogan: boolean;
  theme?: "light" | "dark";
  width?: number;
}

const Logo: React.FC<LogoProps> = ({ slogan, width, theme }) => {
  let imgPATH = slogan
    ? "/images/logo-vitalfit-white.png"
    : "/images/isotipo.png";

  if (theme === "dark") {
    imgPATH = "/images/logo-vitalfit.png";
  } else if (theme === "light") {
    imgPATH = "/images/logo-vitalfit-white.png";
  }

  return (
    <div className="flex justify-center w-full">
      <Image
        alt="Logo"
        src={imgPATH}
        width={width || 180}
        height={width ? width * 0.5 : 100}
        className="object-contain"
      />
    </div>
  );
};

export default Logo;
