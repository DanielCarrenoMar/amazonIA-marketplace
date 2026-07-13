"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getActiveTribes, getMyMembershipRequests, requestTribeMembership } from "@/lib/api/tribe.api";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/components/ui/Toast";
import type { TribeResponseDto, TribeMembershipRequestResponseDto } from "event-types";

export default function TribesExplorerPage() {
  const { user, isSeller } = useAuth();
  const { toast } = useToast();
  
  const [tribes, setTribes] = useState<TribeResponseDto[]>([]);
  const [myRequests, setMyRequests] = useState<TribeMembershipRequestResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTribes = async () => {
      try {
        setIsLoading(true);
        const res = await getActiveTribes();
        setTribes(res.data);
      } catch (error) {
        console.error("Error fetching tribes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTribes();
  }, []);

  useEffect(() => {
    if (user && isSeller) {
      const fetchRequests = async () => {
        try {
          const res = await getMyMembershipRequests();
          setMyRequests(res);
        } catch (error) {
          console.error("Error fetching membership requests:", error);
        }
      };
      fetchRequests();
    }
  }, [user, isSeller]);

  const handleRequestMembership = async (e: React.MouseEvent, tribeId: number) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    
    if (!user) return;
    
    try {
      setRequestingId(tribeId);
      const newRequest = await requestTribeMembership(tribeId, { message: "Hola, me gustaría unirme a esta tribu para colaborar." });
      setMyRequests(prev => [newRequest, ...prev]);
      toast({ title: "Solicitud enviada exitosamente", variant: "success" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error al enviar solicitud", description: err.message || "Ocurrió un error", variant: "error" });
    } finally {
      setRequestingId(null);
    }
  };

  const hasPendingRequest = (tribeId: number) => {
    return myRequests.some(req => req.tribeId === tribeId && req.status === "PENDING");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-brand-primary text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">
            Explora las Tribus de AmazonIA
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            Descubre comunidades de vendedores locales, únete a tu tribu y crece junto al ecosistema productivo de la región.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 mt-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Tribus Activas</h2>
          <span className="bg-brand-primary/10 text-brand-primary font-semibold px-3 py-1 rounded-full text-sm">
            {tribes.length} {tribes.length === 1 ? 'Tribu' : 'Tribus'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Icon icon="lucide:loader-2" className="w-10 h-10 text-brand-primary animate-spin" />
          </div>
        ) : tribes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Icon icon="lucide:users" className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay tribus activas aún</h3>
            <p className="text-gray-500 max-w-md">
              Actualmente no se han creado tribus en la plataforma.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tribes.map((tribe) => {
              const isPending = hasPendingRequest(tribe.id);
              
              return (
                <Link 
                  href={`/tribes/${tribe.id}`} 
                  key={tribe.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col relative"
                >
                  <div className="h-32 bg-linear-to-br from-brand-primary/80 to-brand-secondary/80 flex items-center justify-center relative overflow-hidden">
                    <Icon icon="lucide:tent" className="w-16 h-16 text-white/20 absolute -right-2 -bottom-2 transform rotate-12" />
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md relative z-10">
                      <Icon icon="lucide:users" className="w-8 h-8 text-brand-primary" />
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">
                      {tribe.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                      {tribe.description || "Sin descripción proporcionada."}
                    </p>
                    
                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-3 mt-auto">
                      {isSeller && !user?.tribeId && (
                        isPending ? (
                          <div className="w-full bg-yellow-50 text-yellow-700 py-2 rounded-lg text-sm font-bold flex justify-center items-center border border-yellow-200">
                            <Icon icon="lucide:clock" className="w-4 h-4 mr-2" />
                            Solicitud Pendiente
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleRequestMembership(e, tribe.id)}
                            disabled={requestingId === tribe.id}
                            className="w-full bg-brand-primary text-white py-2 rounded-lg text-sm font-bold flex justify-center items-center hover:bg-brand-secondary transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {requestingId === tribe.id ? (
                              <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Icon icon="lucide:user-plus" className="w-4 h-4 mr-2" />
                            )}
                            Unirse a Tribu
                          </button>
                        )
                      )}
                      
                      <div className="flex items-center justify-between text-sm mt-1">
                        <div className="flex items-center text-gray-500">
                          <Icon icon="lucide:store" className="w-4 h-4 mr-1.5" />
                          <span>Comunidad</span>
                        </div>
                        <div className="flex items-center text-brand-primary font-semibold group-hover:translate-x-1 transition-transform">
                          Ver detalle <Icon icon="lucide:arrow-right" className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
