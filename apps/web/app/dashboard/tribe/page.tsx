"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { 
  getMyTribe, 
  getTribeMembershipRequests, 
  reviewTribeMembership, 
  removeTribeMember,
  getMyMembershipRequests
} from "@/lib/api/tribe.api";
import { findSellers } from "@/lib/api/seller.api";
import { getProducts } from "@/lib/api/product.api";
import { useAuth } from "@/lib/useAuth";
import type { TribeResponseDto, SellerResponseDto, TribeMembershipRequestResponseDto, ProductResponseDto } from "event-types";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { createProposalProxy, getExplorerMembers, getExplorerProposals, finalizeProposal } from "@/lib/explorer-api";

export default function TribeManagementPage() {
  const { user, isLeader } = useAuth();
  const [activeTab, setActiveTab] = useState<"members" | "requests" | "products">("members");
  
  const [tribe, setTribe] = useState<TribeResponseDto | null>(null);
  const [members, setMembers] = useState<SellerResponseDto[]>([]);
  const [requests, setRequests] = useState<TribeMembershipRequestResponseDto[]>([]);
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [myPendingRequest, setMyPendingRequest] = useState<TribeMembershipRequestResponseDto | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<number | string | null>(null);
  const [isGovMember, setIsGovMember] = useState(false);
  const [govProposals, setGovProposals] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      getExplorerMembers()
        .then((members) => {
          const found = members.some((m) => m.userId === user.id);
          setIsGovMember(found);
        })
        .catch(() => setIsGovMember(false));
    }
  }, [user]);

  const handleInitiateVote = async (req: TribeMembershipRequestResponseDto) => {
    try {
      setIsActionLoading(`vote-${req.id}`);
      
      const randomPart = Math.random().toString(36).substring(2, 6);
      const proposalId = `gov-tribe_admission-${Date.now().toString().slice(-6)}-${randomPart}`;
      
      const candidateName = req.seller?.user?.fullName || req.seller?.user?.username || "Candidato";
      const candidateUserId = req.sellerId;
      const targetTribeId = req.tribeId;

      const contentHashObj = {
        userId: candidateUserId,
        name: candidateName,
        tribeId: targetTribeId,
      };

      await createProposalProxy(
        proposalId,
        JSON.stringify(contentHashObj),
        60,
        "TRIBE_ADMISSION"
      );

      toast.success("Votación iniciada en blockchain para admitir al miembro");
      await loadTribeData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al iniciar la votación");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleFinalizeVote = async (proposalId: string) => {
    try {
      setIsActionLoading(`finalize-${proposalId}`);
      await finalizeProposal(proposalId);
      toast.success("Votación finalizada con éxito");
      await loadTribeData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al finalizar la votación");
    } finally {
      setIsActionLoading(null);
    }
  };

  const loadTribeData = async () => {
    try {
      setIsLoading(true);
      let myTribe = null;
      try {
        myTribe = await getMyTribe();
      } catch (err) {
        console.warn("User has no active tribe", err);
      }
      setTribe(myTribe);
      
      if (myTribe) {
        // Fetch Members
        const sellersRes = await findSellers(new URLSearchParams({ tribeId: myTribe.id.toString() }));
        setMembers(sellersRes.data);
        
        // Fetch Tribe Products
        const productsRes = await getProducts({ tribeIds: myTribe.id.toString() });
        setProducts(productsRes.data);
        
        // Fetch pending requests — compute leadership from fresh tribe data
        // instead of relying on `isLeader` from useAuth (which may be stale)
        const amILeader = user && (
          myTribe.primaryLeaderId === user.id || 
          myTribe.secondaryLeaderId === user.id
        );
        
        if (amILeader) {
          try {
            const [requestsRes, proposalsRes] = await Promise.all([
              getTribeMembershipRequests(myTribe.id, new URLSearchParams({ status: "PENDING" })),
              getExplorerProposals(),
            ]);
            setRequests(requestsRes.data);
            // Filter only pending proposals that match admission type
            setGovProposals(proposalsRes.filter(p => p.status === "PENDING" && p.type === "TRIBE_ADMISSION"));
          } catch (err) {
            console.error("Error loading membership requests / proposals:", err);
          }
        }
      } else {
        // Fetch if the seller has a pending request to join a tribe
        try {
          const myReqs = await getMyMembershipRequests();
          const pending = myReqs.find(req => req.status === "PENDING");
          setMyPendingRequest(pending || null);
        } catch (e) {
          console.error("No se pudieron cargar las solicitudes pendientes");
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

  const handleReviewRequest = async (requestId: number, status: "APPROVED" | "REJECTED") => {
    if (!tribe) return;
    try {
      setIsActionLoading(`req-${requestId}`);
      // Assuming event-types enum value is mapped to strings APPROVED/REJECTED or similar
      await reviewTribeMembership(tribe.id, requestId, { status: status as any });
      await loadTribeData(); // Reload all data
      toast.success(status === "APPROVED" ? "Solicitud aprobada" : "Solicitud rechazada");
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
    if (myPendingRequest && myPendingRequest.tribe) {
      return (
        <div className="bg-white rounded-3xl p-10 border border-yellow-200 shadow-sm text-center max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="lucide:clock" className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud en Proceso</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Has solicitado unirte a la tribu <span className="font-bold text-gray-900">{myPendingRequest.tribe.name}</span>. Por favor, espera a que el líder apruebe tu solicitud.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 inline-block text-left mb-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Tu mensaje:</p>
            <p className="text-sm text-gray-800 italic">"{myPendingRequest.message}"</p>
          </div>
          <br/>
          <Link href="/tribes" className="inline-flex items-center text-brand-primary font-medium hover:underline">
            ← Volver a explorar tribus
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center max-w-2xl mx-auto mt-10">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon icon="lucide:tent" className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No perteneces a una tribu</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Explora las tribus activas y solicita unirte a una para ver esta información y colaborar con otros vendedores locales.
        </p>
        <Link 
          href="/tribes"
          className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-secondary transition-colors inline-flex items-center"
        >
          <Icon icon="lucide:compass" className="w-5 h-5 mr-2" />
          Explorar Tribus
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-gray-900 mb-2">
            {isLeader ? "Gestión de la Tribu" : "Mi Tribu"}
          </h1>
          <p className="text-xl font-semibold text-brand-primary mb-2">
            {tribe.name}
          </p>
          {tribe.description && (
            <p className="text-gray-600 max-w-3xl mb-3 leading-relaxed">
              {tribe.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
            {tribe.locationFormattedAddress && (
              <span className="flex items-center">
                <Icon icon="lucide:map-pin" className="w-4 h-4 mr-1.5" />
                {tribe.locationFormattedAddress}
              </span>
            )}
            <span className="flex items-center">
              <Icon icon="lucide:calendar" className="w-4 h-4 mr-1.5" />
              Creada el {new Date(tribe.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl font-medium border border-brand-primary/20 flex items-center">
            <Icon icon="lucide:users" className="w-4 h-4 mr-2" />
            {members.length} Miembros
          </div>
          {isLeader && requests.length > 0 && (
            <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-xl font-medium border border-yellow-200 flex items-center">
              <Icon icon="lucide:bell" className="w-4 h-4 mr-2" />
              {requests.length} Pendientes
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden mt-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 flex items-center justify-center py-4 font-medium transition-colors ${
              activeTab === "members" 
                ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon icon="lucide:users" className="w-5 h-5 mr-2" />
            Vendedores Activos
          </button>
          
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 flex items-center justify-center py-4 font-medium transition-colors ${
              activeTab === "products" 
                ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon icon="lucide:package" className="w-5 h-5 mr-2" />
            Productos de la Tribu
          </button>
          
          {isLeader && (
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 flex items-center justify-center py-4 font-medium transition-colors ${
                activeTab === "requests" 
                  ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5" 
                  : "text-gray-500 hover:text-gray-700"
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
        <div className="py-8 min-h-[400px]">
          
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
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                          {member.user?.avatarUrl ? (
                            <img src={member.user.avatarUrl} alt={member.user?.username || member.user?.fullName || 'Vendedor'} className="w-full h-full object-cover" />
                          ) : (
                            <Icon icon="lucide:store" className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{member.user?.username || member.user?.fullName || 'Vendedor'}</h4>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {member.id === tribe.primaryLeaderId || member.id === tribe.secondaryLeaderId ? "Líder" : "Miembro"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mostrar botón de eliminar SOLO si eres el líder y no te estás intentando borrar a ti mismo */}
                      {isLeader && member.id !== tribe.primaryLeaderId && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isActionLoading === `remove-${member.id}`}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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

          {/* PRODUCTS TAB */}
          {activeTab === "products" && (
            <div>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="lucide:package-open" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay productos publicados por los miembros de esta tribu.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.name}
                      price={`$${product.price.toString()}`}
                      description={product.description || ""}
                      image={product.imageUrl || "https://placehold.co/400x300/e2e8f0/64748b?text=Sin+Imagen"}
                      category={product.category?.name || "General"}
                      rating={product.averageRating ? Number(product.averageRating) : 5}
                      href={`/store/product/${product.id}`}
                      stockAvailable={product.stockAvailable}
                    />
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Todo al día</h3>
                  <p className="text-gray-500">No tienes nuevas solicitudes de membresía pendientes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Nueva Solicitud
                          </span>
                          <span className="text-xs text-gray-400">
                            ID Solicitud: {req.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                            {req.seller?.user?.avatarUrl ? (
                              <img src={req.seller.user.avatarUrl} alt={req.seller.user.username || req.seller.user.fullName || 'Vendedor'} className="w-full h-full object-cover" />
                            ) : (
                              <Icon icon="lucide:user" className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">
                              {req.seller?.user?.username || req.seller?.user?.fullName || "Vendedor"}
                            </p>
                            <p className="text-xs text-gray-500 font-normal mb-1">
                              ID: {req.sellerId}
                            </p>
                            {(req.seller?.user?.email || req.seller?.user?.locationFormattedAddress) && (
                              <div className="flex flex-col gap-1 text-xs text-gray-500 mt-1.5">
                                {req.seller?.user?.email && (
                                  <span className="flex items-center gap-1.5">
                                    <Icon icon="lucide:mail" className="w-3.5 h-3.5 opacity-70" />
                                    {req.seller.user.email}
                                  </span>
                                )}
                                {req.seller?.user?.locationFormattedAddress && (
                                  <span className="flex items-center gap-1.5">
                                    <Icon icon="lucide:map-pin" className="w-3.5 h-3.5 opacity-70" />
                                    {req.seller.user.locationFormattedAddress}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 italic mt-3 bg-white p-3 rounded-lg border border-gray-100">
                          "{req.message || "Quiero unirme a la tribu."}"
                        </p>
                      </div>
                             {(() => {
                        const candidateName = req.seller?.user?.fullName || req.seller?.user?.username || "";
                        const isReqInVote = govProposals.some(p => 
                          p.title.toLowerCase().includes(candidateName.toLowerCase())
                        );

                        if (isReqInVote) {
                          const matchingProposal = govProposals.find(p => 
                            p.title.toLowerCase().includes(candidateName.toLowerCase())
                          );
                          const proposalId = matchingProposal?.id;

                          return (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl border border-amber-200 font-bold text-xs uppercase tracking-wider">
                                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-amber-600" />
                                En Votación de Gobernanza
                              </div>
                              {proposalId && (
                                <Button
                                  variant="primary"
                                  onClick={() => handleFinalizeVote(proposalId)}
                                  isLoading={isActionLoading === `finalize-${proposalId}`}
                                >
                                  Finalizar Votación
                                </Button>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center gap-3 shrink-0">
                            {isGovMember && (
                              <Button
                                variant="outline"
                                onClick={() => handleInitiateVote(req)}
                                isLoading={isActionLoading === `vote-${req.id}`}
                                className="text-brand-primary! border-brand-primary/30! hover:bg-brand-primary/5!"
                              >
                                Llevar a Votación
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => handleReviewRequest(req.id, "REJECTED")}
                              isLoading={isActionLoading === `req-${req.id}`}
                              className="text-red-650! border-red-200! hover:bg-red-55!"
                            >
                              Rechazar
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleReviewRequest(req.id, "APPROVED")}
                              isLoading={isActionLoading === `req-${req.id}`}
                            >
                              Aceptar
                            </Button>
                          </div>
                        );
                      })()}
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
