import React from "react";
import { HeroSection } from "./HeroSection";
import { SummarySection } from "./SummarySection";
import { ToolsSection } from "./ToolsSection";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { ImpactSection } from "./ImpactSection";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <SummarySection />
      <ToolsSection />
      <FeaturedProductsSection />
      <ImpactSection />
    </>
  );
}