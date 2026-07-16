"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { getProductById, getProductMetrics } from "@/lib/api";
import type { ProductResponseDto, ProductMetricsDto } from "event-types";
import { DollarSign, Eye, ShoppingCart, Star, Edit } from "lucide-react";

export default function ProductDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [metrics, setMetrics] = useState<ProductMetricsDto | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodData, metricsData] = await Promise.all([
          getProductById(id),
          getProductMetrics(id)
        ]);
        
        setProduct(prodData);
        setMetrics(metricsData);
      } catch (err: any) {
        toast({ title: "Error al cargar datos", description: err.message, variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

  if (loading || !product || !metrics) {
    return <div className="p-8 text-center text-muted">Cargando información del producto...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/inventory")} className="text-muted">
          ← Volver
        </Button>
        <div className="flex-1">
          <DashboardHeader 
            title={product.name} 
            subtitle="Detalles y rendimiento"
            action={
              <Button variant="primary" onClick={() => router.push(`/dashboard/inventory/${id}/edit`)} className="flex items-center gap-2 shadow-sm">
                <Edit className="w-4 h-4" /> Editar Producto
              </Button>
            }
          />
        </div>
      </div>

      {/* Metrics Section Directly Visible (No Tabs) */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            icon={<DollarSign className="w-6 h-6" />} 
            label="Ingresos Totales" 
            value={`$${metrics.totalRevenue.toFixed(2)}`} 
            variant="highlight"
          />
          <StatsCard 
            icon={<ShoppingCart className="w-6 h-6" />} 
            label="Ventas Realizadas" 
            value={metrics.totalSales.toString()} 
          />
          <StatsCard 
            icon={<Eye className="w-6 h-6" />} 
            label="Vistas (Estimadas)" 
            value={metrics.totalViews.toString()} 
          />
          <StatsCard 
            icon={<Star className="w-6 h-6" />} 
            label="Calificación Promedio" 
            value={`${metrics.averageRating.toFixed(1)} / 5`} 
            subtitle={`${metrics.totalReviews} reseñas`}
          />
        </div>

        <Card padding="lg" className="border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-4">Actividad Reciente (Últimos 7 días)</h3>
          <div className="h-64 flex items-end gap-2">
            {metrics.salesByDate.map((item, idx) => {
              const maxSales = Math.max(...metrics.salesByDate.map(i => i.sales), 1);
              const heightPercentage = (item.sales / maxSales) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
                  <span className="text-xs text-muted">{item.sales}</span>
                  <div 
                    className="w-full bg-brand-primary rounded-t-md transition-all duration-500 hover:bg-brand-primary-dark"
                    style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                  />
                  <span className="text-[10px] text-muted rotate-45 mt-2 origin-left">{item.date.split('-').slice(1).join('/')}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
