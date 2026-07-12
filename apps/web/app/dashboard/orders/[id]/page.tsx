"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrder, getOrderTimeline } from "@/lib/api";
import type { OrderTimelineResponseDto, ProductOrderResponseDto, OrderTimelineItemDto } from "event-types";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Truck, CheckCircle2, ChevronLeft, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<ProductOrderResponseDto | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineResponseDto | null>(null);

  useEffect(() => {
    getOrder(id).then(setOrder).catch(console.error);
    getOrderTimeline(id).then(setTimeline).catch(console.error);
  }, [id]);

  if (!order) return <div className="p-8 text-center text-muted">Cargando...</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-brand-primary hover:underline text-sm font-semibold">
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Pedidos
      </button>

      <div className="flex justify-between items-start">
         <DashboardHeader 
          title={`Pedido #${order.id.slice(0,8)}`}
          subtitle={`Producto: ${order.product.name}`}
        />
        {order.sensorId && (
          <Badge variant="nature" className="animate-pulse">
            ● Seguimiento IoT Activo
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card padding="lg">
             <h3 className="text-xl font-bold font-outfit mb-6">Línea de Tiempo Logística</h3>
             <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                {timeline?.items.map((ev: OrderTimelineItemDto, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-brand-primary text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                      {ev.type === 'telemetry' ? <MapPin className="w-4 h-4"/> : <Truck className="w-4 h-4" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-border shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-foreground">{ev.event_type || ev.type}</div>
                        <time className="text-xs font-medium text-brand-primary">{format(new Date(ev.timestamp), "MMM d, HH:mm")}</time>
                      </div>
                      <div className="text-sm text-muted">
                        {ev.type === 'telemetry' 
                          ? `Temp: ${ev.temperature_celsius}°C, Shock: ${ev.shock_g_force}g` 
                          : ev.statusNote || ev.newStatus}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             {!timeline?.items?.length && <p className="text-muted text-center py-4">No hay eventos registrados aún.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="md" className="bg-brand-nature-bg border-brand-primary-light">
             <h3 className="font-bold text-brand-nature-content mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Alertas Recientes</h3>
             {timeline?.items?.filter((e: OrderTimelineItemDto) => e.type === 'telemetry').length === 0 ? (
               <p className="text-sm text-muted">No se detectaron anomalías durante el transporte.</p>
             ) : (
               <div className="text-sm text-brand-nature-content">Existen lecturas ambientales registradas.</div>
             )}
          </Card>

          <Card padding="md">
            <h3 className="font-bold mb-4">Detalles del Envío</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Transportista:</span>
                <span className="font-semibold">{order.carrierId ? `ID ${order.carrierId}` : 'No asignado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tracking N°:</span>
                <span className="font-semibold font-mono">{order.trackingNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Sensor IoT:</span>
                <span className="font-semibold">{order.sensorId || 'No asignado'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
