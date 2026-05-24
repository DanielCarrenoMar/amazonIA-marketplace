import React from "react";
import Image from "next/image";

export function HeroSection() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[80vh] md:h-screen overflow-hidden">
        <Image
          src="/landingpageimage.jpg"
          alt="AmazonIA Marketplace Hero"
          fill
          className="object-cover object-center hover:scale-105 transition-transform duration-700"
          priority
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            Bienvenido a AmazonIA
          </h1>
          <p className="text-lg md:text-2xl text-white/90 max-w-2xl drop-shadow-md">
            Esta es la landing page
          </p>
        </div>
      </div>
    </div>
  );
}
