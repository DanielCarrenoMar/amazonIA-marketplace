"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader, LogisticsRiskPanel } from "@/components/dashboard";
import { getSellerOrders } from "@/lib/api";
import type { ProductOrderResponseDto } from "event-types";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { BrainCircuit, ChevronLeft, Package, MapPinOff } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function LogisticsAiDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LogisticsAiDashboardContent />
    </Suspense>
  );
}

function LogisticsAiDashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("orderId");

  const [orders, setOrders] = useState<ProductOrderResponseDto[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await getSellerOrders(new URLSearchParams({ limit: "50" }));
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "BUYER") {
      router.replace("/dashboard/orders");
    }
  }, [authLoading, user?.role, router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (preselectedId) setSelectedId(preselectedId);
  }, [preselectedId]);

  const ordersWithCoords = useMemo(
    () => orders.filter((o) => o.originCoords && o.destinationCoords),
    [orders]
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  if (authLoading || user?.role === "BUYER") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center text-brand-primary hover:underline text-sm font-semibold"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Volver a Pedidos
      </Link>

      <DashboardHeader
        title="Centro de IA Logística"
        subtitle="Monitoreo predictivo de riesgo, explicabilidad SHAP y recomendaciones de empaque para tus envíos amazónicos."
      />

      {/* Selector de pedido */}
      <Card padding="md" className="border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="order-select" className="block text-sm font-semibold text-slate-700 mb-2">
              Seleccionar pedido a analizar
            </label>
            {loadingOrders ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : ordersWithCoords.length === 0 ? (
              <p className="text-sm text-muted flex items-center gap-2">
                <MapPinOff className="w-4 h-4" />
                No hay pedidos con coordenadas de ruta guardadas.
              </p>
            ) : (
              <select
                id="order-select"
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value || null)}
                className="w-full md:max-w-md px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">— Elegir pedido —</option>
                {ordersWithCoords.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id.slice(0, 8)} · {o.product?.name ?? "Producto"} · {o.currentStatus}
                  </option>
                ))}
              </select>
            )}
          </div>
          {ordersWithCoords.length > 0 && (
            <p className="text-xs text-muted md:pb-2.5">
              {ordersWithCoords.length} pedido(s) con ruta georreferenciada
            </p>
          )}
        </div>
      </Card>

      {/* Panel principal */}
      {!selectedOrder ? (
        <div className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-1">Selecciona un pedido</h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Elige un envío con coordenadas de origen y destino para ejecutar la predicción XGBoost
            con datos climáticos, hidrológicos e IoT en tiempo real.
          </p>
        </div>
      ) : (
        <LogisticsRiskPanel
          order={{
            id: selectedOrder.id,
            originCoords: selectedOrder.originCoords,
            destinationCoords: selectedOrder.destinationCoords,
            requiresColdChain: selectedOrder.product?.requiresColdChain,
            transportType: selectedOrder.transportType,
          }}
          orderLabel={`#${selectedOrder.id.slice(0, 8)} · ${selectedOrder.product?.name ?? "Producto"}`}
        />
      )}


    </div>
  );
}
