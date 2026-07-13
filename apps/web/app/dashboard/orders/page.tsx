"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DashboardHeader,
  KanbanBoard,
  OrdersList,
  ShipmentModal,
  RatingModal,
  StatsCard,
} from "@/components/dashboard";
import { Tabs } from "@/components/ui/Tabs";
import { getSellerOrders, getMyOrders, updateOrder } from "@/lib/api";
import type { ProductOrderResponseDto } from "event-types";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import {
  LayoutGrid,
  List,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PackageX,
  Search,
  Filter,
} from "lucide-react";

// ─── Skeleton Loader ────────────────────────────────────────────────────────
function OrdersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      {/* Kanban skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="h-10 bg-gray-100 rounded-xl" />
            {[...Array(2)].map((_, j) => (
              <div key={j} className="h-36 bg-gray-50 rounded-xl border border-dashed border-gray-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Error al cargar pedidos
      </h3>
      <p className="text-sm text-muted mb-6 max-w-xs">
        No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark rounded-xl transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyOrdersState({ mode }: { mode: "sales" | "purchases" }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-brand-nature-bg flex items-center justify-center">
          <PackageX className="w-10 h-10 text-brand-primary/50" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-brand-accent" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {mode === "sales" ? "Aún no tienes ventas" : "Aún no tienes compras"}
      </h3>
      <p className="text-sm text-muted mb-6 max-w-xs leading-relaxed">
        {mode === "sales"
          ? "Cuando alguien compre uno de tus productos, aparecerá aquí para que puedas gestionarlo."
          : "Explora el marketplace y realiza tu primera compra para verla reflejada aquí."}
      </p>
      {mode === "purchases" && (
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-dark rounded-xl transition-colors shadow-sm shadow-brand-primary/20"
        >
          <ShoppingBag className="w-4 h-4" />
          Ir al Marketplace
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { isSeller } = useAuth();
  const [activeTab, setActiveTab] = useState("purchases");
  const [viewType, setViewType] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [sales, setSales] = useState<ProductOrderResponseDto[]>([]);
  const [purchases, setPurchases] = useState<ProductOrderResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedOrderIdForRating, setSelectedOrderIdForRating] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const promises: Promise<any>[] = [getMyOrders()];
      if (isSeller) {
        promises.push(getSellerOrders());
      }
      const results = await Promise.all(promises);
      setPurchases(results[0].data || []);
      if (isSeller) {
        setSales(results[1].data || []);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isSeller]);

  useEffect(() => {
    if (isSeller) {
      setActiveTab("sales");
    }
    loadOrders();
  }, [isSeller, loadOrders]);

  const handleAction = (action: string, orderId: string) => {
    if (action === "ship") {
      setSelectedOrderId(orderId);
      setShipModalOpen(true);
    } else if (action === "track" || action === "confirm") {
      router.push(`/dashboard/orders/${orderId}`);
    } else if (action === "rate") {
      setSelectedOrderIdForRating(orderId);
      setRatingModalOpen(true);
    } else if (action === "cancel") {
      updateOrder(orderId, { currentStatus: "CANCELED" })
        .then(() => {
          toast({ title: "Pedido Cancelado", variant: "success" });
          loadOrders();
        })
        .catch((err) => {
          toast({ title: "Error", description: err.message, variant: "error" });
        });
    }
  };

  const handleShipSubmit = async (data: any) => {
    if (!selectedOrderId) return;
    try {
      await updateOrder(selectedOrderId, {
        currentStatus: "SHIPPED",
        trackingNumber: data.trackingNumber,
        carrierId: data.carrierId,
        sensorId: data.sensorId,
      });
      toast({ title: "Pedido actualizado a Enviado", variant: "success" });
      setShipModalOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "error" });
    }
  };

  const handleRateSubmit = async (rating: number) => {
    if (!selectedOrderIdForRating) return;
    try {
      await updateOrder(selectedOrderIdForRating, { sellerRatingValue: rating });
      toast({
        title: "Calificación enviada",
        description: "¡Gracias por tu opinión!",
        variant: "success",
      });
      setRatingModalOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "error" });
    }
  };

  // ── Column Definitions ──────────────────────────────────────────────────
  const salesColumns = [
    { key: "PENDING", label: "Esperando Pago", color: "gray" as const },
    { key: "PAID", label: "Por Enviar", color: "yellow" as const },
    { key: "SHIPPED", label: "Enviado", color: "blue" as const },
    { key: "DELIVERED", label: "Entregado", color: "green" as const },
  ];

  const purchaseColumns = [
    { key: "PENDING", label: "Esperando Pago", color: "gray" as const },
    { key: "PAID", label: "En Preparación", color: "yellow" as const },
    { key: "SHIPPED", label: "En Camino", color: "blue" as const },
    { key: "DELIVERED", label: "Recibido", color: "green" as const },
  ];

  // ── Stats Computation ───────────────────────────────────────────────────
  const currentOrders = activeTab === "sales" ? sales : purchases;

  const computeStats = (orders: ProductOrderResponseDto[]) => ({
    total: orders.length,
    pending: orders.filter((o) => o.currentStatus === "PENDING").length,
    inTransit: orders.filter((o) => o.currentStatus === "SHIPPED").length,
    delivered: orders.filter((o) => o.currentStatus === "DELIVERED").length,
    totalRevenue: orders
      .filter((o) => o.currentStatus !== "CANCELED")
      .reduce((acc, o) => acc + Number(o.totalAmount), 0),
  });

  const stats = computeStats(currentOrders);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filterOrders = (orders: ProductOrderResponseDto[]) => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || o.currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredSales = filterOrders(sales);
  const filteredPurchases = filterOrders(purchases);

  const STATUS_OPTIONS = [
    { value: "ALL", label: "Todos los estados" },
    { value: "PENDING", label: "Esperando Pago" },
    { value: "PAID", label: "En Preparación" },
    { value: "SHIPPED", label: "Enviado / En Camino" },
    { value: "DELIVERED", label: "Entregado / Recibido" },
    { value: "CANCELED", label: "Cancelado" },
  ];

  // ── Content renderer ─────────────────────────────────────────────────────
  const renderContent = (
    mode: "sales" | "purchases",
    columns: typeof salesColumns,
    orders: ProductOrderResponseDto[]
  ) => {
    if (orders.length === 0 && !search && statusFilter === "ALL") {
      return <EmptyOrdersState mode={mode} />;
    }

    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Sin resultados</h3>
          <p className="text-sm text-muted">
            No hay pedidos que coincidan con tu búsqueda o filtros.
          </p>
          <button
            onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
            className="mt-4 text-sm font-medium text-brand-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      );
    }

    if (viewType === "kanban") {
      return <KanbanBoard columns={columns} orders={orders} viewMode={mode === "sales" ? "seller" : "buyer"} onAction={handleAction} />;
    }

    return <OrdersList orders={orders} viewMode={mode === "sales" ? "seller" : "buyer"} onAction={handleAction} />;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardHeader
          title="Gestión de Pedidos"
          subtitle="Visualiza y gestiona todas tus ventas y compras en un solo lugar"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            disabled={isLoading}
            title="Actualizar pedidos"
            className="p-2 text-muted hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {/* View toggle */}
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setViewType("kanban")}
              title="Vista Tablero"
              className={`p-2 rounded-lg transition-colors ${
                viewType === "kanban"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType("list")}
              title="Vista Lista"
              className={`p-2 rounded-lg transition-colors ${
                viewType === "list"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading / Error / Content ────────────────────────────────────── */}
      {isLoading ? (
        <OrdersSkeleton />
      ) : hasError ? (
        <ErrorState onRetry={loadOrders} />
      ) : (
        <>
          {/* ── Stats Row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<ShoppingBag className="w-5 h-5" />}
              label="Total pedidos"
              value={stats.total.toString()}
              subtitle={activeTab === "sales" ? "Ventas realizadas" : "Compras realizadas"}
            />
            <StatsCard
              icon={<Clock className="w-5 h-5" />}
              label="Esperando"
              value={stats.pending.toString()}
              subtitle="Pendientes de pago"
              variant="warning"
            />
            <StatsCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="En tránsito"
              value={stats.inTransit.toString()}
              subtitle="Pedidos enviados"
              variant="highlight"
            />
            <StatsCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Completados"
              value={stats.delivered.toString()}
              subtitle={`$${stats.totalRevenue.toFixed(2)} total`}
              variant="highlight"
            />
          </div>

          {/* ── Filters Bar ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por producto o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>
            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────── */}
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              setSearch("");
              setStatusFilter("ALL");
            }}
            items={[
              ...(isSeller
                ? [
                    {
                      key: "sales",
                      label: `Mis Ventas (${sales.length})`,
                      content: (
                        <div className="mt-4">
                          {renderContent("sales", salesColumns, filteredSales)}
                        </div>
                      ),
                    },
                  ]
                : []),
              {
                key: "purchases",
                label: `Mis Compras (${purchases.length})`,
                content: (
                  <div className="mt-4">
                    {renderContent("purchases", purchaseColumns, filteredPurchases)}
                  </div>
                ),
              },
            ]}
          />
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ShipmentModal
        isOpen={shipModalOpen}
        onClose={() => setShipModalOpen(false)}
        onSubmit={handleShipSubmit}
      />
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSubmit={handleRateSubmit}
      />
    </div>
  );
}
