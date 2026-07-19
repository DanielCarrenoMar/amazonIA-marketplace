"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { VoteProgressBar } from '@/components/explorer/VoteProgressBar';
import { 
  getExplorerProposals, 
  getExplorerMembers, 
  createProposalProxy 
} from '@/lib/explorer-api';
import { ProposalSummary } from '@/lib/explorer-mock';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { getActiveTribes } from '@/lib/api/tribe.api';
import { findSellers } from '@/lib/api/seller.api';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  Plus,
  CheckCircle2,
  XCircle,
  ChevronRight,
  UserPlus,
  UserMinus,
  Coins,
  FileText
} from 'lucide-react';

function GovernanceContent() {
  const { user, isLoading: authLoading, isLeader } = useAuth();
  const router = useRouter();
  
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'NONE' | 'MEMBER' | 'ELDER'>('NONE');
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposalType, setProposalType] = useState<'TRIBE_ADMISSION' | 'TRIBE_EXPULSION'>('TRIBE_ADMISSION');
  const [candidateName, setCandidateName] = useState('');
  const [candidateUserId, setCandidateUserId] = useState('');
  const [targetTribeId, setTargetTribeId] = useState('');
  const [deadlineMinutes, setDeadlineMinutes] = useState('65');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic dropdown lists
  const [tribesList, setTribesList] = useState<any[]>([]);
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [loadingTribeData, setLoadingTribeData] = useState(false);

  // Fetch Tribes List
  useEffect(() => {
    if (isModalOpen) {
      getActiveTribes()
        .then((res) => {
          const list = res.data || [];
          setTribesList(list);
          if (list.length > 0) {
            setTargetTribeId(list[0].id.toString());
          }
        })
        .catch((err) => {
          console.error("Error loading tribes list", err);
          toast.error("Error al cargar la lista de tribus");
        });
    }
  }, [isModalOpen]);

  // Fetch Candidates List when Tribe or Proposal Type changes
  useEffect(() => {
    if (!isModalOpen || !targetTribeId) return;

    const loadCandidates = async () => {
      setLoadingTribeData(true);
      try {
        if (proposalType === "TRIBE_EXPULSION") {
          const res = await findSellers(new URLSearchParams({ tribeId: targetTribeId }));
          setCandidatesList(res.data || []);
        } else {
          // Candidates are any registered artisan/seller
          const res = await findSellers();
          setCandidatesList(res.data || []);
        }
      } catch (err) {
        console.error("Error loading candidate sellers", err);
      } finally {
        setLoadingTribeData(false);
      }
    };

    loadCandidates();
  }, [targetTribeId, proposalType, isModalOpen]);

  const handleSelectCandidate = (userId: string) => {
    const selected = candidatesList.find(c => c.user?.id === userId);
    if (selected) {
      setCandidateUserId(userId);
      setCandidateName(selected.user?.fullName || selected.user?.username || "Candidato");
    } else {
      setCandidateUserId("");
      setCandidateName("");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const membersData = await getExplorerMembers();

      if (user) {
        const found = membersData.find(m => m.userId === user.id);
        const hasAccess = !!found || isLeader;
        setIsAuthorized(hasAccess);
        if (hasAccess) {
          if (found) {
            setUserRole(found.role as 'MEMBER' | 'ELDER');
          } else if (isLeader) {
            setUserRole('MEMBER');
          }
          const propsData = await getExplorerProposals();
          setProposals(propsData);
        }
      } else {
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos del consejo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setIsAuthorized(false);
        router.push('/login');
        return;
      }
      loadData();
    }
  }, [user, authLoading, router]);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateUserId.trim() || !targetTribeId) {
      toast.error('Por favor, selecciona una tribu y un candidato válido.');
      return;
    }

    setSubmitting(true);
    try {
      // Generate proposal ID
      const randomPart = Math.random().toString(36).substring(2, 6);
      const proposalId = `gov-${proposalType.toLowerCase()}-${Date.now().toString().slice(-6)}-${randomPart}`;
      
      const contentHashObj = {
        userId: candidateUserId.trim(),
        name: candidateName.trim(),
        tribeId: parseInt(targetTribeId, 10),
      };

      await createProposalProxy(
        proposalId,
        JSON.stringify(contentHashObj),
        parseInt(deadlineMinutes, 10),
        proposalType
      );

      toast.success('Propuesta creada y registrada en la blockchain exitosamente');
      setIsModalOpen(false);
      
      // Reset form
      setCandidateName('');
      setCandidateUserId('');
      setDeadlineMinutes('65');
      
      // Reload
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la propuesta en blockchain');
    } finally {
      setSubmitting(false);
    }
  };

  // Filters
  const activeProposals = proposals.filter(p => p.status === 'PENDING');
  const completedProposals = proposals.filter(p => p.status !== 'PENDING');

  const getProposalTypeIcon = (type?: string) => {
    switch (type) {
      case 'TRIBE_ADMISSION':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'TRIBE_EXPULSION':
        return <UserMinus className="w-4 h-4 text-red-650" />;
      case 'TRANSACTION_NOTARIZATION':
      default:
        return <Coins className="w-4 h-4 text-emerald-650" />;
    }
  };

  const getProposalTypeName = (type?: string) => {
    switch (type) {
      case 'TRIBE_ADMISSION':
        return 'Admisión a Tribu';
      case 'TRIBE_EXPULSION':
        return 'Expulsión de Miembro';
      case 'TRANSACTION_NOTARIZATION':
      default:
        return 'Certificación de Pago';
    }
  };

  const getProposalTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'TRIBE_ADMISSION':
        return 'text-blue-750 bg-blue-50 border-blue-150';
      case 'TRIBE_EXPULSION':
        return 'text-red-750 bg-red-50 border-red-150';
      case 'TRANSACTION_NOTARIZATION':
      default:
        return 'text-emerald-750 bg-emerald-50 border-emerald-150';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Activa
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobada
          </span>
        );
      case 'VETOED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Rechazada / Vetada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (authLoading || isAuthorized === null || (isAuthorized && loading)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium text-lg font-outfit">Sincronizando gobernanza ancestral...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center py-16 px-8 max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-outfit">Acceso Restringido</h2>
          <p className="text-slate-600 mb-6 text-sm">Esta sección de toma de decisiones está reservada exclusivamente para el Cacique Anciano (Elder) y miembros autorizados del Consejo de AmazonIA.</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-full text-sm hover:bg-brand-primary/95 transition-all shadow-md cursor-pointer border-none"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'active' ? activeProposals : completedProposals;

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <DashboardHeader 
        title="Toma de Decisiones Comunitarias"
        subtitle={`Como miembro del consejo con rol ${userRole || 'MEMBER'}, tienes derecho a iniciar votaciones de membresía, votar resoluciones y certificar pagos.`}
        action={
          <Button 
            variant="primary" 
            className="rounded-xl shadow-md flex items-center gap-2 font-bold px-6 py-3 text-sm bg-brand-primary text-white hover:bg-brand-primary/90 border-none cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Crear Propuesta de Gobernanza
          </Button>
        }
      />

      {/* Tab Controls */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
            activeTab === 'active' 
              ? 'border-brand-primary text-brand-primary font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Votaciones Activas ({activeProposals.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
            activeTab === 'completed' 
              ? 'border-brand-primary text-brand-primary font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Historial de Resoluciones ({completedProposals.length})
        </button>
      </div>

      {/* Content Table / List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {currentList.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-outfit">Sin propuestas</h3>
            <p className="text-sm max-w-sm mx-auto">No hay propuestas de gobernanza en esta sección actualmente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-6">Propuesta / ID</th>
                  <th className="py-4 px-6">Tipo</th>
                  <th className="py-4 px-6">Proponente</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 w-[200px]">Aprobación</th>
                  <th className="py-4 px-6">Creación</th>
                  <th className="py-4 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentList.map(p => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/governance/${p.id}`)}
                  >
                    <td className="py-5 px-6">
                      <div className="font-semibold text-slate-900 text-[15px]">{p.title}</div>
                      <span className="font-mono text-[11px] text-slate-400 block mt-1">{p.id}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getProposalTypeBadgeColor(p.type)}`}>
                        {getProposalTypeIcon(p.type)}
                        {getProposalTypeName(p.type)}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm font-medium text-slate-700">
                      {p.proposerName}
                    </td>
                    <td className="py-5 px-6">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="w-[160px]">
                        <VoteProgressBar votesFor={p.votesFor} votesAgainst={p.votesAgainst} />
                      </div>
                    </td>
                    <td className="py-5 px-6 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => router.push(`/dashboard/governance/${p.id}`)}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-brand-primary transition-all inline-flex items-center justify-center border-none bg-transparent cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 md:p-8 rounded-3xl border border-slate-100 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold text-slate-900 font-outfit">Nueva Propuesta</h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold font-mono p-1 border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-500 text-xs">
                Inicia una votación on-chain en el Consejo. Las votaciones requieren un quórum de aprobación de miembros autorizados.
              </p>
            </div>

            <form onSubmit={handleCreateProposal} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo de Propuesta</label>
                <select 
                  value={proposalType} 
                  onChange={(e) => {
                    setProposalType(e.target.value as any);
                    setCandidateUserId('');
                    setCandidateName('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-800 text-sm font-medium"
                >
                  <option value="TRIBE_ADMISSION">Admisión de Nuevo Miembro a Tribu</option>
                  <option value="TRIBE_EXPULSION">Expulsión de Miembro de Tribu</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tribu Destino</label>
                <select 
                  value={targetTribeId} 
                  onChange={(e) => {
                    setTargetTribeId(e.target.value);
                    setCandidateUserId('');
                    setCandidateName('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-800 text-sm font-medium"
                >
                  {tribesList.length === 0 ? (
                    <option value="">Cargando tribus...</option>
                  ) : (
                    tribesList.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Candidato / Artesano</label>
                <select 
                  value={candidateUserId} 
                  onChange={(e) => handleSelectCandidate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-800 text-sm font-medium"
                  disabled={loadingTribeData}
                >
                  <option value="">Selecciona un artesano...</option>
                  {candidatesList.map((c) => (
                    <option key={c.id} value={c.user?.id}>
                      {c.user?.fullName} ({c.user?.username}) {proposalType === "TRIBE_EXPULSION" ? "— Miembro Actual" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Duración de la Votación (minutos)</label>
                <input 
                  type="number" 
                  value={deadlineMinutes} 
                  onChange={(e) => setDeadlineMinutes(e.target.value)}
                  min="5"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-800 text-sm font-medium"
                  placeholder="Por ejemplo, 65"
                  required
                />
              </div>

              <div className="flex gap-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-transparent"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary/95 transition-colors shadow-md border-none cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Registrando en Blockchain...' : 'Crear Propuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardGovernancePage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center">Cargando gobernanza...</div>}>
      <GovernanceContent />
    </Suspense>
  );
}
