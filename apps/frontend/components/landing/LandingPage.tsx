import React from "react";
import { HeroSection } from "./HeroSection";
import { SummarySection } from "./SummarySection";
import { ToolsSection } from "./ToolsSection";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <SummarySection />
      <ToolsSection />
    </>
  );
}