"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrder, getOrderTimeline, updateOrder } from "@/lib/api";
import type { OrderTimelineResponseDto, ProductOrderResponseDto, OrderTimelineItemDto } from "event-types";
import { DashboardHeader, LogisticsRiskPanel, ShipmentModal, OrderChat } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Truck, CheckCircle2, ChevronLeft, AlertTriangle, User, Phone, Navigation } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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

  const fetchOrderDetails = () => {
    getOrder(id).then(setOrder).catch(console.error);
    getOrderTimeline(id).then(setTimeline).catch(console.error);
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

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

          <OrderChat 
            orderId={order.id} 
            currentStatus={order.currentStatus} 
            currentUserId={user?.id}
          />
        </div>

        <div className="space-y-6">
          <Card padding="md">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Navigation className="w-4 h-4" /> Ruta e Involucrados</h3>
            
            <div className="space-y-4">
              {/* Origen */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Vendedor</p>
                    <p className="text-sm font-bold">{order.product?.seller?.user?.fullName || 'Artesano'}</p>
                  </div>
                </div>
                {order.product?.seller?.user?.phonePrimary && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 pl-8 mb-1">
                    <Phone className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                    <p>{order.product.seller.user.phonePrimary}</p>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-600 pl-8">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                  <p>{order.product?.locationFormattedAddress || order.product?.locationCity || 'Ubicación no especificada'}</p>
                </div>
              </div>

              {/* Destino */}
              <div className="bg-brand-nature-bg/30 p-3 rounded-lg border border-brand-nature-bg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Comprador</p>
                    <p className="text-sm font-bold">{order.buyer?.fullName || order.buyer?.username || 'Comprador'}</p>
                  </div>
                </div>
                {order.buyer?.phonePrimary && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 pl-8 mb-1">
                    <Phone className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                    <p>{order.buyer.phonePrimary}</p>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-600 pl-8">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-brand-primary" />
                  <p>{order.destinationFormattedAddress || order.destinationCity || 'Dirección no especificada'}</p>
                </div>
              </div>
            </div>
          </Card>

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

          {/* Certificado de Autenticidad NFT */}
          {(order as any).blockchainRecord && (
            <Card padding="md" className="border-emerald-200 bg-emerald-50/20">
              <h3 className="font-bold mb-4 font-outfit text-slate-900 flex items-center gap-2">
                🎨 Certificado de Autenticidad NFT
              </h3>
              
              {(order as any).blockchainRecord.status === 'CONFIRMED' ? (
                <div className="space-y-4 text-sm text-slate-800">
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                    <CheckCircle2 className="w-4 h-4" /> Certificado Activo
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs font-mono space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Token ID:</span>
                      <span className="font-bold text-slate-900 break-all">
                        {(order as any).blockchainRecord.nftTokenId ? (order as any).blockchainRecord.nftTokenId.slice(0, 15) + '...' : 'Generando...'}
                      </span>
                    </div>
                    {(order as any).blockchainRecord.nftTxHash && (
                      <div className="flex flex-col gap-1">
                        <span className="text-muted">TX Hash NFT:</span>
                        <a 
                          href={`http://localhost:3000/marketplace/explorer/proposals/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-primary hover:underline font-semibold break-all"
                        >
                          {(order as any).blockchainRecord.nftTxHash}
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Este producto artesanal ha sido certificado mediante un token no fungible ERC-721 en la red descentralizada de AmazonIA.
                  </p>
                </div>
              ) : (order as any).blockchainRecord.status === 'PENDING' ? (
                <div className="space-y-3 text-sm text-slate-800">
                  <div className="flex items-center gap-2 text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                    Pendiente de Consejo
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    La notarización está siendo revisada democráticamente por el Consejo de Gobernanza. Una vez aprobada, se acuñará el NFT.
                  </p>
                  <Link 
                    href={`/marketplace/explorer/${order.id}`} 
                    className="inline-block text-xs font-bold text-brand-primary hover:underline animate-pulse"
                  >
                    Ver Propuesta en el Explorer →
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-muted">
                  La certificación falló o fue rechazada por el consejo.
                </div>
              )}
            </Card>
          )}

          {isSeller && (
            <LogisticsRiskPanel
              order={{
                id: order.id,
                originCoords: order.originCoords,
                destinationCoords: order.destinationCoords,
                requiresColdChain: order.product?.requiresColdChain,
              }}
            />
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
