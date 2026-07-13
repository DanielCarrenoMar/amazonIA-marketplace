"use client";

import { useEffect, useState } from "react";
import { getAllOrders } from "@/lib/api/order.api";
import type { ProductOrderResponseDto } from "event-types";
import { Card } from "@/components/ui/Card";
import { Package, User, Calendar, DollarSign } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ProductOrderResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrders(new URLSearchParams({ limit: "50" }));
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Cargando órdenes...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'PAID': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-outfit text-muted">
          Órdenes Globales ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50/50 border-dashed">
            <p className="text-muted">No se encontraron órdenes.</p>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted uppercase bg-gray-50/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID Orden</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold">Monto</th>
                    <th className="px-6 py-4 font-semibold">Producto / Vendedor</th>
                    <th className="px-6 py-4 font-semibold">Comprador</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {o.id.split('-')[0]}...
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.currentStatus)}`}>
                          {o.currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-600 flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {Number(o.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted" />
                          <div>
                            <p className="font-medium text-foreground truncate max-w-[150px]" title={o.product?.name}>
                              {o.product?.name || 'Producto Desconocido'}
                            </p>
                            <p className="text-xs text-muted truncate max-w-[150px]">
                              Vendedor: {o.product?.seller?.user?.fullName || 'Desconocido'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted">
                          <User className="w-4 h-4" />
                          <span className="truncate max-w-[120px]" title={o.buyer?.fullName}>
                            {o.buyer?.fullName || 'Usuario Desconocido'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
