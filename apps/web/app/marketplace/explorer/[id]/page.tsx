"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { ProposalDetail as ProposalDetailView } from '@/components/explorer/ProposalDetail';
import { getExplorerProposalById } from '@/lib/explorer-api';
import { ProposalDetail } from '@/lib/explorer-mock';

function ExplorerDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExplorerProposalById(id).then(data => {
      setProposal(data);
      setLoading(false);
    });
  }, [id]);

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-gray-50/50 pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-[1000px] mx-auto font-sans">
        <div className="mb-8">
          <Link href="/marketplace/explorer" className="inline-flex items-center text-sm font-bold text-muted hover:text-brand-primary transition-colors mb-4 bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-brand-primary/30 shadow-sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver al Explorer
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-4">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-lg">Buscando bloques de información...</p>
          </div>
        ) : !proposal ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Propuesta no encontrada</h2>
            <p>El identificador '{id}' no existe en la red actual.</p>
          </div>
        ) : (
          <ProposalDetailView proposal={proposal} />
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ExplorerDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando propuesta...</div>}>
      <ExplorerDetailContent />
    </Suspense>
  );
}
