"use client";

import React, { useEffect, useState } from 'react';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { ExplorerTable } from '@/components/explorer/ExplorerTable';
import { MembersList } from '@/components/explorer/MembersList';
import { getExplorerProposals, getExplorerMembers } from '@/lib/explorer-api';
import { ProposalSummary, GovernanceMember } from '@/lib/explorer-mock';

export default function ExplorerIndexPage() {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getExplorerProposals(), getExplorerMembers()])
      .then(([propsData, memData]) => {
        setProposals(propsData);
        setMembers(memData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-gray-50/50 pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Blockchain Explorer</h1>
          <p className="text-slate-600 mt-3 text-lg max-w-3xl">Explora y audita democráticamente las propuestas, el historial de transacciones y las decisiones del consejo sobre la originación de productos.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-4">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-lg">Cargando datos de la red descentralizada...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <ExplorerTable proposals={proposals} />
            <MembersList members={members} />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
