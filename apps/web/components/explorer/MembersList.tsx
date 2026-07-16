import React from 'react';
import { GovernanceMember } from '@/lib/explorer-mock';

export function MembersList({ members }: { members: GovernanceMember[] }) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Consejo de Gobernanza</h3>
        <span className="bg-brand-nature-bg text-brand-primary-dark font-bold px-3 py-1 rounded-full text-sm border border-brand-primary-light">
          {members.length} Miembros Activos
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <div key={m.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-start gap-4 hover:border-brand-primary/30 transition-colors">
            <div className="w-12 h-12 bg-white text-brand-primary rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0 border border-gray-100">
              {m.user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate" title={m.user.name}>{m.user.name}</p>
              <div className="flex flex-col gap-2 mt-2">
                <span className={`w-max text-[10px] uppercase font-bold px-2 py-0.5 rounded ${m.role === 'ELDER' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                  {m.role === 'ELDER' ? 'MAYOR' : 'MIEMBRO'}
                </span>
                <span className="text-[11px] bg-white px-2 py-1 rounded-md font-mono text-slate-500 border border-gray-200 truncate inline-block" title={m.walletAddress}>
                  {m.walletAddress.substring(0,8)}...{m.walletAddress.substring(m.walletAddress.length - 6)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
