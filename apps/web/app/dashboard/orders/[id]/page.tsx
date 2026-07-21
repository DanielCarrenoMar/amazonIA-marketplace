"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { getOrder, getOrderTimeline, updateOrder } from "@/lib/api";
import type { OrderTimelineResponseDto, ProductOrderResponseDto, OrderTimelineItemDto } from "event-types";
import { DashboardHeader, ShipmentModal, OrderChat } from "@/components/dashboard";

// El mapa depende de Leaflet (usa `window`), así que se carga solo en el cliente
const ShipmentRouteHeatmap = dynamic(() => import("@/components/dashboard/ShipmentRouteHeatmap"), {
  ssr: false,
  loading: () => <div className="h-[320px] bg-gray-100 animate-pulse rounded-2xl" />,
});
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Truck, CheckCircle2, ChevronLeft, AlertTriangle, User, Phone, Navigation, BrainCircuit, ArrowRight, XCircle } from "lucide-react";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);

  const fetchOrderDetails = () => {
    setLoadError(null);
    getOrder(id).then(setOrder).catch((err: any) => {
      console.error(err);
      setLoadError(err.message || "No se pudo cargar el pedido");
    });
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

  if (loadError) return <div className="p-8 text-center text-brand-urgency">{loadError}</div>;
  if (!order) return <div className="p-8 text-center text-muted">Cargando...</div>;

  const isSeller = user?.id === order.product.seller?.user?.id;
  const isBuyer = user?.id === order.buyer?.id;

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'Pendiente de Pago',
      PAID: 'Pagado',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregado',
      CANCELED: 'Cancelado',
      REFUNDED: 'Reembolsado'
    };
    return map[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'PENDING': return 'accent';
      case 'PAID':
      case 'DELIVERED': return 'nature';
      case 'SHIPPED': return 'primary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-brand-primary hover:underline text-sm font-semibold">
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Pedidos
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[42px] font-outfit font-extrabold text-[#333333] tracking-tight leading-none mb-2">
            Pedido #{order.id.slice(0,8)}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-[17px] text-gray-500 font-medium">
              Producto: {order.product.name}
            </p>
            <Badge variant={getStatusVariant(order.currentStatus)} className="text-sm px-3 py-0.5">
              {translateStatus(order.currentStatus)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {order.sensorId && (
            <Badge variant="nature" className="animate-pulse text-xs">
              ● Seguimiento IoT Activo
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-6">
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

          {timeline?.items?.some((ev) => ev.type === 'telemetry' && (ev.location as any)?.coordinates) && (
            <Card padding="lg">
              <h3 className="text-xl font-bold font-outfit mb-4">Mapa de Temperatura de la Ruta</h3>
              <ShipmentRouteHeatmap items={timeline.items} />
            </Card>
          )}

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
            <h3 className="font-bold mb-4">Gestión del Pedido</h3>
            <div className="space-y-4 text-sm">
              {/* Información de envío (solo si ya se pagó o envió) */}
              {order.currentStatus !== 'PENDING' && (
                <div className="space-y-3 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
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
              )}

              {/* Botones de acción según el estado y rol */}
              {isSeller && order.currentStatus === 'PENDING' && (
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => handleStatusUpdate('PAID', 'El pago ha sido validado exitosamente.')}
                  isLoading={isUpdating}
                >
                  Confirmar Recepción de Pago
                </Button>
              )}

              {isBuyer && order.currentStatus === 'PENDING' && (
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => handleStatusUpdate('PAID', 'El pago ha sido simulado exitosamente.')}
                  isLoading={isUpdating}
                >
                  Pagar Pedido
                </Button>
              )}

              {isSeller && order.currentStatus === 'PAID' && (
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => setShipModalOpen(true)}
                  isLoading={isUpdating}
                >
                  Marcar como Enviado
                </Button>
              )}

              {isBuyer && order.currentStatus === 'SHIPPED' && (
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => handleStatusUpdate('DELIVERED', 'Has confirmado la recepción del paquete.')}
                  isLoading={isUpdating}
                >
                  Confirmar Recepción del Envío
                </Button>
              )}
            </div>
          </Card>

          {/* Certificado de Autenticidad NFT */}
          {(order.blockchainRecord) ? (
            <Card padding="md" className="border-emerald-200 bg-emerald-50/20">
              <h3 className="font-bold mb-4 font-outfit text-slate-900 flex items-center gap-2">
                🎨 Certificado de Autenticidad NFT
              </h3>
              
              {order.blockchainRecord.status === 'CONFIRMED' ? (
                <div className="space-y-4 text-sm text-slate-800">
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                    <CheckCircle2 className="w-4 h-4" /> Certificado Activo
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs font-mono space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Token ID:</span>
                      <span className="font-bold text-slate-900 break-all">
                        {order.blockchainRecord.nftTokenId ? order.blockchainRecord.nftTokenId.slice(0, 15) + '...' : 'Generando...'}
                      </span>
                    </div>
                    {order.blockchainRecord.nftTxHash && (
                      <div className="flex flex-col gap-1">
                        <span className="text-muted">Hash NFT:</span>
                        <span className="font-semibold text-slate-700 break-all text-[11px]">
                          {order.blockchainRecord.nftTxHash}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Este producto artesanal ha sido certificado mediante un token no fungible ERC-721 en la red descentralizada de AmazonIA.
                  </p>
                </div>
              ) : order.blockchainRecord.status === 'FAILED' ? (
                <div className="space-y-3 text-sm text-slate-800">
                  <div className="flex items-center gap-2 text-rose-800 bg-rose-100 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Certificación Rechazada
                  </div>
                  <p className="text-xs text-rose-600/90 font-medium">
                    Motivo: {order.blockchainRecord.errorMessage || 'Rechazado por el Consejo Comunitario de la Blockchain.'}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    Esta orden fue revisada y rechazada por votación de la gobernanza comunitaria descentralizada.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-slate-800">
                  <div className="flex items-center gap-2 text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                    El NFT aún no se ha aprobado
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    La certificación está siendo revisada democráticamente por el Consejo de Gobernanza. Una vez aprobada por el consejo, el NFT se mostrará aquí automáticamente.
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card padding="md" className="border-amber-200 bg-amber-50/10">
              <h3 className="font-bold mb-4 font-outfit text-slate-900 flex items-center gap-2">
                🎨 Certificado de Autenticidad NFT
              </h3>
              <div className="space-y-3 text-sm text-slate-800">
                <div className="flex items-center gap-2 text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  El NFT aún no se ha aprobado
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  La certificación se iniciará cuando el pago sea procesado y notificado en la blockchain.
                </p>
              </div>
            </Card>
          )}

          {isSeller && (
            <Card padding="md" className="border-brand-primary/20 bg-linear-to-br from-white to-brand-primary/5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-brand-primary/10 shrink-0">
                  <BrainCircuit className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 mb-1">Análisis de Riesgo IA</h3>
                  <p className="text-sm text-muted mb-3">
                    Evalúa clima, hidrología e IoT con el modelo XGBoost + SHAP en el centro de monitoreo dedicado.
                  </p>
                  {order.originCoords && order.destinationCoords ? (
                    <Link
                      href={`/dashboard/logistics-ai?orderId=${order.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
                    >
                      Abrir monitoreo completo
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Este pedido no tiene coordenadas de ruta guardadas.
                    </p>
                  )}
                </div>
              </div>
            </Card>
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
