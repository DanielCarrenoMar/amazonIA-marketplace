"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";
import { updateWalletAddress, removeWalletAddress } from "@/lib/api";
import { Wallet, Copy, Check, AlertTriangle, Info, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [walletAddress, setWalletAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Initialize form with existing wallet
  useEffect(() => {
    if (user?.walletHash) {
      setWalletAddress(user.walletHash);
    }
  }, [user]);

  const handleCopy = async () => {
    if (!user?.walletHash) return;
    try {
      await navigator.clipboard.writeText(user.walletHash);
      setIsCopied(true);
      toast({ title: "Dirección copiada", variant: "success" });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({ title: "Error al copiar", variant: "error" });
    }
  };

  const validateAddress = (address: string) => {
    // Basic Ethereum/Polygon address validation: 0x followed by 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!walletAddress.trim()) {
      toast({ title: "Por favor, ingresa una dirección", variant: "error" });
      return;
    }

    if (!validateAddress(walletAddress)) {
      toast({ 
        title: "Dirección inválida", 
        description: "Debe ser una dirección válida de Polygon/Ethereum (ej: 0x...)",
        variant: "error" 
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateWalletAddress(user.id, walletAddress.trim());
      await refreshUser();
      toast({ title: "Billetera actualizada exitosamente", variant: "success" });
    } catch (error: any) {
      toast({ title: error.message || "Error al actualizar billetera", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!user || !user.walletHash) return;
    
    if (!confirm("¿Estás seguro de que deseas eliminar tu dirección de billetera? No podrás recibir pagos hasta configurar una nueva.")) {
      return;
    }

    try {
      setIsRemoving(true);
      await removeWalletAddress(user.id);
      setWalletAddress("");
      await refreshUser();
      toast({ title: "Billetera eliminada", variant: "success" });
    } catch (error: any) {
      toast({ title: error.message || "Error al eliminar billetera", variant: "error" });
    } finally {
      setIsRemoving(false);
    }
  };

  if (!user) return null;

  const hasWallet = !!user.walletHash;

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Billetera Virtual" 
        subtitle="Configura tu billetera para recibir pagos de tus ventas" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Wallet Status */}
          <Card padding="lg" className="bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold font-outfit text-foreground flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-brand-primary" />
                  Estado de Billetera
                </h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                hasWallet 
                  ? "bg-green-100 text-green-700 border border-green-200" 
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${hasWallet ? "bg-green-500" : "bg-gray-400"}`}></div>
                {hasWallet ? "Configurada" : "No configurada"}
              </div>
            </div>

            {hasWallet ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col min-w-0 flex-1 w-full">
                  <span className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Dirección (Red: Polygon / Arbitrum)</span>
                  <div className="font-mono text-sm sm:text-base text-foreground truncate" title={user.walletHash || undefined}>
                    {user.walletHash}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopy}
                    leftIcon={isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    className={isCopied ? "border-green-600 text-green-600 hover:bg-green-50" : ""}
                  >
                    {isCopied ? "Copiado" : "Copiar"}
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={handleRemove}
                    isLoading={isRemoving}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
                <p className="text-sm text-foreground font-medium mb-1">Aún no has configurado tu billetera</p>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Necesitas una billetera configurada para poder recibir los pagos generados por tus ventas en AmazonIA.
                </p>
              </div>
            )}
          </Card>

          {/* Configuration Form */}
          <Card padding="lg" className="bg-white">
            <h3 className="text-lg font-bold font-outfit text-foreground mb-4">
              {hasWallet ? "Actualizar Billetera" : "Vincular Billetera"}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground block">
                  Dirección de Billetera (Formato 0x...)
                </label>
                <div className="relative">
                  <Input
                    name="walletAddress"
                    placeholder="0x71C...976F"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                    className="font-mono pl-10"
                  />
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
                <p className="text-xs text-muted mt-1.5">
                  Asegúrate de que la dirección corresponda a una red compatible con EVM (Polygon, Arbitrum).
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {hasWallet ? "Actualizar Dirección" : "Guardar Dirección"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card padding="md" className="bg-brand-nature-bg border border-brand-primary-light">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-brand-primary shrink-0" />
              <div>
                <h4 className="font-semibold text-brand-nature-content mb-1">¿Por qué necesito una billetera?</h4>
                <p className="text-sm text-brand-nature-content/80">
                  AmazonIA utiliza tecnología Blockchain para garantizar trazabilidad y pagos justos. Los fondos de tus ventas se depositan directamente en esta billetera mediante contratos inteligentes.
                </p>
              </div>
            </div>
          </Card>
          
          <Card padding="md" className="bg-white">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Avisos de Seguridad
            </h4>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0"></div>
                <span><strong>Verifica la red:</strong> AmazonIA opera en redes de Capa 2 (Polygon, Arbitrum) para mantener comisiones bajas.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0"></div>
                <span><strong>No somos un exchange:</strong> Te recomendamos usar una billetera de autocustodia (Metamask, TrustWallet) en lugar de la dirección de un exchange.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0"></div>
                <span><strong>Nunca pidas soporte con tu frase semilla:</strong> AmazonIA nunca te pedirá tu frase semilla ni tu clave privada.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
