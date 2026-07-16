import React from "react";
import Image from "next/image";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "@iconify/react";

export function HeroSection() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[80vh] md:h-screen overflow-hidden">
        <Image
          src="/landingpageimage.jpg"
          alt="AmazonIA Marketplace Hero"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/30 md:bg-black/40 flex flex-col items-center justify-center text-center px-4">

          {/* Badge */}
          <Badge variant="secondary" className="mb-6 bg-brand-secondary/90! backdrop-blur-sm! text-white! shadow-md">
            Para comunidades indígenas
          </Badge>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 drop-shadow-xl max-w-4xl leading-tight md:leading-tight lg:leading-[1.2]">
            Potencia tu economía, preserva tu cultura y conecta con el mundo.
          </h1>

          {/* Subheadline */}
          <p className="text-sm md:text-lg text-white/90 max-w-2xl mb-8 drop-shadow-md font-medium px-4">
            Accede a un mercado de comercio justo y utiliza herramientas de IA para proteger
            el saber ancestral de tu comunidad.
          </p>

          {/* CTA Button */}
          <a
            href="#soluciones"
            className="inline-flex items-center px-6 py-3 text-base justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-brand-primary text-white hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/20 mb-5 group rounded-full"
          >
            <span>
              Explorar soluciones
            </span>
            <Icon icon="lucide:arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </a>

          {/* Bottom text */}
          <p className="text-xs text-white/80 drop-shadow-sm">
            Todo lo que necesitas para gestionar tu comunidad.
          </p>
        </div>
      </div>
    </div>
  );
}
