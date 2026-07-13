"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { ProposalDetail as ProposalDetailView } from '@/components/explorer/ProposalDetail';
import { getExplorerProposalById, getExplorerMembers } from '@/lib/explorer-api';
import { ProposalDetail } from '@/lib/explorer-mock';
import { useAuth } from '@/lib/useAuth';

function GovernanceDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
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
            // Load specific proposal
            return getExplorerProposalById(id);
          }
        })
        .then(data => {
          if (data) setProposal(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, id, router]);

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
      <main className="min-h-screen bg-gray-50/50 pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-[1000px] mx-auto font-sans">
        <div className="mb-8">
          <Link href="/marketplace/governance" className="inline-flex items-center text-sm font-bold text-muted hover:text-brand-primary transition-colors mb-4 bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-brand-primary/30 shadow-sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver a Resoluciones
          </Link>
        </div>

        {!proposal ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Propuesta no encontrada</h2>
            <p>El identificador '{id}' no existe en la red de gobernanza actual.</p>
          </div>
        ) : (
          <ProposalDetailView proposal={proposal} readOnly={false} />
        )}
      </main>
      <Footer />
    </>
  );
}

export default function GovernanceDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando propuesta...</div>}>
      <GovernanceDetailContent />
    </Suspense>
  );
}
