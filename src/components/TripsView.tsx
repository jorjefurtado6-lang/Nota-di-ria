import React, { useState } from 'react';
import { Viagem, Despesa } from '../types';
import { generateTripPDFReport } from '../lib/pdfExporter';
import { generateTripExcelReport } from '../lib/excelExporter';
import { formatPeriodBR, formatDateBR } from '../lib/dateUtils';
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  Send, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building,
  DollarSign,
  ChevronRight,
  Trash2,
  Receipt,
  BarChart3,
  LogOut,
  Camera
} from 'lucide-react';

interface TripsViewProps {
  viagens: Viagem[];
  despesas: Despesa[];
  onCreateTrip: (newTrip: Omit<Viagem, 'id' | 'usuario_id' | 'status'>) => Promise<void>;
  onDeleteTrip?: (tripId: string) => Promise<void>;
  onDeleteAllTrips?: () => Promise<void>;
  onSendTripForApproval: (tripId: string) => Promise<void>;
  onSelectTrip: (tripId: string) => void;
  onOpenCapture: () => void;
  onNavigateTab?: (tab: 'viagens' | 'despesas' | 'dashboard' | 'aprovacoes' | 'compliance' | 'admin') => void;
  onSignOut?: () => void;
}

export const TripsView: React.FC<TripsViewProps> = ({
  viagens,
  despesas,
  onCreateTrip,
  onDeleteTrip,
  onDeleteAllTrips,
  onSendTripForApproval,
  onSelectTrip,
  onOpenCapture,
  onNavigateTab,
  onSignOut
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTripConfirmId, setDeleteTripConfirmId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [cliente, setCliente] = useState('');
  const [projeto, setProjeto] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onCreateTrip({
        cliente,
        projeto,
        data_inicio: dataInicio,
        data_fim: dataFim,
      });
      setShowCreateModal(false);
      setCliente('');
      setProjeto('');
    } catch (err: any) {
      console.error('Erro ao criar viagem:', err);
      setErrorMessage(err?.message || 'Erro ao criar viagem. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Action */}
      <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            <span>Gestão de Viagens e Projetos</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Crie uma viagem para agrupar notas e enviar a prestação de contas completa para o seu gestor em segundos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viagens.length > 0 && onDeleteAllTrips && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-2.5 rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Excluir Todas</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Viagem</span>
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      {viagens.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm">
          <Briefcase className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base sm:text-lg">Nenhuma viagem cadastrada ainda</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Crie sua primeira viagem para associar cupons fiscais e gerar relatórios consolidados de reembolso, ou navegue diretamente para suas despesas e dashboards.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Minha Primeira Viagem</span>
            </button>

            <button
              onClick={onOpenCapture}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Fotografar Nota com IA</span>
            </button>

            {onNavigateTab && (
              <>
                <button
                  onClick={() => onNavigateTab('despesas')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-slate-200 flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Ver Despesas ({despesas.length})</span>
                </button>

                <button
                  onClick={() => onNavigateTab('dashboard')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-slate-200 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Ver Dashboard & Gráficos</span>
                </button>
              </>
            )}
          </div>

          {onSignOut && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
              <button
                onClick={onSignOut}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da conta e voltar à tela inicial / apresentação</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {viagens.map((viagem) => {
            const tripExpenses = despesas.filter((d) => d.viagem_id === viagem.id);
            const totalCost = tripExpenses.reduce((sum, d) => sum + d.valor, 0);

            return (
              <div
                key={viagem.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-[#16324F] shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Trip Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Projeto / Motivo
                      </span>
                      <h3 className="font-bold text-base text-[#16324F] group-hover:text-[#16324F] transition-colors">
                        {viagem.projeto}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                        viagem.status === 'aprovada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : viagem.status === 'rejeitada'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : viagem.status === 'enviada'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {viagem.status === 'aprovada'
                        ? 'Aprovada'
                        : viagem.status === 'rejeitada'
                        ? 'Rejeitada'
                        : viagem.status === 'enviada'
                        ? 'Aguardando Gestor'
                        : 'Em Andamento'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">{viagem.cliente}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatPeriodBR(viagem.data_inicio, viagem.data_fim)}</span>
                    </div>
                  </div>
                </div>

                {/* Trip Summary Info */}
                <div className="p-5 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Despesas Lançadas:</span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {tripExpenses.length} nota(s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Acumulado:</span>
                    <span className="text-base font-extrabold text-[#16324F]">
                      R$ {totalCost.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-2">
                    <button
                      onClick={() => onSelectTrip(viagem.id)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center justify-between"
                    >
                      <span>Ver Despesas Vinculadas</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <div className="flex items-center gap-2">
                      {viagem.status === 'em_andamento' && (
                        <button
                          onClick={() => onSendTripForApproval(viagem.id)}
                          className="flex-1 bg-[#16324F] hover:bg-[#0E2338] text-white font-bold text-[11px] py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5 text-[#35E08C]" />
                          <span>Enviar ao Gestor</span>
                        </button>
                      )}

                      <button
                        onClick={() => generateTripPDFReport(viagem, tripExpenses)}
                        title="Exportar PDF da Viagem"
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors text-xs flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-600" />
                        <span className="text-[10px] font-bold">PDF</span>
                      </button>

                      <button
                        onClick={() => generateTripExcelReport(viagem, tripExpenses)}
                        title="Exportar Excel XLSX"
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors text-xs flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-bold">XLSX</span>
                      </button>

                      {onDeleteTrip && (
                        <button
                          onClick={() => setDeleteTripConfirmId(viagem.id)}
                          title="Excluir Viagem"
                          className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors text-xs flex items-center cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#16324F] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#35E08C]" />
                <span>Cadastrar Nova Viagem / Projeto</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente ou Empresa Destino
                </label>
                <input
                  type="text"
                  required
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ex: Banco Itaú, Petrobras, Cliente ABC"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#16324F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Projeto / Motivo da Viagem
                </label>
                <input
                  type="text"
                  required
                  value={projeto}
                  onChange={(e) => setProjeto(e.target.value)}
                  placeholder="Ex: Auditoria de Campo Q3, Implantação ERP"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#16324F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Data Início
                    </label>
                    {dataInicio && (
                      <span className="text-[10px] font-bold text-[#16324F] bg-blue-50 px-1.5 py-0.5 rounded">
                        {formatDateBR(dataInicio)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#16324F]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Data Fim
                    </label>
                    {dataFim && (
                      <span className="text-[10px] font-bold text-[#16324F] bg-blue-50 px-1.5 py-0.5 rounded">
                        {formatDateBR(dataFim)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#16324F]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#16324F] hover:bg-[#0E2338] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Viagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Trip Confirmation Modal */}
      {deleteTripConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Viagem?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Deseja realmente remover esta viagem? As despesas vinculadas não serão apagadas, mas o agrupamento será desfeito.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTripConfirmId(null)}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteTripConfirmId;
                  setDeleteTripConfirmId(null);
                  if (onDeleteTrip && id) {
                    await onDeleteTrip(id);
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Trips Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Todas as Viagens?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Atenção: Esta ação removerá todas as viagens e projetos cadastrados. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteAllConfirm(false);
                  if (onDeleteAllTrips) {
                    await onDeleteAllTrips();
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Sim, Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
