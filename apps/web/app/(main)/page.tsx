"use client";

import { LandingPage } from "../../components/landing/LandingPage";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans overflow-hidden -mt-24">
      <main className="flex-1 w-full flex flex-col">
        <LandingPage />
      </main>
    </div>
  );
}
