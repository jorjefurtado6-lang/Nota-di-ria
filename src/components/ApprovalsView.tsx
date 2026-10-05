import React, { useState, useEffect } from 'react';
import { Despesa, Viagem, UserRole } from '../types';
import { AuditChecklist } from './AuditChecklist';
import { formatDateTimeBR } from '../lib/dateUtils';
import { subscribeToAdminConfig, getInitialAdminConfig, AdminFullConfig } from '../lib/adminConfigStore';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Store, 
  Calendar, 
  Clock, 
  Briefcase, 
  DollarSign, 
  Eye, 
  MessageSquare,
  Sparkles,
  Lock,
  Layers,
  Scale,
  FileQuestion,
  UserX,
  Info
} from 'lucide-react';

interface ApprovalsViewProps {
  despesas: Despesa[];
  viagens: Viagem[];
  onApproveExpense: (id: string, stage?: 'first' | 'final') => Promise<void>;
  onRejectExpense: (id: string, justificativa: string) => Promise<void>;
  currentRole?: UserRole;
  currentUserId?: string;
  currentUserName?: string;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  despesas,
  viagens,
  onApproveExpense,
  onRejectExpense,
  currentRole = 'gestor',
  currentUserId,
  currentUserName,
}) => {
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [selectedProof, setSelectedProof] = useState<Despesa | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'dual_approval' | 'history'>('pending');

  // Live Admin Configuration (Alçadas, Responsabilidades & RBAC)
  const [adminConfig, setAdminConfig] = useState<AdminFullConfig>(getInitialAdminConfig);

  useEffect(() => {
    const unsub = subscribeToAdminConfig((cfg) => {
      setAdminConfig(cfg);
    });
    return () => unsub();
  }, []);

  const resp = adminConfig.responsibilities;

  // RBAC Permission: Can this user role approve?
  const canApproveRole = resp.approvalRoles.includes(currentRole);

  const pendingExpenses = despesas.filter((d) => d.status_aprovacao === 'pendente');
  const dualApprovalWaitingExpenses = pendingExpenses.filter(
    (d) => d.status_alcada === 'aguardando_segunda_aprovacao'
  );
  const simplePendingExpenses = pendingExpenses.filter(
    (d) => d.status_alcada !== 'aguardando_segunda_aprovacao'
  );
  const evaluatedExpenses = despesas.filter((d) => d.status_aprovacao !== 'pendente');

  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const handleConfirmReject = async (id: string) => {
    if (!canApproveRole) {
      setRejectError(`Seu perfil atual (${currentRole}) não possui permissão para reprovar despesas.`);
      return;
    }
    if (!justificativa.trim()) {
      setRejectError('Por favor, informe a justificativa da reprovação.');
      return;
    }
    setIsProcessing(true);
    setRejectError(null);
    try {
      await onRejectExpense(id, justificativa);
      setRejectingExpenseId(null);
      setJustificativa('');
    } catch (err: any) {
      console.error(err);
      setRejectError(err?.message || 'Erro ao reprovar despesa.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveClick = async (despesa: Despesa) => {
    setActionError(null);

    // 1. Role validation
    if (!canApproveRole) {
      setActionError({
        id: despesa.id,
        message: `Ação não permitida: Seu perfil (${currentRole}) não está na lista de papéis aprovadores configurados no painel de governança (${resp.approvalRoles.join(', ')}).`,
      });
      return;
    }

    // 2. Self-approval validation
    const isSelf = 
      (despesa.usuario_id && currentUserId && despesa.usuario_id === currentUserId) ||
      (despesa.usuario_nome && currentUserName && despesa.usuario_nome.trim().toLowerCase() === currentUserName.trim().toLowerCase());

    if (isSelf && !resp.allowSelfApproval) {
      setActionError({
        id: despesa.id,
        message: 'Regra de Compliance: A autoaprovação está bloqueada. Esta despesa pertence ao seu próprio usuário e deve ser aprovada por outro gestor ou administrador.',
      });
      return;
    }

    // 3. Receipt photo validation
    if (resp.requireReceiptPhotoForApproval && !despesa.comprovante_url) {
      setActionError({
        id: despesa.id,
        message: 'Regra de Compliance: É obrigatório haver a imagem da nota fiscal/recibo anexada para que a aprovação seja liberada.',
      });
      return;
    }

    // 4. High Value & Dual Approval workflow
    const isHighValue = (despesa.valor || 0) >= resp.highValueThresholdR$;
    const needsDualApproval = isHighValue && resp.requireDualApprovalAboveThreshold;

    if (needsDualApproval) {
      if (despesa.status_alcada === 'aguardando_segunda_aprovacao') {
        // Prevent same user from doing both 1st and 2nd approval if name matches
        if (despesa.primeira_aprovacao_por && currentUserName && despesa.primeira_aprovacao_por.trim().toLowerCase() === currentUserName.trim().toLowerCase()) {
          setActionError({
            id: despesa.id,
            message: `A 1ª aprovação já foi concedida por você (${despesa.primeira_aprovacao_por}). A 2ª aprovação de alçada deve ser efetuada por um segundo gestor/diretor distinto.`,
          });
          return;
        }
        // Proceed with 2nd / final approval
        setIsProcessing(true);
        try {
          await onApproveExpense(despesa.id, 'final');
        } catch (err: any) {
          setActionError({ id: despesa.id, message: err?.message || 'Erro ao aprovar despesa.' });
        } finally {
          setIsProcessing(false);
        }
      } else {
        // 1st approval stage
        setIsProcessing(true);
        try {
          await onApproveExpense(despesa.id, 'first');
        } catch (err: any) {
          setActionError({ id: despesa.id, message: err?.message || 'Erro ao registrar 1ª aprovação.' });
        } finally {
          setIsProcessing(false);
        }
      }
    } else {
      // Standard single approval
      setIsProcessing(true);
      try {
        await onApproveExpense(despesa.id, 'final');
      } catch (err: any) {
        setActionError({ id: despesa.id, message: err?.message || 'Erro ao aprovar despesa.' });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Painel de Aprovação & Alçadas</h2>
          </div>
          <p className="text-xs text-slate-600">
            Governança ativa com limites de valor, verificação de alçada e auditoria automatizada.
          </p>
        </div>

        {/* Dynamic Governance Pill Badges */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium text-slate-700">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Teto Simples: <strong className="font-mono text-slate-900">R$ {resp.highValueThresholdR$}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium text-slate-700">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dupla Aprovação: <strong className={resp.requireDualApprovalAboveThreshold ? 'text-emerald-700' : 'text-slate-500'}>{resp.requireDualApprovalAboveThreshold ? 'Ativa' : 'Desativada'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium text-slate-700">
            <UserX className="w-3.5 h-3.5 text-amber-600" />
            <span>Autoaprovação: <strong className={resp.allowSelfApproval ? 'text-amber-700' : 'text-slate-900'}>{resp.allowSelfApproval ? 'Permitida' : 'Bloqueada'}</strong></span>
          </div>
        </div>
      </div>

      {/* Permission Alert if role cannot approve */}
      {!canApproveRole && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Aviso de Restrição de Acesso por Política de Responsabilidades</p>
            <p className="text-amber-800">
              Seu perfil de usuário atual é <strong>{currentRole.toUpperCase()}</strong>. De acordo com as diretrizes de governança, apenas os perfis <strong>[{resp.approvalRoles.join(', ')}]</strong> possuem alçada para aprovar e reprovar despesas. Para testar aprovações, alterne seu perfil no menu superior.
            </p>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Fila Geral Pendente</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'pending' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {pendingExpenses.length}
          </span>
        </button>

        {resp.requireDualApprovalAboveThreshold && (
          <button
            onClick={() => setActiveSubTab('dual_approval')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'dual_approval'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Aguardando 2ª Aprovação</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeSubTab === 'dual_approval' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {dualApprovalWaitingExpenses.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Histórico Avaliadas</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'history' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {evaluatedExpenses.length}
          </span>
        </button>
      </div>

      {/* Main List Rendering based on Sub Tab */}
      {activeSubTab === 'pending' || activeSubTab === 'dual_approval' ? (
        <div className="space-y-4">
          {(() => {
            const listToRender = activeSubTab === 'dual_approval' ? dualApprovalWaitingExpenses : pendingExpenses;

            if (listToRender.length === 0) {
              return (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-base">Fila zerada! Nenhuma despesa pendente</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    {activeSubTab === 'dual_approval' 
                      ? 'Não há despesas aguardando a 2ª etapa de aprovação de alçada.'
                      : 'Todas as prestações de contas enviadas pelos colaboradores já foram analisadas.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {listToRender.map((despesa) => {
                  const viagem = viagens.find((v) => v.id === despesa.viagem_id);
                  const isHighValue = (despesa.valor || 0) >= resp.highValueThresholdR$;
                  const needsDualApproval = isHighValue && resp.requireDualApprovalAboveThreshold;
                  const isAwaitingSecond = despesa.status_alcada === 'aguardando_segunda_aprovacao';
                  const isSelf = 
                    (despesa.usuario_id && currentUserId && despesa.usuario_id === currentUserId) ||
                    (despesa.usuario_nome && currentUserName && despesa.usuario_nome.trim().toLowerCase() === currentUserName.trim().toLowerCase());

                  const isFirstApprover = despesa.primeira_aprovacao_por && currentUserName && despesa.primeira_aprovacao_por.trim().toLowerCase() === currentUserName.trim().toLowerCase();

                  return (
                    <div
                      key={despesa.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                    >
                      {/* Expense Header */}
                      <div className="space-y-2 border-b border-slate-100 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                Solicitante: {despesa.usuario_nome || 'Carlos Santos'}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                  Sua Despesa
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-base text-[#16324F] flex items-center gap-1.5 mt-0.5">
                              <Store className="w-4 h-4 text-slate-500" />
                              <span>{despesa.empresa}</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {viagem ? `Projeto: ${viagem.projeto} (${viagem.cliente})` : 'Despesa Avulsa'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-extrabold text-[#16324F] block font-mono">
                              R$ {despesa.valor?.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border font-medium">
                              {despesa.categoria}
                            </span>
                          </div>
                        </div>

                        {/* Governance & High Value Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {isHighValue && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Scale className="w-3 h-3 text-amber-600" />
                              <span>Alçada Especial (&gt; R$ {resp.highValueThresholdR$})</span>
                            </span>
                          )}

                          {needsDualApproval && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isAwaitingSecond
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              <Layers className="w-3 h-3" />
                              <span>{isAwaitingSecond ? 'Aguardando 2ª Aprovação' : 'Exige Dupla Aprovação'}</span>
                            </span>
                          )}

                          {isAwaitingSecond && despesa.primeira_aprovacao_por && (
                            <span className="text-[10px] text-slate-500">
                              1ª por: <strong className="text-slate-800">{despesa.primeira_aprovacao_por}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Error Banner for this specific card */}
                      {actionError && actionError.id === despesa.id && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>{actionError.message}</div>
                        </div>
                      )}

                      {/* Red Flags Alerter */}
                      {despesa.red_flags && despesa.red_flags.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            <span>Alertas de Compliance Identificados pela IA:</span>
                          </div>
                          <ul className="text-amber-800 text-[11px] list-disc list-inside space-y-0.5">
                            {despesa.red_flags.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Context Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Data & Hora:</span>
                          <span className="font-semibold text-slate-800">{formatDateTimeBR(despesa.data, despesa.hora)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Forma Pagamento:</span>
                          <span className="font-semibold text-slate-800">{despesa.pagamento}</span>
                        </div>
                      </div>

                      {/* Visual Audit Checklist */}
                      <AuditChecklist despesa={despesa} variant="compact" />

                      {/* Approval Actions */}
                      {rejectingExpenseId === despesa.id ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {rejectError && (
                            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg text-xs font-medium">
                              {rejectError}
                            </div>
                          )}
                          <label className="block text-xs font-semibold text-rose-800">
                            Motivo / Justificativa da Reprovação:
                          </label>
                          <textarea
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                            placeholder="Ex: Valor excede o teto permitido de refeição ou faltou detalhamento da nota fiscal."
                            className="w-full p-2 border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                            rows={2}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setRejectingExpenseId(null); setJustificativa(''); setRejectError(null); }}
                              className="px-3 py-1.5 border rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleConfirmReject(despesa.id)}
                              disabled={isProcessing}
                              className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 cursor-pointer"
                            >
                              {isProcessing ? 'Gravando...' : 'Confirmar Reprovação'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setSelectedProof(despesa)}
                            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs text-slate-700 flex items-center gap-1 font-medium cursor-pointer"
                            title="Visualizar comprovante original"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Foto</span>
                          </button>

                          <button
                            onClick={() => {
                              setActionError(null);
                              setRejectingExpenseId(despesa.id);
                            }}
                            disabled={!canApproveRole}
                            className={`flex-1 py-2 px-3 border font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors ${
                              canApproveRole 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer' 
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reprovar</span>
                          </button>

                          <button
                            onClick={() => handleApproveClick(despesa)}
                            disabled={isProcessing || !canApproveRole || (isSelf && !resp.allowSelfApproval) || (isAwaitingSecond && isFirstApprover)}
                            className={`flex-1 py-2 px-3 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-all ${
                              !canApproveRole || (isSelf && !resp.allowSelfApproval) || (isAwaitingSecond && isFirstApprover)
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : isAwaitingSecond
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:scale-[1.01]'
                                : needsDualApproval
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 cursor-pointer hover:scale-[1.01]'
                                : 'bg-[#35E08C] hover:bg-[#2ecc79] text-[#0E2338] cursor-pointer hover:scale-[1.01]'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isAwaitingSecond
                                ? 'Aprovação Final (2ª)'
                                : needsDualApproval
                                ? '1ª Aprovação (Alçada)'
                                : 'Aprovar com 1 Toque'}
                            </span>
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* Evaluated History Subtab */
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {evaluatedExpenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhuma despesa foi avaliada ainda.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {evaluatedExpenses.map((d) => (
                  <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{d.empresa}</span>
                        <span className="font-mono font-bold text-slate-700">R$ {d.valor?.toFixed(2).replace('.', ',')}</span>
                        <span className="text-slate-400">• {d.categoria}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Viajante: {d.usuario_nome || 'Carlos Santos'} • Data: {formatDateTimeBR(d.data, d.hora)}
                      </p>
                      {d.justificativa_rejeicao && (
                        <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                          <strong>Motivo da Reprovação:</strong> {d.justificativa_rejeicao}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {d.comprovante_url && (
                        <button
                          onClick={() => setSelectedProof(d)}
                          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Nota</span>
                        </button>
                      )}

                      <span
                        className={`font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border ${
                          d.status_aprovacao === 'aprovado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {d.status_aprovacao === 'aprovado' ? '✓ Aprovado' : '✕ Rejeitado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h4 className="font-bold text-slate-900">{selectedProof.empresa}</h4>
                <p className="text-xs text-slate-500">R$ {selectedProof.valor?.toFixed(2).replace('.', ',')} • {selectedProof.categoria}</p>
              </div>
              <button 
                onClick={() => setSelectedProof(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            {selectedProof.comprovante_url ? (
              <img 
                src={selectedProof.comprovante_url} 
                alt="Nota Fiscal" 
                className="max-h-80 mx-auto rounded-xl object-contain bg-slate-900 p-2 shadow-inner w-full" 
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Sem imagem de nota anexada.
              </div>
            )}
            <button 
              onClick={() => setSelectedProof(null)} 
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

