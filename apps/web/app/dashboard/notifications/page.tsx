"use client";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Notificaciones" subtitle="Mantente al día de tu cuenta" />
      <Card padding="lg" className="text-center py-16 bg-white border border-dashed border-gray-200">
        <Bell className="w-16 h-16 mx-auto text-brand-primary/40 mb-4" />
        <h2 className="text-xl font-bold font-outfit mb-2">Bandeja de Notificaciones</h2>
        <p className="text-muted max-w-md mx-auto">
          Aquí aparecerán las alertas de ventas, mensajes de compradores y avisos del sistema.
        </p>
      </Card>
    </div>
  );
}
