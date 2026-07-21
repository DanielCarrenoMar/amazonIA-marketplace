import React, { useState } from 'react';
import Link from 'next/link';
import { ProposalSummary, ProposalStatus } from '@/lib/explorer-mock';
import { VoteProgressBar } from './VoteProgressBar';

export function ExplorerTable({ proposals, mode = 'explorer' }: { proposals: ProposalSummary[], mode?: 'explorer' | 'governance' }) {
  const [filter, setFilter] = useState<ProposalStatus | 'ALL'>('ALL');

  const filteredProposals = filter === 'ALL' ? proposals : proposals.filter(p => p.status === filter);

  const getStatusColor = (status: ProposalStatus) => {
    switch(status) {
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'APPROVED': return 'text-blue-700 bg-blue-100';
      case 'CONFIRMED': return 'text-green-700 bg-green-100';
      case 'VETOED': return 'text-red-700 bg-red-100';
      case 'FAILED': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex gap-3 mb-6 border-b border-gray-100 pb-4 overflow-x-auto scrollbar-hide">
        {['ALL', 'PENDING', 'APPROVED', 'CONFIRMED', 'VETOED', 'FAILED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${filter === f ? 'bg-brand-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendientes' : f === 'APPROVED' ? 'Aprobadas' : f === 'CONFIRMED' ? 'Confirmadas' : f === 'VETOED' ? 'Vetadas' : 'Fallidas'}
          </button>
        ))}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-slate-500 text-sm">
              <th className="py-3 px-4 font-semibold w-[120px]">ID</th>
              <th className="py-3 px-4 font-semibold">Título</th>
              <th className="py-3 px-4 font-semibold">Proponente</th>
              <th className="py-3 px-4 font-semibold w-[120px]">Estado</th>
              <th className="py-3 px-4 font-semibold w-[200px]">Votos</th>
              <th className="py-3 px-4 font-semibold w-[150px]">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filteredProposals.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4 text-sm font-mono text-brand-primary">
                  <Link href={mode === 'governance' ? `/marketplace/governance/${p.id}` : `/marketplace/explorer/${p.id}`} className="hover:underline font-bold">{p.id}</Link>
                </td>
                <td className="py-4 px-4 text-sm font-medium text-slate-900">{p.title}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{p.proposerName}</td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <VoteProgressBar votesFor={p.votesFor} votesAgainst={p.votesAgainst} />
                </td>
                <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProposals.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl mt-4">
            No hay propuestas que coincidan con este filtro.
          </div>
        )}
      </div>
    </div>
  );
}
