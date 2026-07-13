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
          <Button
            variant="primary"
            className="mb-5 group rounded-full!"
            rightIcon={<Icon icon="lucide:arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />}
          >
            Explorar herramientas
          </Button>

          {/* Bottom text */}
          <p className="text-xs text-white/80 drop-shadow-sm">
            Todo lo que necesitas para gestionar tu comunidad.
          </p>
        </div>
      </div>
    </div>
  );
}
