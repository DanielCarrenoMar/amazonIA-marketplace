"use client";

import { useState } from "react";
import { DesignSystem } from "../components/DesignSystem";
import { Button } from "../components/ui/Button";
import { LandingPage } from "../components/landing/LandingPage";

export default function Home() {
  const [showDesignSystem, setShowDesignSystem] = useState(false);

  if (showDesignSystem) {
    return <DesignSystem onBack={() => setShowDesignSystem(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans overflow-hidden -mt-24">
      <main className="flex-1 w-full flex flex-col">
        <LandingPage />
        <div className="flex justify-center py-12">
          <Button
            onClick={() => setShowDesignSystem(true)}
            variant="outline"
            size="lg"
            className="bg-brand-nature-bg hover:bg-brand-primary-light"
          >
            🎨 Ver Guía de Estilos
          </Button>
        </div>
      </main>
    </div>
  );
}
