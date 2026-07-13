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

        // Fetch Tribe Products - IMPORTANT: the API uses tribeIds (plural)
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
      setRequestSuccess("¡Solicitud enviada exitosamente! El líder de la tribu la revisará pronto.");
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
  const otherMembers = members.filter(m => m.id !== tribe.primaryLeaderId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <div className="bg-brand-primary relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-brand-secondary/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-72 h-72 bg-brand-light/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
            <Link href="/tribes" className="inline-flex items-center text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors">
              <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
              Volver a tribus
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10 uppercase tracking-wider">
                    {tribe.status === 'ACTIVE' ? 'Comunidad Activa' : tribe.status}
                  </span>
                  <div className="flex items-center text-white/90 text-sm">
                    <Icon icon="lucide:map-pin" className="w-4 h-4 mr-1" />
                    {tribe.locationFormattedAddress || "Ubicación Regional"}
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">
                  {tribe.name}
                </h1>
                
                <p className="text-lg text-white/90 max-w-3xl leading-relaxed mb-6">
                  {tribe.description || "Esta comunidad de vendedores artesanos está trabajando en conjunto para ofrecer sus mejores productos en el ecosistema AmazonIA."}
                </p>

                {/* Membership Action */}
                <div className="flex items-center gap-4 flex-wrap">
                  <button 
                    onClick={handleRequestMembership}
                    disabled={isRequesting}
                    className="bg-white text-brand-primary px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                  >
                    {isRequesting ? (
                      <Icon icon="lucide:loader-2" className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Icon icon="lucide:user-plus" className="w-5 h-5 mr-2" />
                    )}
                    Solicitar Unirme
                  </button>
                  {requestSuccess && <span className="text-sm text-green-300 bg-green-900/40 px-3 py-1 rounded-md">{requestSuccess}</span>}
                  {requestError && <span className="text-sm text-red-300 bg-red-900/40 px-3 py-1 rounded-md">{requestError}</span>}
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 gap-6 text-white shrink-0 mt-6 md:mt-0">
                <div className="flex flex-col items-center px-2">
                  <span className="text-2xl font-bold">{members.length}</span>
                  <span className="text-xs uppercase tracking-wider text-white/80">Miembros</span>
                </div>
                <div className="w-px bg-white/20"></div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-2xl font-bold">{products.length}</span>
                  <span className="text-xs uppercase tracking-wider text-white/80">Productos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area (Products) */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Icon icon="lucide:shopping-bag" className="w-6 h-6 mr-2 text-brand-primary" />
                Productos de la Tribu
              </h2>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Icon icon="lucide:package-open" className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Sin productos publicados</h3>
                <p className="text-gray-500 max-w-sm">
                  Los miembros de esta tribu aún no han publicado productos en el mercado.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
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
            )}
          </div>

          {/* Sidebar Area (Members & Leader) */}
          <div className="lg:col-span-4 order-1 lg:order-2 space-y-6">
            
            {/* Leader Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-primary/20 overflow-hidden">
              <div className="bg-brand-primary/5 px-6 py-4 border-b border-brand-primary/10 flex items-center justify-between">
                <h3 className="font-semibold text-brand-primary flex items-center">
                  <Icon icon="lucide:crown" className="w-5 h-5 mr-2" />
                  Líder de la Tribu
                </h3>
              </div>
              <div className="p-6">
                {leader ? (
                  <div className="flex items-center gap-4">
                    <Avatar 
                      src={leader.user?.avatarUrl || undefined} 
                      alt={leader.user?.fullName || "Líder"} 
                      size="lg" 
                      fallback={leader.user?.fullName?.charAt(0) || "L"}
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{leader.user?.fullName || "Usuario Desconocido"}</h4>
                      <p className="text-sm text-gray-500">Vendedor Principal</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm flex items-center gap-2">
                    <Icon icon="lucide:user-x" className="w-4 h-4" />
                    No hay líder asignado
                  </div>
                )}
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Icon icon="lucide:users" className="w-5 h-5 mr-2 text-gray-400" />
                  Miembros ({otherMembers.length})
                </h3>
              </div>
              <div className="p-2">
                {otherMembers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No hay otros miembros en esta tribu.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50 max-h-96 overflow-y-auto custom-scrollbar">
                    {otherMembers.map((member) => (
                      <li key={member.id} className="p-3 hover:bg-gray-50 transition-colors rounded-lg flex items-center gap-3">
                        <Avatar 
                          src={member.user?.avatarUrl || undefined} 
                          alt={member.user?.fullName || "Miembro"} 
                          size="md" 
                          fallback={member.user?.fullName?.charAt(0) || "M"}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.user?.fullName || "Usuario"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">Vendedor</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
