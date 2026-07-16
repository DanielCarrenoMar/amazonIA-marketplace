"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { ExplorerTable } from '@/components/explorer/ExplorerTable';
import { getExplorerProposals, getExplorerMembers } from '@/lib/explorer-api';
import { ProposalSummary } from '@/lib/explorer-mock';
import { useAuth } from '@/lib/useAuth';

function GovernanceContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setIsAuthorized(false);
        router.push('/login');
        return;
      }

      // Check if user is a member of the council
      getExplorerMembers()
        .then(members => {
          const found = members.some(m => m.userId === user.id);
          setIsAuthorized(found);
          if (found) {
            // Load proposals
            return getExplorerProposals();
          }
        })
        .then(propsData => {
          if (propsData) setProposals(propsData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || isAuthorized === null || (isAuthorized && loading)) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-gray-50/50 pt-28 md:pt-32 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-lg">Verificando credenciales del consejo...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthorized) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-gray-50/50 pt-28 md:pt-32 flex items-center justify-center px-4">
          <div className="text-center py-16 px-8 max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Acceso Denegado</h2>
            <p className="text-slate-600 mb-6">Esta sección está reservada exclusivamente para los miembros activos del Consejo de Gobernanza y el Elder de AmazonIA.</p>
            <button 
              onClick={() => router.push('/marketplace')} 
              className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-full text-sm hover:bg-brand-primary-dark transition-colors"
            >
              Volver al Marketplace
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-gray-50/50 pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
        <div className="mb-8">
          <div className="inline-block bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider">
            CONSEJO DE GOBERNANZA
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Panel de Votaciones y Resoluciones</h1>
          <p className="text-slate-600 mt-3 text-lg max-w-3xl">Vota y audita las propuestas de notarización de productos en la blockchain de AmazonIA.</p>
        </div>

        <ExplorerTable proposals={proposals} mode="governance" />
      </main>
      <Footer />
    </>
  );
}

export default function GovernanceIndexPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando gobernanza...</div>}>
      <GovernanceContent />
    </Suspense>
  );
}
