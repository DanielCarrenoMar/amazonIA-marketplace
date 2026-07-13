"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { getTribe, requestTribeMembership } from "@/lib/api/tribe.api";
import { findSellers } from "@/lib/api/seller.api";
import { useAuth } from "@/lib/useAuth";
import type { TribeResponseDto, SellerResponseDto, ProductResponseDto } from "event-types";
import { getProducts } from "@/lib/api/product.api";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";

export default function TribeDetailPage() {
  const { id } = useParams();
  const tribeId = parseInt(id as string, 10);
  const router = useRouter();
  const { user } = useAuth();
  
  const [tribe, setTribe] = useState<TribeResponseDto | null>(null);
  const [sellers, setSellers] = useState<SellerResponseDto[]>([]);
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const tribeRes = await getTribe(tribeId);
        setTribe(tribeRes);

        const sellersRes = await findSellers(new URLSearchParams({ tribeId: tribeId.toString() }));
        setSellers(sellersRes.data);

        const productsRes = await getProducts({ tribeId: tribeId });
        setProducts(productsRes.data);
      } catch (error: any) {
        console.error("Error fetching tribe data:", error);
        setErrorMsg("No se pudo cargar la información de la tribu.");
      } finally {
        setIsLoading(false);
      }
    };
    if (!isNaN(tribeId)) fetchData();
  }, [tribeId]);

  const handleRequestMembership = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      setIsRequesting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await requestTribeMembership(tribeId, { message: "Hola, me gustaría unirme a esta tribu para colaborar y crecer juntos." });
      setSuccessMsg("¡Solicitud enviada exitosamente! El líder de la tribu la revisará pronto.");
    } catch (err: any) {
      console.error(err);
      if (err.status === 409) {
        setErrorMsg("Ya tienes una solicitud pendiente o ya perteneces a una tribu.");
      } else {
        setErrorMsg(err.message || "Ocurrió un error al enviar la solicitud.");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Icon icon="lucide:loader-2" className="w-10 h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Icon icon="lucide:tent" className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tribu no encontrada</h2>
        <p className="text-gray-500 mb-6">La tribu que buscas no existe o ha sido desactivada.</p>
        <Link href="/tribes" className="text-brand-primary font-semibold hover:underline flex items-center">
          <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-1" /> Volver a tribus
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-linear-to-r from-brand-primary to-brand-secondary relative">
        <Link href="/tribes" className="absolute top-6 left-6 text-white/90 hover:text-white font-medium flex items-center bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm transition-all hover:bg-black/30">
          <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
          Volver
        </Link>
        <Icon icon="lucide:tent" className="w-40 h-40 text-white/10 absolute right-10 bottom-0 transform rotate-12" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative -mt-16 md:-mt-24">
        {/* Tribe Info Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
            <div className="flex-1">
              <div className="w-24 h-24 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-brand-primary/20">
                <Icon icon="lucide:users" className="w-12 h-12 text-brand-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {tribe.name}
              </h1>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {tribe.description || "Sin descripción detallada."}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-gray-700 border border-gray-100">
                  <Icon icon="lucide:store" className="w-4 h-4 mr-2 text-brand-primary" />
                  <span className="font-medium">{sellers.length} vendedores</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-green-50 rounded-xl text-green-700 border border-green-100">
                  <Icon icon="lucide:check-circle" className="w-4 h-4 mr-2" />
                  <span className="font-medium">Tribu Activa</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto md:min-w-[280px] bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center text-center">
              {user?.seller?.tribeId === tribeId ? (
                <>
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                    <Icon icon="lucide:heart" className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Esta es tu tribu</h3>
                  <p className="text-sm text-gray-500">
                    Eres miembro activo de esta comunidad.
                  </p>
                </>
              ) : user?.seller?.tribeId ? (
                <>
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                    <Icon icon="lucide:info" className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Ya tienes una tribu</h3>
                  <p className="text-sm text-gray-500">
                    Perteneces a la tribu <span className="font-semibold text-brand-primary">{user.seller.tribe?.name || "otra tribu"}</span>. No puedes unirte a otra tribu.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-gray-900 mb-2">¿Quieres ser parte?</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Únete a esta comunidad para compartir recursos y conectar con otros vendedores.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleRequestMembership}
                    isLoading={isRequesting}
                    className="w-full"
                  >
                    Solicitar Unirse a la Tribu
                  </Button>
                </>
              )}
              
              {successMsg && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start text-left">
                  <Icon icon="lucide:check-circle" className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start text-left">
                  <Icon icon="lucide:alert-circle" className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Icon icon="lucide:package" className="w-6 h-6 mr-3 text-brand-primary" />
            Productos de esta tribu
          </h2>
          
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <Icon icon="lucide:package-open" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Aún no hay productos</h3>
              <p className="text-gray-500">Esta tribu aún no tiene productos publicados.</p>
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Members List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Icon icon="lucide:store" className="w-6 h-6 mr-3 text-brand-primary" />
            Vendedores en esta tribu
          </h2>
          
          {sellers.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <Icon icon="lucide:ghost" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Aún no hay vendedores</h3>
              <p className="text-gray-500">Sé el primero en unirte a esta tribu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sellers.map(seller => (
                <Link 
                  href={`/seller/${seller.id}`}
                  key={seller.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex items-center gap-4"
                >
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    {seller.user?.avatarUrl ? (
                      <img src={seller.user.avatarUrl} alt={seller.user?.username || seller.user?.fullName || 'Vendedor'} className="w-full h-full object-cover" />
                    ) : (
                      <Icon icon="lucide:store" className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-gray-900 truncate group-hover:text-brand-primary transition-colors">
                      {seller.user?.username || seller.user?.fullName || 'Vendedor'}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {seller.description || "Sin descripción"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
