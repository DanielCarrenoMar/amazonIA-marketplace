"use client";

import { useState, useEffect } from "react";
import { DashboardHeader, KanbanBoard, ShipmentModal } from "@/components/dashboard";
import { Tabs } from "@/components/ui/Tabs";
import { getSellerOrders, getMyOrders, updateOrder } from "@/lib/api";
import { ProductOrderResponseDto } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [sales, setSales] = useState<ProductOrderResponseDto[]>([]);
  const [purchases, setPurchases] = useState<ProductOrderResponseDto[]>([]);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const [salesRes, purchasesRes] = await Promise.all([
        getSellerOrders(),
        getMyOrders()
      ]);
      setSales(salesRes.data);
      setPurchases(purchasesRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleAction = (action: string, orderId: string) => {
    if (action === 'ship') {
      setSelectedOrderId(orderId);
      setShipModalOpen(true);
    } else if (action === 'track' || action === 'confirm') {
      router.push(`/dashboard/orders/${orderId}`);
    } else if (action === 'rate') {
      toast({ title: "Calificación", description: "Módulo de calificación en construcción" });
    }
  };

  const handleShipSubmit = async (data: any) => {
    if (!selectedOrderId) return;
    try {
      await updateOrder(selectedOrderId, {
        currentStatus: "SHIPPED",
        trackingNumber: data.trackingNumber,
        carrierId: data.carrierId,
        sensorId: data.sensorId
      });
      toast({ title: "Pedido actualizado a Enviado", variant: "success" });
      setShipModalOpen(false);
      loadOrders(); // recargar
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "error" });
    }
  };

  const salesColumns = [
    { key: "PAID", label: "Por Enviar", color: "yellow" as const },
    { key: "SHIPPED", label: "Enviado", color: "blue" as const },
    { key: "DELIVERED", label: "Entregado", color: "green" as const }
  ];

  const purchaseColumns = [
    { key: "PAID", label: "En Preparación", color: "yellow" as const },
    { key: "SHIPPED", label: "En Camino", color: "blue" as const },
    { key: "DELIVERED", label: "Recibido", color: "green" as const }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <DashboardHeader title="Gestión de Pedidos" subtitle="Visualiza tus ventas y compras" />

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: "sales",
            label: "Mis Ventas",
            content: (
              <div className="mt-4">
                <KanbanBoard columns={salesColumns} orders={sales} viewMode="seller" onAction={handleAction} />
              </div>
            )
          },
          {
            key: "purchases",
            label: "Mis Compras",
            content: (
              <div className="mt-4">
                <KanbanBoard columns={purchaseColumns} orders={purchases} viewMode="buyer" onAction={handleAction} />
              </div>
            )
          }
        ]}
      />

      <ShipmentModal 
        isOpen={shipModalOpen} 
        onClose={() => setShipModalOpen(false)} 
        onSubmit={handleShipSubmit} 
      />
    </div>
  );
}
