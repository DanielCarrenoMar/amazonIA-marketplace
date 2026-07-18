import React, { useEffect, useState } from 'react';
import { ProposalDetail as IProposalDetail } from '@/lib/explorer-mock';
import { VoteProgressBar } from './VoteProgressBar';
import { useAuth } from '@/lib/useAuth';
import { getExplorerMembers, getExplorerProposalById, voteProposal, finalizeProposal, vetoProposal } from '@/lib/explorer-api';
import { getMyTribe } from '@/lib/api/tribe.api';
import { toast } from 'sonner';

export function ProposalDetail({ proposal, readOnly = false }: { proposal: IProposalDetail, readOnly?: boolean }) {
  const { user } = useAuth();
  const [localProposal, setLocalProposal] = useState<IProposalDetail>(proposal);
  const [memberRole, setMemberRole] = useState<'NONE' | 'MEMBER' | 'ELDER'>('NONE');
  const [isLeaderOfTribe, setIsLeaderOfTribe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showVetoModal, setShowVetoModal] = useState(false);
  const [vetoReason, setVetoReason] = useState('');

  useEffect(() => {
    setLocalProposal(proposal);
  }, [proposal]);

  useEffect(() => {
    if (user && !readOnly) {
      // Check governance council membership
      getExplorerMembers().then(members => {
        const found = members.find(m => m.userId === user.id);
        if (found) {
          setMemberRole(found.role as 'MEMBER' | 'ELDER');
        }
      });
      // Check tribe leadership
      getMyTribe().then(tribe => {
        if (tribe && (tribe.primaryLeaderId === user.id || tribe.secondaryLeaderId === user.id)) {
          setIsLeaderOfTribe(true);
        }
      }).catch(() => setIsLeaderOfTribe(false));
    }
  }, [user, readOnly]);

  const handleVote = async (inFavor: boolean) => {
    setSubmitting(true);
    try {
      await voteProposal(localProposal.id, inFavor);
      const updated = await getExplorerProposalById(localProposal.id);
      if (updated) setLocalProposal(updated);
      toast.success(inFavor ? 'Voto registrado A Favor' : 'Voto registrado En Contra');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el voto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    try {
      await finalizeProposal(localProposal.id);
      const updated = await getExplorerProposalById(localProposal.id);
      if (updated) setLocalProposal(updated);
      toast.success('Propuesta finalizada y procesada en la blockchain');
    } catch (err: any) {
      // Si ya fue finalizada (estado desactualizado en la UI), refrescar el estado real
      const msg: string = err.message || '';
      if (msg.toLowerCase().includes('already finalized') || msg.toLowerCase().includes('ya finalizada')) {
        const updated = await getExplorerProposalById(localProposal.id).catch(() => null);
        if (updated) setLocalProposal(updated);
        toast.info('Esta propuesta ya fue finalizada anteriormente. Actualizando estado...');
      } else {
        toast.error(msg || 'Error al finalizar la propuesta');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVeto = async () => {
    if (!vetoReason.trim()) {
      toast.error('Debes ingresar una justificación para aplicar el veto');
      return;
    }
    setSubmitting(true);
    try {
      await vetoProposal(localProposal.id, vetoReason);
      const updated = await getExplorerProposalById(localProposal.id);
      if (updated) setLocalProposal(updated);
      setShowVetoModal(false);
      toast.success('Propuesta vetada de forma permanente');
    } catch (err: any) {
      toast.error(err.message || 'Error al vetar la propuesta');
    } finally {
      setSubmitting(false);
    }
  };

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
        {localProposal.type && (
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              localProposal.type === 'TRIBE_ADMISSION' ? 'text-blue-750 bg-blue-50 border border-blue-200' :
              localProposal.type === 'TRIBE_EXPULSION' ? 'text-red-750 bg-red-50 border border-red-200' :
              'text-emerald-750 bg-emerald-50 border border-emerald-200'
            }`}>
              {localProposal.type === 'TRIBE_ADMISSION' ? 'Admisión a Tribu' :
               localProposal.type === 'TRIBE_EXPULSION' ? 'Expulsión / Veto' :
               'Certificación de Pago'}
            </span>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{localProposal.title}</h2>
          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold shrink-0 ${getStatusColor(localProposal.status)}`}>
            {localProposal.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted mb-6">
          <p className="font-mono bg-gray-100 px-2 py-1 rounded text-slate-600">ID: {localProposal.id}</p>
          <p>{new Date(localProposal.createdAt).toLocaleString()}</p>
        </div>
        
        <p className="text-slate-700 leading-relaxed mb-8 bg-brand-nature-bg p-5 rounded-2xl border border-brand-primary-light">
          {localProposal.description}
        </p>
        
        {(!localProposal.type || localProposal.type === 'TRANSACTION_NOTARIZATION') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="block text-xs font-bold text-slate-500 mb-2 tracking-wider">CÓDIGO DE PRODUCTO</span>
              <span className="font-mono text-sm font-semibold text-slate-900">{localProposal.productId || 'N/A'}</span>
            </div>
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="block text-xs font-bold text-slate-500 mb-2 tracking-wider">BILLETERA COMPRADOR</span>
              <span className="font-mono text-sm font-semibold text-slate-900 break-all">{localProposal.buyerAddress || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6 font-outfit">Progreso de Votación</h3>
        <div className="max-w-md bg-gray-50 p-4 rounded-xl border border-gray-100">
          <VoteProgressBar votesFor={localProposal.votesFor} votesAgainst={localProposal.votesAgainst} />
        </div>
      </div>

      {!readOnly && (memberRole !== 'NONE' || isLeaderOfTribe) && localProposal.status === 'PENDING' && (
        <div className="border-t border-gray-100 pt-8">
          <div className="bg-brand-nature-bg/30 p-6 rounded-3xl border border-brand-primary-light flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-outfit">Panel de Control de Gobernanza</h3>
              <p className="text-xs text-slate-600">
                Identificado como:{' '}
                <span className="font-bold text-brand-primary">
                  {memberRole === 'ELDER' ? 'ELDER' : isLeaderOfTribe ? 'LÍDER DE TRIBU' : memberRole}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Votar solo si es miembro del consejo de gobernanza */}
              {memberRole !== 'NONE' && (
                <>
                  <button
                    disabled={submitting}
                    onClick={() => handleVote(true)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    A Favor
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleVote(false)}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    En Contra
                  </button>
                </>
              )}

              {/* Finalizar: disponible para Elder o Líder de Tribu */}
              {(memberRole === 'ELDER' || isLeaderOfTribe) && (
                <div className="flex gap-3 border-l border-gray-200 pl-3">
                  <button
                    disabled={submitting}
                    onClick={handleFinalize}
                    className="px-5 py-2 bg-brand-primary text-white hover:bg-brand-primary-dark rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  >
                    Finalizar y Ejecutar
                  </button>
                  {memberRole === 'ELDER' && (
                    <button
                      disabled={submitting}
                      onClick={() => setShowVetoModal(true)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                      Vetar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {localProposal.votes.length > 0 && (
        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 font-outfit">Historial de Votos</h3>
          <ul className="space-y-3">
            {localProposal.votes.map(v => (
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

      {showVetoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h4 className="text-xl font-bold text-slate-900 font-outfit">Veto de Elder</h4>
              <p className="text-sm text-muted">Ingresa la justificación oficial para cancelar esta notarización en la blockchain.</p>
            </div>

            <textarea
              value={vetoReason}
              onChange={(e) => setVetoReason(e.target.value)}
              placeholder="Ej. Falsificación de producto detectada / Error en datos..."
              className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm"
            />

            <div className="flex gap-4">
              <button
                onClick={() => setShowVetoModal(false)}
                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-slate-700 font-bold rounded-full text-sm"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={handleVeto}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-sm disabled:opacity-50"
              >
                Confirmar Veto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

