import React, { useState, useEffect } from 'react';
import { Despesa, Viagem } from '../types';
import { AuditChecklist } from './AuditChecklist';
import { getSefazPortalInfo, NATIONAL_NFE_PORTAL, checkSefazConnectivity, SefazVerificationResult } from '../lib/sefazPortal';
import { SefazStatusAlert } from './SefazStatusAlert';
import { formatDateBR, formatDateTimeBR } from '../lib/dateUtils';
import { 
  Receipt, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Hash, 
  Calendar, 
  DollarSign, 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Sparkles,
  MapPin,
  FileText,
  FileCheck2,
  Lock,
  ListChecks,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface ExpensesViewProps {
  despesas: Despesa[];
  viagens: Viagem[];
  onOpenCapture: () => void;
  onDeleteExpense?: (id: string) => Promise<void>;
  filterTripId?: string;
  onClearTripFilter?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  despesas,
  viagens,
  onOpenCapture,
  onDeleteExpense,
  filterTripId,
  onClearTripFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCompliance, setSelectedCompliance] = useState<string>('all');
  const [selectedApproval, setSelectedApproval] = useState<string>('all');
  const [viewingExpense, setViewingExpense] = useState<Despesa | null>(null);
  const [deleteExpenseConfirmId, setDeleteExpenseConfirmId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [sefazCheckResult, setSefazCheckResult] = useState<SefazVerificationResult | null>(null);
  const [isCheckingSefaz, setIsCheckingSefaz] = useState(false);

  // Check SEFAZ status for currently viewed expense
  const handleTestSefazExpense = async (expense: Despesa) => {
    if (!expense) return;
    setIsCheckingSefaz(true);
    try {
      const result = await checkSefazConnectivity(expense.chave_nfce || expense.sefaz_url, expense.localizacao);
      setSefazCheckResult(result);
    } catch (err: any) {
      setSefazCheckResult({
        reachable: false,
        status: 'offline',
        portal: getSefazPortalInfo(expense.chave_nfce || expense.sefaz_url, expense.localizacao),
        errorMessage: err?.message || 'Falha ao testar conectividade SEFAZ.',
        userMessage: 'Servidor SEFAZ inacessível no momento.',
        troubleshootingHelp: 'Você pode consultar no Portal Nacional SPED ou prosseguir normalmente.',
        fallbackUrl: NATIONAL_NFE_PORTAL.url,
        nationalPortal: NATIONAL_NFE_PORTAL
      });
    } finally {
      setIsCheckingSefaz(false);
    }
  };

  useEffect(() => {
    if (viewingExpense && (viewingExpense.chave_nfce || viewingExpense.sefaz_url)) {
      handleTestSefazExpense(viewingExpense);
    } else {
      setSefazCheckResult(null);
    }
  }, [viewingExpense]);

  // Helper for viewing expense portal
  const viewingPortalInfo = viewingExpense ? getSefazPortalInfo(viewingExpense.chave_nfce || viewingExpense.sefaz_url, viewingExpense.localizacao) : null;
  const viewingCleanKey = viewingExpense?.chave_nfce ? viewingExpense.chave_nfce.replace(/\D/g, '') : '';

  // Audit Metrics Calculation
  const approvedExpenses = despesas.filter(d => d.status_aprovacao === 'aprovado');
  const auditedCount = approvedExpenses.filter(d => d.hash && d.hash.length >= 16 && d.compliance === 'essencial').length;
  const complianceRate = despesas.length > 0 ? Math.round((despesas.filter(d => d.compliance === 'essencial').length / despesas.length) * 100) : 100;

  // Filter logic
  const filteredExpenses = despesas.filter((d) => {
    if (filterTripId && d.viagem_id !== filterTripId) return false;

    const matchesSearch = 
      d.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.cnpj && d.cnpj.includes(searchTerm)) ||
      (d.categoria && d.categoria.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || d.categoria === selectedCategory;
    const matchesCompliance = selectedCompliance === 'all' || d.compliance === selectedCompliance;
    const matchesApproval = selectedApproval === 'all' || d.status_aprovacao === selectedApproval;

    return matchesSearch && matchesCategory && matchesCompliance && matchesApproval;
  });

  const activeTripName = filterTripId ? viagens.find(v => v.id === filterTripId)?.projeto : null;

  return (
    <div className="space-y-6">
      
      {/* Header & Stats Bar */}
      <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Despesas e Registro Probatório (WORM)</h2>
          </div>
          {activeTripName ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Filtrando Viagem: {activeTripName}
              </span>
              <button
                onClick={onClearTripFilter}
                className="text-xs text-slate-500 underline hover:text-slate-800"
              >
                Limpar filtro
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-600 mt-1">
              Histórico de notas com hash criptográfico SHA-256 e extração por IA.
            </p>
          )}
        </div>

        <button
          onClick={onOpenCapture}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Fotografar Nova Nota</span>
        </button>
      </div>

      {/* Audit & Compliance Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Itens Aprovados & Auditados</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">{auditedCount} / {approvedExpenses.length}</div>
            <p className="text-[10px] text-slate-500">Verificação WORM SHA-256 ok</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Taxa de Compliance Fiscal</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">{complianceRate}%</div>
            <p className="text-[10px] text-slate-500">Conformidade com políticas</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Checklist Automático</span>
            <div className="text-xs font-bold text-indigo-700 mt-1">Compliance & Hash WORM</div>
            <p className="text-[10px] text-slate-500">Auditoria instantânea por item</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <FileCheck2 className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por loja, CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#16324F]"
            />
          </div>

          {/* Filter Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#16324F]"
          >
            <option value="all">Todas as Categorias</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Transporte / Combustível">Transporte / Combustível</option>
            <option value="Hospedagem">Hospedagem</option>
            <option value="Pedágio / Estacionamento">Pedágio / Estacionamento</option>
            <option value="Outros">Outros</option>
          </select>

          {/* Filter Compliance */}
          <select
            value={selectedCompliance}
            onChange={(e) => setSelectedCompliance(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#16324F]"
          >
            <option value="all">Todas as Conformidades</option>
            <option value="essencial">Essencial (Sem Alerta)</option>
            <option value="condicional">Condicional (Com Alertas)</option>
            <option value="vetada">Vetada por Política</option>
          </select>

          {/* Filter Approval */}
          <select
            value={selectedApproval}
            onChange={(e) => setSelectedApproval(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#16324F]"
          >
            <option value="all">Todos os Status de Aprovação</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
          </select>

        </div>
      </div>

      {/* Expenses List Table */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Nenhuma despesa encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Fotografe uma nota ou ajuste seus filtros para visualizar o histórico probatório.
          </p>
          <button
            onClick={onOpenCapture}
            className="bg-[#16324F] text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Lançar Primeira Despesa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16324F] text-white font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Estabelecimento / CNPJ</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Checklist (Compliance & WORM)</th>
                  <th className="px-4 py-3">Aprovação</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((despesa) => (
                  <tr key={despesa.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      <div>{formatDateBR(despesa.data)}</div>
                      <div className="text-[10px] text-slate-400">{despesa.hora}</div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-[#16324F]">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{despesa.empresa}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{despesa.cnpj || 'N/A'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200">
                        {despesa.categoria}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-extrabold text-[#16324F] whitespace-nowrap">
                      R$ {despesa.valor?.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="px-4 py-3">
                      <AuditChecklist despesa={despesa} variant="inline-badge" />
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          despesa.status_aprovacao === 'aprovado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : despesa.status_aprovacao === 'rejeitado'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {despesa.status_aprovacao === 'aprovado' && <CheckCircle2 className="w-3 h-3" />}
                        {despesa.status_aprovacao === 'rejeitado' && <XCircle className="w-3 h-3" />}
                        {despesa.status_aprovacao === 'pendente' && <Clock className="w-3 h-3" />}
                        <span className="capitalize">{despesa.status_aprovacao}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingExpense(despesa)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#16324F] hover:text-white text-slate-700 transition-colors cursor-pointer"
                          title="Ver Nota Probatória WORM & Checklist Completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onDeleteExpense && (
                          <button
                            onClick={() => setDeleteExpenseConfirmId(despesa.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remover Despesa"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500 hover:text-white" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proof WORM Detail Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#16324F] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#35E08C]" />
                <h3 className="font-bold text-base">Arquivo Probatório Imutável (WORM)</h3>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Receipt Image Preview if present */}
              {viewingExpense.comprovante_url && (
                <div className="bg-slate-900 p-2 rounded-xl text-center">
                  <img
                    src={viewingExpense.comprovante_url}
                    alt="Comprovante"
                    className="max-h-52 mx-auto object-contain rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-500">Estabelecimento:</span>
                  <span className="font-semibold text-slate-900">{viewingExpense.empresa}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-500">CNPJ:</span>
                  <span className="font-mono text-slate-900">{viewingExpense.cnpj || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-500">Valor Total:</span>
                  <span className="font-extrabold text-[#16324F] text-sm">
                    R$ {viewingExpense.valor?.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-500">Categoria:</span>
                  <span>{viewingExpense.categoria}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-500">Data e Hora:</span>
                  <span>{formatDateTimeBR(viewingExpense.data, viewingExpense.hora)}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-500">Forma de Pagamento:</span>
                  <span>{viewingExpense.pagamento}</span>
                </div>
                {viewingExpense.chave_nfce && (
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-bold text-slate-500">Chave NFC-e:</span>
                    <span className="font-mono text-[10px] font-semibold">{viewingExpense.chave_nfce}</span>
                  </div>
                )}
                {viewingExpense.protocolo_sefaz && (
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-bold text-slate-500">Protocolo SEFAZ:</span>
                    <span className="font-mono text-[10px] font-bold text-emerald-700">{viewingExpense.protocolo_sefaz}</span>
                  </div>
                )}
              </div>

              {/* SEFAZ Direct Consulta Card */}
              {Boolean(viewingExpense.chave_nfce || viewingExpense.sefaz_url) && viewingPortalInfo && (
                <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 p-3.5 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-sky-950">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>Validação de Autenticidade SEFAZ</span>
                    </div>
                    <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                      AUTORIZADA
                    </span>
                  </div>

                  {/* Sefaz Status Alert & Diagnostic Probe */}
                  <SefazStatusAlert
                    result={sefazCheckResult}
                    isLoading={isCheckingSefaz}
                    onRetry={() => handleTestSefazExpense(viewingExpense)}
                    onCopyKey={() => {
                      if (viewingCleanKey) {
                        navigator.clipboard.writeText(viewingCleanKey).catch(() => {});
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2500);
                      }
                    }}
                    copiedKey={copiedKey}
                    chaveNfce={viewingCleanKey}
                  />

                  <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Portal Recomendado:</span>
                      <span className="font-bold text-sky-900">{viewingPortalInfo.name} ({viewingPortalInfo.stateName})</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-medium">Endereço Direto:</span>
                      <span className="font-mono text-sky-700 truncate max-w-[220px]">{viewingPortalInfo.url}</span>
                    </div>
                  </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                    {viewingCleanKey && (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            if (navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(viewingCleanKey).catch(() => {});
                            }
                          } catch {}
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 3000);
                        }}
                        className="px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-[11px] font-semibold text-sky-900 flex items-center gap-1 hover:bg-sky-100 transition-colors shadow-xs cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                      </button>
                    )}

                    <a
                      href={viewingPortalInfo.url || 'https://app.sefaz.es.gov.br/ConsultaNFCe'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (viewingCleanKey) {
                          try {
                            if (navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(viewingCleanKey).catch(() => {});
                            }
                          } catch {}
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 3000);
                        }
                      }}
                      className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer no-underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Abrir Portal {viewingPortalInfo.uf}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    <a
                      href={NATIONAL_NFE_PORTAL.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (viewingCleanKey) {
                          try {
                            if (navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(viewingCleanKey).catch(() => {});
                            }
                          } catch {}
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 3000);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer no-underline"
                      title="Abrir Consulta Pública no Portal Nacional da Fazenda / SPED"
                    >
                      <span>Portal Nacional</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>
                  </div>

                  {copiedKey && (
                    <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                      ✓ Chave copiada! Ao abrir o portal, cole a chave no campo de consulta pública.
                    </p>
                  )}

                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    * Dica: Se o portal da SEFAZ estadual estiver passando por manutenção periódica de servidores, utilize o botão <strong>Portal Nacional</strong> para consultar a chave com estabilidade contínua.
                  </p>
                </div>
              )}

              {/* Full Auditability & Compliance Checklist Component */}
              <AuditChecklist despesa={viewingExpense} variant="full" />

              {/* SHA-256 Hash Display */}
              <div className="bg-[#0E2338] text-slate-200 p-3 rounded-xl text-xs space-y-1 font-mono">
                <span className="text-[10px] text-[#35E08C] uppercase tracking-wider font-sans font-bold block">
                  Hash Cryptográfico SHA-256 (Registro Probatório WORM):
                </span>
                <p className="break-all text-[11px]">{viewingExpense.hash}</p>
              </div>

              {/* Justification if rejected */}
              {viewingExpense.justificativa_rejeicao && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                  <span className="font-bold block">Justificativa da Reprovação pelo Gestor:</span>
                  <p>{viewingExpense.justificativa_rejeicao}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t text-right">
              <button
                onClick={() => setViewingExpense(null)}
                className="bg-[#16324F] text-white text-xs px-4 py-2 rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {deleteExpenseConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remover Despesa?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Deseja realmente excluir este comprovante/despesa? Esta ação removerá o registro do sistema.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteExpenseConfirmId(null)}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteExpenseConfirmId;
                  setDeleteExpenseConfirmId(null);
                  if (onDeleteExpense && id) {
                    await onDeleteExpense(id);
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
