"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { getSellerMetrics, getSellerOrders } from "@/lib/api";
import type { SellerMetricsResponseDto, ProductOrderResponseDto } from "event-types";
import { DashboardHeader, StatsCard } from "@/components/dashboard";
import { DollarSign, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { OrderCard } from "@/components/dashboard/OrderCard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SellerMetricsResponseDto | null>(null);
  const [tasks, setTasks] = useState<ProductOrderResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, orders] = await Promise.all([
          getSellerMetrics(),
          getSellerOrders(new URLSearchParams({ limit: "10" }))
        ]);
        setMetrics(m);
        setTasks(orders.data.filter(o => o.currentStatus === 'PAID'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-y-4 flex-col">Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      <DashboardHeader 
        title={`Hola, ${user?.fullName?.split(' ')[0] || 'Artesano'}`}
        subtitle="Aquí está el resumen de tu actividad en AmazonIA."
        action={
          <Link href="/dashboard/inventory/new">
            <Button variant="primary">+ Añadir Nueva Artesanía</Button>
          </Link>
        }
      />

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          icon={<DollarSign className="w-6 h-6" />}
          label="Dinero listo para cobrar"
          value={`$${metrics?.readyToPayout?.toFixed(2) || '0.00'}`}
          subtitle="Total disponible en tu billetera virtual."
          variant="highlight"
        />
        <StatsCard 
          icon={<TrendingUp className="w-6 h-6" />}
          label="Vendiste este mes"
          value={`$${metrics?.soldThisMonth?.toFixed(2) || '0.00'}`}
        />
        <StatsCard 
          icon={<Wallet className="w-6 h-6" />}
          label="Dinero en espera"
          value={`$${metrics?.pendingRelease?.toFixed(2) || '0.00'}`}
          subtitle="Se liberará cuando el cliente reciba la obra."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tus Tareas */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-outfit font-bold">Tus Tareas</h3>
          {tasks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-urgency-dark bg-brand-urgency/10 px-3 py-1.5 rounded-lg w-fit text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" /> REQUIERE TU ACCIÓN
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map(task => (
                  <OrderCard key={task.id} order={task} viewMode="seller" />
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center bg-gray-50/50 border-dashed border-gray-200">
              <p className="text-muted">No tienes tareas pendientes por ahora.</p>
            </Card>
          )}
        </div>

        {/* Avisos */}
        <div className="space-y-4">
          <h3 className="text-lg font-outfit font-bold">Avisos</h3>
          <Card className="bg-brand-secondary/5 border-brand-secondary/20 p-5">
            <h4 className="font-semibold text-brand-secondary-dark mb-2">Consejo de Venta</h4>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Las artesanías con 3 o más fotos se venden un 40% más rápido. 
              Asegúrate de mostrar los detalles de tu trabajo.
            </p>
            <Link href="/dashboard/inventory">
              <Button variant="outline" size="sm" className="w-full">
                Revisar mi Inventario
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
