"use client";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Wallet } from "lucide-react";

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Billetera Virtual" subtitle="Balance y retiros (Crypto/Fiat)" />
      <Card padding="lg" className="text-center py-16 bg-white border border-dashed border-gray-200">
        <Wallet className="w-16 h-16 mx-auto text-brand-primary/40 mb-4" />
        <h2 className="text-xl font-bold font-outfit mb-2">Billetera en Construcción</h2>
        <p className="text-muted max-w-md mx-auto">
          Estamos integrando los contratos inteligentes en Polygon para que puedas recibir 
          tus pagos de forma segura y retirar en moneda local.
        </p>
      </Card>
    </div>
  );
}
