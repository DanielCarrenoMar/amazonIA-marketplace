"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Users, UserPlus, Clock } from "lucide-react";
import { getMyCreationRequests, getTribeMembershipRequests } from "@/lib/api";

export default function OnboardingPage() {
  const { user, isLoading, isBuyer } = useAuth();
  const router = useRouter();
  
  const [hasPendingCreation, setHasPendingCreation] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isBuyer) {
        router.push("/dashboard");
      } else {
        // Check if there are pending creation requests
        getMyCreationRequests().then(requests => {
          const pending = requests.find(r => r.status === "PENDING_APPROVAL");
          if (pending) {
            setHasPendingCreation(true);
          }
        }).catch(err => console.error("Failed to check creation requests:", err));
      }
    }
  }, [user, isLoading, isBuyer, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-outfit font-bold text-foreground mb-4">
          ¡Bienvenido a AmazonIA Marketplace!
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Para comenzar a vender tus productos artesanales, necesitas ser parte de una Tribu. 
          Puedes unirte a una existente o crear la tuya propia.
        </p>
      </div>

      {hasPendingCreation && (
        <Card className="mb-8 p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-4 text-amber-800">
            <Clock className="w-8 h-8 shrink-0" />
            <div>
              <h3 className="font-bold font-outfit text-lg">Solicitud en revisión</h3>
              <p className="text-sm">
                Tienes una solicitud de creación de tribu pendiente de aprobación por un administrador. 
                Te notificaremos cuando sea revisada.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 flex flex-col items-center text-center hover:border-brand-primary/50 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-outfit mb-3">Unirse a una Tribu</h2>
          <p className="text-muted mb-8 grow">
            Busca tribus activas en tu región y envía una solicitud para unirte como vendedor.
          </p>
          <Link href="/onboarding/join-tribe" className="w-full">
            <Button variant="outline" className="w-full">Explorar Tribus</Button>
          </Link>
        </Card>

        <Card className="p-8 flex flex-col items-center text-center hover:border-brand-primary/50 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-outfit mb-3">Crear nueva Tribu</h2>
          <p className="text-muted mb-8 grow">
            ¿No encuentras una tribu en tu área? Solicita crear una nueva y conviértete en su líder.
          </p>
          <Link href="/onboarding/create-tribe" className="w-full">
            <Button variant="primary" className="w-full" disabled={hasPendingCreation}>
              Solicitar Creación
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
