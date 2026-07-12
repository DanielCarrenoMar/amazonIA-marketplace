"use client";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Configuración" subtitle="Ajustes de cuenta y perfil" />
      <Card padding="lg" className="text-center py-16 bg-white border border-dashed border-gray-200">
        <Settings className="w-16 h-16 mx-auto text-brand-primary/40 mb-4" />
        <h2 className="text-xl font-bold font-outfit mb-2">Configuración</h2>
        <p className="text-muted max-w-md mx-auto">
          Esta sección permitirá actualizar tu perfil, contraseña y preferencias de la cuenta.
        </p>
      </Card>
    </div>
  );
}
