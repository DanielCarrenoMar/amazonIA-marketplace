"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";
import { getMyOrders } from "@/lib/api/order.api";
import { Wallet, Copy, Check, Eye, Lock, FileText, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { ProductOrderResponseDto } from "event-types";

export default function TransactionsHistoryPage() {
  const { user } = useAuth();
  
  const [accountInput, setAccountInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [orders, setOrders] = useState<ProductOrderResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.walletHash) {
      toast.error("Por favor vincule su billetera en la sección de Billetera Virtual primero.");
      return;
    }

    if (accountInput.trim().toLowerCase() !== user.walletHash.toLowerCase()) {
      toast.error("La cuenta ingresada no coincide con su billetera registrada.");
      return;
    }

    setIsUnlocked(true);
    fetchTransactions();
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await getMyOrders();
      // Filter orders that have a payment transaction hash
      const filtered = (res.data || []).filter((o) => o.transactionHash);
      setOrders(filtered);
    } catch (err: any) {
      console.error(err);
      toast.error("Error al cargar las transacciones bancarias.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setIsCopied(hash);
      toast.success("Hash de transacción copiado.");
      setTimeout(() => setIsCopied(null), 2000);
    } catch (err) {
      toast.error("Error al copiar");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Historial de Pagos" 
        subtitle="Visualiza tu registro bancario de transacciones y hashes en blockchain" 
      />

      {!isUnlocked ? (
        <div className="max-w-md mx-auto py-12">
          <Card padding="lg" className="bg-white shadow-xl border border-slate-100 flex flex-col gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-slate-900 mb-2">Ingresar a Historial de Pagos</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Por motivos de seguridad, para acceder a su historial de hashes de pago, ingrese su dirección de cuenta / billetera registrada.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Dirección de Cuenta / Billetera
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="Ingrese su dirección 0x..."
                    value={accountInput}
                    onChange={(e) => setAccountInput(e.target.value)}
                    className="font-mono pl-10 text-sm"
                  />
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full rounded-full py-3 font-bold shadow-md flex items-center justify-center gap-2"
              >
                Ver Historial Bancario <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {!user.walletHash && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-normal">
                  <strong>Aviso:</strong> No has configurado una dirección de billetera en esta cuenta. Ve a la sección de "Billetera Virtual" para vincular una antes de intentar consultar tu historial.
                </p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Account information banner */}
          <Card padding="md" className="bg-[#091d13] text-white border border-white/5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Cuenta Activa</span>
                <p className="font-mono text-sm sm:text-base text-white/90 truncate max-w-lg mt-0.5">{user.walletHash}</p>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold border border-white/10">
                Historial Desbloqueado
              </div>
            </div>
          </Card>

          {/* Transactions List */}
          <Card padding="lg" className="bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="mb-4">
              <h3 className="text-lg font-bold font-outfit text-slate-900">Historial de Transacciones</h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold">Cargando transacciones bancarias...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Sin transacciones</h4>
                <p className="text-xs max-w-xs mx-auto">No se encontraron pagos completados asociados a esta cuenta.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3.5 px-6">Fecha / Hora</th>
                      <th className="py-3.5 px-6">Detalle / Producto</th>
                      <th className="py-3.5 px-6">Hash de Transacción</th>
                      <th className="py-3.5 px-6">Método</th>
                      <th className="py-3.5 px-6 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {new Date(o.createdAt).toLocaleString(undefined, {
                            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-950 text-sm">
                            {o.product?.name || "Pago de Orden"}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Orden ID: {o.id}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded truncate max-w-[180px]">
                              {o.transactionHash}
                            </span>
                            <button
                              onClick={() => handleCopy(o.transactionHash || "")}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                              title="Copiar Hash"
                            >
                              {isCopied === o.transactionHash ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs font-semibold text-slate-600">
                          {(o as any).paymentMethod || "Blockchain"}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-950 text-sm">
                          ${Number(o.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
