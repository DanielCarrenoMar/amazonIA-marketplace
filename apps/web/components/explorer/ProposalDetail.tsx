import React from 'react';
import { ProposalDetail as IProposalDetail } from '@/lib/explorer-mock';
import { VoteProgressBar } from './VoteProgressBar';

export function ProposalDetail({ proposal }: { proposal: IProposalDetail }) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'CONFIRMED': return 'text-green-700 bg-green-100';
      case 'VETOED': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-8">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{proposal.title}</h2>
          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold shrink-0 ${getStatusColor(proposal.status)}`}>
            {proposal.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted mb-6">
          <p className="font-mono bg-gray-100 px-2 py-1 rounded text-slate-600">ID: {proposal.id}</p>
          <p>{new Date(proposal.createdAt).toLocaleString()}</p>
        </div>
        
        <p className="text-slate-700 leading-relaxed mb-8 bg-brand-nature-bg p-5 rounded-2xl border border-brand-primary-light">
          {proposal.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="block text-xs font-bold text-slate-500 mb-2 tracking-wider">CÓDIGO DE PRODUCTO</span>
            <span className="font-mono text-sm font-semibold text-slate-900">{proposal.productId}</span>
          </div>
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="block text-xs font-bold text-slate-500 mb-2 tracking-wider">BILLETERA COMPRADOR</span>
            <span className="font-mono text-sm font-semibold text-slate-900 break-all">{proposal.buyerAddress}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Progreso de Votación</h3>
        <div className="max-w-md bg-gray-50 p-4 rounded-xl border border-gray-100">
          <VoteProgressBar votesFor={proposal.votesFor} votesAgainst={proposal.votesAgainst} />
        </div>
      </div>

      {proposal.votes.length > 0 && (
        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Historial de Votos</h3>
          <ul className="space-y-3">
            {proposal.votes.map(v => (
              <li key={v.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-xl hover:border-gray-200 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0">
                    {v.memberName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{v.memberName}</p>
                    <p className="text-xs text-muted">{new Date(v.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 shadow-sm ${v.voteType === 'FAVOR' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                  {v.voteType === 'FAVOR' ? 'A FAVOR' : 'EN CONTRA'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
