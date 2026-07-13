"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { getTribe, requestTribeMembership } from "@/lib/api/tribe.api";
import { findSellers } from "@/lib/api/seller.api";
import { getProducts } from "@/lib/api/product.api";
import type { TribeResponseDto, SellerResponseDto, ProductResponseDto } from "event-types";
import { ProductCard } from "@/components/ui/ProductCard";
import { Avatar } from "@/components/ui/Avatar";
import { MarketplaceNavbar } from "@/components/layout/MarketplaceNavbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/useAuth";

export default function TribeDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const router = useRouter();
  const { user } = useAuth();

  const [tribe, setTribe] = useState<TribeResponseDto | null>(null);
  const [members, setMembers] = useState<SellerResponseDto[]>([]);
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Membership request state
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(id)) {
      setError("ID de tribu inválido");
      setIsLoading(false);
      return;
    }

    const fetchTribeData = async () => {
      try {
        setIsLoading(true);
        // Fetch Tribe Details
        const tribeData = await getTribe(id);
        setTribe(tribeData);

        // Fetch Tribe Members (Sellers)
        const membersData = await findSellers(new URLSearchParams({ tribeId: id.toString(), limit: "100" }));
        setMembers(membersData.data || []);

        // Fetch Tribe Products
        const productsData = await getProducts({ tribeIds: id.toString(), limit: 12 });
        setProducts(productsData.data || []);

      } catch (err: any) {
        console.error("Error fetching tribe data:", err);
        setError("No se pudo cargar la información de la tribu. Es posible que no exista.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTribeData();
  }, [id]);

  const handleRequestMembership = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      setIsRequesting(true);
      setRequestError(null);
      setRequestSuccess(null);
      await requestTribeMembership(id, { message: "Hola, me gustaría unirme a esta tribu para colaborar." });
      setRequestSuccess("¡Solicitud enviada exitosamente! El líder la revisará pronto.");
    } catch (err: any) {
      console.error(err);
      if (err.status === 409) {
        setRequestError("Ya tienes una solicitud pendiente o ya perteneces a una tribu.");
      } else {
        setRequestError(err.message || "Ocurrió un error al enviar la solicitud.");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <MarketplaceNavbar />
        <div className="flex-1 flex justify-center items-center py-20">
          <Icon icon="lucide:loader-2" className="w-12 h-12 text-brand-primary animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !tribe) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <MarketplaceNavbar />
        <div className="flex-1 flex justify-center items-center py-20 px-4">
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center text-center max-w-md w-full border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Icon icon="lucide:alert-triangle" className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Comunidad no encontrada</h3>
            <p className="text-gray-500 mb-6">{error || "La tribu no existe."}</p>
            <button 
              onClick={() => router.push('/tribes')}
              className="bg-brand-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-secondary transition-colors"
            >
              Volver al Explorador
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const leader = members.find(m => m.id === tribe.primaryLeaderId);
  const secondaryLeader = members.find(m => m.id === tribe.secondaryLeaderId);
  const otherMembers = members.filter(m => m.id !== tribe.primaryLeaderId && m.id !== tribe.secondaryLeaderId);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Comunidad Activa';
      case 'PENDING_APPROVAL': return 'Pendiente de Aprobación';
      case 'INACTIVE': return 'Comunidad Inactiva';
      case 'REJECTED': return 'Comunidad Rechazada';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 pb-20">
        {/* Premium Hero Section */}
        <div className="bg-gradient-to-br from-brand-primary via-[#0B3D2E] to-brand-secondary relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-brand-secondary/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-72 h-72 bg-brand-light/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 relative z-10">
            <Link href="/tribes" className="inline-flex items-center text-white/70 hover:text-white mb-8 text-sm font-medium transition-colors">
              <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
              Explorar Tribus
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="flex-1 text-white max-w-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-md border border-white/20">
                    {getStatusLabel(tribe.status)}
                  </span>
                  {tribe.locationFormattedAddress && (
                    <div className="flex items-center text-white/80 text-sm font-medium">
                      <Icon icon="lucide:map-pin" className="w-4 h-4 mr-1.5" />
                      {tribe.locationFormattedAddress}
                    </div>
                  )}
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-bold font-poppins mb-4 leading-tight">
                  {tribe.name}
                </h1>
                
                {tribe.description && (
                  <p className="text-lg text-white/90 max-w-3xl leading-relaxed mb-6 font-light">
                    {tribe.description}
                  </p>
                )}

                {/* Membership Action */}
                <div className="flex items-center gap-4 flex-wrap mt-8">
                  <button 
                    onClick={handleRequestMembership}
                    disabled={isRequesting}
                    className="bg-white text-brand-primary px-8 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center transform hover:-translate-y-0.5"
                  >
                    {isRequesting ? (
                      <Icon icon="lucide:loader-2" className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Icon icon="lucide:user-plus" className="w-5 h-5 mr-2" />
                    )}
                    Solicitar Unirme
                  </button>
                  {requestSuccess && <span className="text-sm font-medium text-emerald-100 bg-emerald-900/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-emerald-500/30">{requestSuccess}</span>}
                  {requestError && <span className="text-sm font-medium text-red-100 bg-red-900/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-red-500/30">{requestError}</span>}
                </div>
              </div>

              {/* Quick stats floating card */}
              <div className="flex bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 gap-8 text-white shrink-0 mt-8 lg:mt-0 shadow-2xl">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold mb-1">{members.length}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Miembros</span>
                </div>
                <div className="w-px bg-white/20"></div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold mb-1">{products.length}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Productos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content Area (About + Products) */}
          <div className="lg:col-span-8 xl:col-span-9 order-2 lg:order-1 space-y-12">
            
            {/* Products Section */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Icon icon="lucide:shopping-bag" className="w-6 h-6 mr-3 text-brand-primary" />
                    Catálogo de Productos
                  </h2>
                  <p className="text-gray-500 mt-1 ml-9 text-sm">Lo más destacado de esta tribu en AmazonIA</p>
                </div>
                {products.length > 0 && (
                  <Link 
                    href={`/marketplace?tribeId=${id}`}
                    className="text-brand-primary hover:text-brand-secondary font-medium text-sm flex items-center transition-colors bg-brand-primary/5 hover:bg-brand-primary/10 px-4 py-2 rounded-full shrink-0"
                  >
                    Ver todos
                    <Icon icon="lucide:arrow-right" className="w-4 h-4 ml-2" />
                  </Link>
                )}
              </div>

              {products.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl shadow-sm p-12 text-center border border-dashed border-gray-200 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                    <Icon icon="lucide:package-open" className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Catálogo vacío</h3>
                  <p className="text-gray-500 max-w-sm text-sm">
                    Los miembros de esta tribu aún no han publicado productos.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products.slice(0, 4).map((product) => (
                      <ProductCard 
                        key={product.id} 
                        id={product.id}
                        image={product.imageUrl || "/placeholder.jpg"}
                        title={product.name}
                        rating={product.averageRating || 0}
                        category={product.category?.name || "Otros"}
                        description={product.description || ""}
                        price={`$${product.price}`}
                        href={`/marketplace/${product.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Area (Members & Leader) */}
          <div className="lg:col-span-4 xl:col-span-3 order-1 lg:order-2">
            <div className="sticky top-24 space-y-6">
              
              {/* Team Card */}
              <div className="bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <Icon icon="lucide:users-2" className="w-5 h-5 mr-2 text-brand-primary" />
                    Miembros ({members.length})
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-50">
                  {/* Leaders Section */}
                  <div className="p-6 space-y-5 bg-gradient-to-b from-brand-primary/[0.02] to-transparent">
                    {leader ? (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar 
                            src={leader.user?.avatarUrl || undefined} 
                            alt={leader.user?.fullName || "Líder"} 
                            size="lg" 
                            fallback={leader.user?.fullName?.charAt(0) || "L"}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 p-1 rounded-full border-2 border-white" title="Líder Principal">
                            <Icon icon="lucide:crown" className="w-3 h-3" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{leader.user?.fullName || "Usuario Desconocido"}</h4>
                          <p className="text-xs font-medium text-brand-primary">Líder Principal</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Icon icon="lucide:shield-alert" className="w-4 h-4 shrink-0" />
                        Sin líder principal
                      </div>
                    )}

                    {secondaryLeader && (
                      <div className="flex items-center gap-4 pt-5 border-t border-gray-100">
                        <div className="relative">
                          <Avatar 
                            src={secondaryLeader.user?.avatarUrl || undefined} 
                            alt={secondaryLeader.user?.fullName || "Sublíder"} 
                            size="md" 
                            fallback={secondaryLeader.user?.fullName?.charAt(0) || "S"}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{secondaryLeader.user?.fullName || "Usuario Desconocido"}</h4>
                          <p className="text-xs font-medium text-gray-500">Líder Secundario</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Members Section */}
                  {otherMembers.length > 0 && (
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pt-4 pb-2">
                        Vendedores
                      </div>
                      <ul className="max-h-72 overflow-y-auto custom-scrollbar">
                        {otherMembers.map((member) => (
                          <li key={member.id} className="p-2 hover:bg-gray-50 transition-colors rounded-xl flex items-center gap-3">
                            <Avatar 
                              src={member.user?.avatarUrl || undefined} 
                              alt={member.user?.fullName || "Miembro"} 
                              size="sm" 
                              fallback={member.user?.fullName?.charAt(0) || "M"}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {member.user?.fullName || "Usuario"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
