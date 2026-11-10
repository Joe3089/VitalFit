// components/SectionAlternada.tsx
import React from "react";
import Image from "next/image";

interface SectionAboutUsProps {
  sections: {
    id: number;
    title: string;
    content: React.ReactNode;
    imageUrl: string;
    imageAlt: string;
    bgColor?: string;
    textColor?: string;
  }[];
}

const SectionAboutUs: React.FC<SectionAboutUsProps> = ({ sections }) => {
  return (
    <div className="w-full mb-30">
      <h2 className="text-center text-5xl md:text-7xl font-bold mb-20 mt-20">
        <span className="text-[#F27F2A] prevent-clip">Sobre</span>{" "}
        <span className="text-gray-900 prevent-clip">Nosotros</span>
      </h2>
      {sections.map((section, index) => {
        const isEven = index % 2 === 0;

        return (
          <section key={section.id} className="w-full">
            <div
              className={`max-w-7xl mx-auto ${section.bgColor || "bg-gray-50"} ${section.textColor || "text-gray-900"}`}
            >
              <div
                className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center`}
              >
                {/* Contenido de texto */}
                <div
                  className={`w-full lg:w-1/2 p-8 lg:p-12 ${isEven ? "lg:pr-12" : "lg:pl-12"}`}
                >
                  <h2 className="font-bold text-4xl md:text-6xl text-center py-5">
                    <span className="prevent-clip">{section.title}</span>
                  </h2>
                  <div className="text-lg leading-relaxed space-y-4">
                    {section.content}
                  </div>
                </div>

                {/* Imagen */}
                <div className="w-full lg:w-1/2 h-64 lg:h-full min-h-[400px] relative">
                  <Image
                    src={section.imageUrl}
                    alt={section.imageAlt}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SectionAboutUs;
