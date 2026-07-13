"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrder, getOrderTimeline, updateOrder, getSpatialRisk } from "@/lib/api";
import type { OrderTimelineResponseDto, ProductOrderResponseDto, OrderTimelineItemDto } from "event-types";
import { DashboardHeader, LogisticsRiskPanel, ShipmentModal } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Truck, CheckCircle2, ChevronLeft, AlertTriangle, Cpu } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<ProductOrderResponseDto | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineResponseDto | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  
  // Inference State
  const [riskData, setRiskData] = useState<any>(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  const fetchOrderDetails = () => {
    getOrder(id).then(setOrder).catch(console.error);
    getOrderTimeline(id).then(setTimeline).catch(console.error);
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  useEffect(() => {
    if (order && user?.id === order.product?.seller?.user?.id && !riskData && !isRiskLoading && !riskError) {
      // Usamos una coordenada de prueba si no hay destino guardado para demostración
      const lat = /*order.destinationCoords?.latitude ||*/ -34.6037;
      const lon = /*order.destinationCoords?.longitude ||*/ -58.3816;
      const productType = order.product?.requiresColdChain ? 'perecedero_alto' : 'normal';
      
      setIsRiskLoading(true);
      setRiskError(null);
      getSpatialRisk({ lat, lon, transportType: 'terrestre', productType })
        .then(setRiskData)
        .catch(() => {
          setRiskError('El asistente de Inferencia no está disponible en este momento. Puedes procesar el pedido normalmente.');
        })
        .finally(() => setIsRiskLoading(false));
    }
  }, [order, user?.id]);

  const handleStatusUpdate = async (newStatus: string, successMessage: string) => {
    try {
      setIsUpdating(true);
      await updateOrder(id, { currentStatus: newStatus });
      toast({ title: "Éxito", description: successMessage, variant: "success" });
      fetchOrderDetails();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo actualizar el estado", variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShipSubmit = async (data: { trackingNumber: string; carrierId: number; sensorId?: string }) => {
    try {
      setIsUpdating(true);
      await updateOrder(id, {
        currentStatus: "SHIPPED",
        trackingNumber: data.trackingNumber,
        carrierId: data.carrierId,
        sensorId: data.sensorId
      });
      toast({ title: "Éxito", description: "El pedido ha sido marcado como enviado", variant: "success" });
      setShipModalOpen(false);
      fetchOrderDetails();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo marcar como enviado", variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!order) return <div className="p-8 text-center text-muted">Cargando...</div>;

  const isSeller = user?.id === order.product.seller?.user?.id;
  const isBuyer = user?.id === order.buyer?.id;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-brand-primary hover:underline text-sm font-semibold">
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Pedidos
      </button>

      <div className="flex justify-between items-start">
         <DashboardHeader 
          title={`Pedido #${order.id.slice(0,8)}`}
          subtitle={`Producto: ${order.product.name} • Estado: ${order.currentStatus}`}
        />
        <div className="flex flex-col items-end gap-2">
          {order.sensorId && (
            <Badge variant="nature" className="animate-pulse">
              ● Seguimiento IoT Activo
            </Badge>
          )}
        </div>
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
            <h3 className="font-bold mb-4">Estado del Pago</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted">Estado Actual:</span>
                <Badge variant={order.currentStatus === 'PENDING' ? 'accent' : order.currentStatus === 'PAID' ? 'nature' : 'outline'}>
                  {order.currentStatus === 'PENDING' ? 'Pendiente' : 
                   order.currentStatus === 'PAID' ? 'Pagado' : order.currentStatus}
                </Badge>
              </div>
              
              {isSeller && order.currentStatus === 'PENDING' && (
                <Button 
                  variant="primary" 
                  className="w-full mt-2"
                  onClick={() => handleStatusUpdate('PAID', 'El pago ha sido validado exitosamente.')}
                  isLoading={isUpdating}
                >
                  Confirmar Recepción de Pago
                </Button>
              )}

              {isBuyer && order.currentStatus === 'PENDING' && (
                <Button 
                  variant="primary" 
                  className="w-full mt-2"
                  onClick={() => handleStatusUpdate('PAID', 'El pago ha sido simulado exitosamente.')}
                  isLoading={isUpdating}
                >
                  Pagar Pedido
                </Button>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h3 className="font-bold mb-4">Detalles del Envío</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted">Estado de Envío:</span>
                <Badge variant={
                  order.currentStatus === 'DELIVERED' ? 'nature' : 
                  order.currentStatus === 'SHIPPED' ? 'primary' : 'outline'
                }>
                  {order.currentStatus === 'DELIVERED' ? 'Entregado' : order.currentStatus === 'SHIPPED' ? 'Enviado' : 'Pendiente de Envío'}
                </Badge>
              </div>
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

              {isBuyer && order.currentStatus === 'SHIPPED' && (
                <Button 
                  variant="primary" 
                  className="w-full mt-4"
                  onClick={() => handleStatusUpdate('DELIVERED', 'Has confirmado la recepción del paquete.')}
                  isLoading={isUpdating}
                >
                  Confirmar Recepción del Envío
                </Button>
              )}

              {isSeller && order.currentStatus === 'PAID' && (
                <Button 
                  variant="primary" 
                  className="w-full mt-4"
                  onClick={() => setShipModalOpen(true)}
                  isLoading={isUpdating}
                >
                  Marcar como Enviado
                </Button>
              )}
            </div>
          </Card>

          {/* Panel Asistente de Embalaje IA (Sólo vendedor) */}
          {isSeller && (
            <Card padding="md" className="border-brand-primary/20 bg-linear-to-b from-white to-brand-primary/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-brand-primary" />
                Asistente de Embalaje IA
              </h3>
              
              {isRiskLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <p className="text-sm text-muted mt-2">Analizando ruta y clima con IA...</p>
                </div>
              ) : riskError ? (
                <div className="bg-brand-urgency/10 text-brand-urgency p-3 rounded-md text-sm border border-brand-urgency/20">
                  <p className="font-semibold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> No Disponible</p>
                  <p className="mt-1">{riskError}</p>
                </div>
              ) : riskData ? (
                <div className="space-y-3 text-sm">
                  <div className="bg-brand-nature-bg p-3 rounded-md border border-brand-nature-content/20">
                    <p className="font-semibold text-brand-nature-content mb-1">Recomendación Logística</p>
                    <p>{riskData.ai_recommendation || "La ruta pasa por una zona de clima estable. Un empaque estándar es suficiente."}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="border border-border rounded p-2">
                      <span className="text-muted block text-xs">Clima Promedio</span>
                      <span className="font-semibold">{riskData.weather_risk?.average_temp_c || 22}°C</span>
                    </div>
                    <div className="border border-border rounded p-2">
                      <span className="text-muted block text-xs">Riesgo Tráfico</span>
                      <span className="font-semibold capitalize">{riskData.traffic_risk?.level || 'Bajo'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">No se ha podido analizar la ruta.</p>
              )}
            </Card>
          )}

          {/* Panel de Riesgo IoT (Sólo vendedor) */}
          {isSeller && (
             <LogisticsRiskPanel />
          )}
        </div>
      </div>
      
      <ShipmentModal 
        isOpen={shipModalOpen} 
        onClose={() => setShipModalOpen(false)} 
        onSubmit={handleShipSubmit} 
        isLoading={isUpdating}
      />
    </div>
  );
}
