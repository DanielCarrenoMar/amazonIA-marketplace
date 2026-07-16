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
            <button className="bg-[#FFB700] hover:bg-[#F2AE00] text-white font-bold text-[15px] px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(255,183,0,0.4)] transition-all flex items-center gap-2 border-none cursor-pointer">
              <span className="text-[22px] leading-none font-bold">+</span> Añadir Nueva Artesanía
            </button>
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

      <div className="flex flex-col gap-8">
        {/* Tus Tareas */}
        <div className="space-y-4">
          <h3 className="text-lg font-outfit font-bold">Tus Tareas</h3>
          {tasks.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}
