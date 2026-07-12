"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { 
  getMyTribe, 
  getTribeMembershipRequests, 
  reviewTribeMembership, 
  removeTribeMember 
} from "@/lib/api/tribe.api";
import { findSellers } from "@/lib/api/seller.api";
import { useAuth } from "@/lib/useAuth";
import type { TribeResponseDto, SellerResponseDto, TribeMembershipRequestResponseDto } from "event-types";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function TribeManagementPage() {
  const { user, isLeader } = useAuth();
  const [activeTab, setActiveTab] = useState<"members" | "requests">("members");
  
  const [tribe, setTribe] = useState<TribeResponseDto | null>(null);
  const [members, setMembers] = useState<SellerResponseDto[]>([]);
  const [requests, setRequests] = useState<TribeMembershipRequestResponseDto[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<number | string | null>(null);

  const loadTribeData = async () => {
    try {
      setIsLoading(true);
      const myTribe = await getMyTribe();
      setTribe(myTribe);
      
      if (myTribe) {
        // Fetch Members
        const sellersRes = await findSellers(new URLSearchParams({ tribeId: myTribe.id.toString() }));
        setMembers(sellersRes.data);
        
        // Fetch pending requests (only if leader)
        if (isLeader) {
          const requestsRes = await getTribeMembershipRequests(myTribe.id, new URLSearchParams({ status: "PENDING" }));
          setRequests(requestsRes.data);
        }
      }
    } catch (error) {
      console.error("Error fetching tribe management data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTribeData();
    }
  }, [user, isLeader]);

  const handleReviewRequest = async (requestId: number, status: "ACCEPTED" | "REJECTED") => {
    if (!tribe) return;
    try {
      setIsActionLoading(`req-${requestId}`);
      // Assuming event-types enum value is mapped to strings ACCEPTED/REJECTED or similar
      await reviewTribeMembership(tribe.id, requestId, { status: status as any });
      await loadTribeData(); // Reload all data
      toast.success(status === "ACCEPTED" ? "Solicitud aprobada" : "Solicitud rechazada");
    } catch (error) {
      console.error("Error reviewing request:", error);
      toast.error("Hubo un error al procesar la solicitud.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleRemoveMember = async (sellerId: string) => {
    if (!tribe) return;
    if (!window.confirm("¿Estás seguro de que quieres expulsar a este vendedor de la tribu?")) return;
    
    try {
      setIsActionLoading(`remove-${sellerId}`);
      await removeTribeMember(tribe.id, sellerId);
      await loadTribeData(); // Reload members list
      toast.success("Vendedor removido de la tribu.");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Hubo un error al remover al miembro.");
    } finally {
      setIsActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Icon icon="lucide:loader-2" className="w-10 h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon icon="lucide:tent" className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No perteneces a una tribu</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Explora las tribus activas y solicita unirte a una para ver esta información.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-gray-900 dark:text-white mb-2">
            {isLeader ? "Gestión de la Tribu" : "Mi Tribu"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isLeader ? "Administra los vendedores de " : "Perteneces a "}
            <span className="font-semibold text-brand-primary">{tribe.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl font-medium border border-brand-primary/20 flex items-center">
            <Icon icon="lucide:users" className="w-4 h-4 mr-2" />
            {members.length} Miembros
          </div>
          {isLeader && requests.length > 0 && (
            <div className="px-4 py-2 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 rounded-xl font-medium border border-yellow-200 dark:border-yellow-500/20 flex items-center">
              <Icon icon="lucide:bell" className="w-4 h-4 mr-2" />
              {requests.length} Pendientes
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 flex items-center justify-center py-4 font-medium transition-colors ${
              activeTab === "members" 
                ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Icon icon="lucide:users" className="w-5 h-5 mr-2" />
            Vendedores Activos
          </button>
          
          {isLeader && (
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 flex items-center justify-center py-4 font-medium transition-colors ${
                activeTab === "requests" 
                  ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon icon="lucide:mail" className="w-5 h-5 mr-2" />
              Solicitudes Pendientes
              {requests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {requests.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8 min-h-[400px]">
          
          {/* MEMBERS TAB */}
          {activeTab === "members" && (
            <div>
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="lucide:ghost" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay vendedores en tu tribu actualmente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                          {member.user?.avatarUrl ? (
                            <img src={member.user.avatarUrl} alt={member.user?.username || member.user?.fullName || 'Vendedor'} className="w-full h-full object-cover" />
                          ) : (
                            <Icon icon="lucide:store" className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{member.user?.username || member.user?.fullName || 'Vendedor'}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {member.id === tribe.primaryLeaderId || member.id === tribe.secondaryLeaderId ? "Líder" : "Miembro"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mostrar botón de eliminar SOLO si eres el líder y no te estás intentando borrar a ti mismo */}
                      {isLeader && member.id !== tribe.primaryLeaderId && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isActionLoading === `remove-${member.id}`}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Expulsar de la tribu"
                        >
                          {isActionLoading === `remove-${member.id}` ? (
                            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
                          ) : (
                            <Icon icon="lucide:user-minus" className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === "requests" && isLeader && (
            <div>
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="lucide:mail-check" className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Todo al día</h3>
                  <p className="text-gray-500">No tienes nuevas solicitudes de membresía pendientes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Nueva Solicitud
                          </span>
                          <span className="text-xs text-gray-400">
                            ID Solicitud: {req.id}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium">Vendedor (ID: {req.sellerId})</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                          "{req.message || "Quiero unirme a la tribu."}"
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => handleReviewRequest(req.id, "REJECTED")}
                          isLoading={isActionLoading === `req-${req.id}`}
                          className="text-red-600! border-red-200! hover:bg-red-50! dark:border-red-500/20! dark:hover:bg-red-500/10!"
                        >
                          Rechazar
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleReviewRequest(req.id, "ACCEPTED")}
                          isLoading={isActionLoading === `req-${req.id}`}
                        >
                          Aceptar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
