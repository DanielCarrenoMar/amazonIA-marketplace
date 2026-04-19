"use client";

import { useState } from "react";
import { DesignSystem } from "../components/DesignSystem";
import { Button } from "../components/ui/Button";

export default function Home() {
  const [showDesignSystem, setShowDesignSystem] = useState(false);

  if (showDesignSystem) {
    return <DesignSystem onBack={() => setShowDesignSystem(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center relative p-8 md:p-24">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-10 max-w-4xl">
          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full pt-4">
            <Button 
              onClick={() => setShowDesignSystem(true)}
              variant="outline"
              size="lg"
              className="bg-brand-nature-bg hover:bg-brand-primary-light"
            >
              🎨 Guía de Estilos
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
