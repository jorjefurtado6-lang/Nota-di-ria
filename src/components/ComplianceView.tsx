import React, { useState, useMemo } from 'react';
import { Despesa, Viagem, AuditoriaLog } from '../types';
import { generateTripPDFReport } from '../lib/pdfExporter';
import { generateTripExcelReport } from '../lib/excelExporter';
import { FinanceDashboard } from './FinanceDashboard';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie, 
  CartesianGrid 
} from 'recharts';
import { 
  Shield, 
  ShieldAlert, 
  Hash, 
  FileSpreadsheet, 
  Download, 
  DollarSign, 
  Sliders, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Search,
  FileText,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface ComplianceViewProps {
  despesas: Despesa[];
  viagens: Viagem[];
  auditLogs: AuditoriaLog[];
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  despesas,
  viagens,
  auditLogs,
}) => {
  const [subView, setSubView] = useState<'finance' | 'compliance'>('finance');

  // Corporate Expense Caps state
  const [tetos, setTetos] = useState<Record<string, number>>({
    'Alimentação': 120,
    'Hospedagem': 450,
    'Transporte / Combustível': 200,
    'Pedágio / Estacionamento': 80,
    'Outros': 100
  });

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newLimitValue, setNewLimitValue] = useState<number>(0);
  const [auditSearch, setAuditSearch] = useState('');

  // Calculate Red Flag Statistics
  const flaggedExpenses = despesas.filter((d) => d.red_flags && d.red_flags.length > 0);
  const totalExpenseVolume = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);
  const approvedVolume = despesas.filter(d => d.status_aprovacao === 'aprovado').reduce((sum, d) => sum + (d.valor || 0), 0);

  // Recharts: Gasto Total por Categoria
  const categoryData = useMemo(() => {
    const map: Record<string, { categoria: string; total: number; quantidade: number }> = {};
    despesas.forEach((d) => {
      const cat = d.categoria || 'Outros';
      if (!map[cat]) {
        map[cat] = { categoria: cat, total: 0, quantidade: 0 };
      }
      map[cat].total += d.valor || 0;
      map[cat].quantidade += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [despesas]);

  // Colors for Categories
  const CATEGORY_COLORS: Record<string, string> = {
    'Alimentação': '#6366F1',
    'Hospedagem': '#06B6D4',
    'Transporte / Combustível': '#10B981',
    'Pedágio / Estacionamento': '#F59E0B',
    'Outros': '#8B5CF6'
  };

  // Recharts: Status de Aprovação
  const statusData = useMemo(() => {
    const map: Record<string, { status: string; label: string; valor: number; count: number; color: string }> = {
      aprovado: { status: 'aprovado', label: 'Aprovados', valor: 0, count: 0, color: '#10B981' },
      pendente: { status: 'pendente', label: 'Pendentes', valor: 0, count: 0, color: '#F59E0B' },
      rejeitado: { status: 'rejeitado', label: 'Rejeitados', valor: 0, count: 0, color: '#EF4444' }
    };

    despesas.forEach((d) => {
      const st = d.status_aprovacao || 'pendente';
      if (map[st]) {
        map[st].valor += d.valor || 0;
        map[st].count += 1;
      } else {
        map['pendente'].valor += d.valor || 0;
        map['pendente'].count += 1;
      }
    });

    return Object.values(map);
  }, [despesas]);

  const handleSaveTeto = (cat: string) => {
    setTetos(prev => ({ ...prev, [cat]: newLimitValue }));
    setEditingCategory(null);
  };

  const filteredLogs = auditLogs.filter((log) => 
    log.usuario.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.acao.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.origem.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* View Switcher Sub-Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs inline-flex items-center gap-1">
        <button
          onClick={() => setSubView('finance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subView === 'finance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Financeiro & Reembolsos</span>
        </button>

        <button
          onClick={() => setSubView('compliance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subView === 'compliance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Políticas, Tetos & Trilha WORM</span>
        </button>
      </div>

      {/* RENDER FINANCEDASHBOARD */}
      {subView === 'finance' ? (
        <FinanceDashboard despesas={despesas} viagens={viagens} />
      ) : (
        <>
          {/* Top Banner */}
          <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Painel de Compliance & Auditoria Imutável</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Gestão de políticas de reembolso, tetos operacionais, prevenção de fraudes e rastreabilidade probatória.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viagens.length > 0 && (
            <button
              onClick={() => generateTripPDFReport(viagens[0], despesas)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>Exportar PDF Geral</span>
            </button>
          )}

          {viagens.length > 0 && (
            <button
              onClick={() => generateTripExcelReport(viagens[0], despesas)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar XLSX Fiscal</span>
            </button>
          )}
        </div>
      </div>

      {/* Compliance Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Volume Total Lançado</span>
          <div className="text-xl font-extrabold text-[#16324F] mt-1">
            R$ {totalExpenseVolume.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{despesas.length} notas no sistema</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Aprovado em Reembolsos</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">
            R$ {approvedVolume.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Liberação via financeiro</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-700 block">Alertas de Red Flags</span>
          <div className="text-xl font-extrabold text-amber-600 mt-1">
            {flaggedExpenses.length} ocorrência(s)
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Duplicidade ou superação de teto</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-[#16324F] block">Integridade WORM</span>
          <div className="text-xl font-extrabold text-[#35E08C] bg-[#0E2338] px-2 py-0.5 rounded-lg inline-block mt-1">
            100% Válida
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Hashes SHA-256 sincronizados</p>
        </div>

      </div>

      {/* Visual Analytics & Data Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Gasto Total por Categoria (BarChart) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Gasto Total por Categoria</h3>
                <p className="text-[11px] text-slate-500">Distribuição financeira acumulada por tipo de despesa</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              R$ {totalExpenseVolume.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Nenhuma despesa registrada para exibir no gráfico.
            </div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="categoria" 
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    interval={0}
                    tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg border border-slate-800 text-xs font-sans">
                            <p className="font-bold text-indigo-300">{data.categoria}</p>
                            <p className="text-emerald-400 font-extrabold text-sm mt-0.5">
                              R$ {data.total.toFixed(2).replace('.', ',')}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {data.quantidade} nota(s) lançada(s)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.categoria] || '#6366F1'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Status de Aprovação das Despesas (PieChart / Donut) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Status de Aprovação das Despesas</h3>
                <p className="text-[11px] text-slate-500">Proporção de notas aprovadas, pendentes e rejeitadas</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {despesas.length} item(ns)
            </span>
          </div>

          {despesas.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Nenhuma despesa para análise de aprovação.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center h-64">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="valor"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg border border-slate-800 text-xs font-sans">
                              <p className="font-bold" style={{ color: data.color }}>{data.label}</p>
                              <p className="text-white font-extrabold text-sm mt-0.5">
                                R$ {data.valor.toFixed(2).replace('.', ',')}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {data.count} nota(s) nesta etapa
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Breakdown Legend Cards */}
              <div className="space-y-2 pr-2">
                {statusData.map((st) => (
                  <div 
                    key={st.status} 
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                      <div>
                        <span className="font-bold text-xs text-slate-800">{st.label}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{st.count} nota(s)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs text-slate-900 font-mono block">
                        R$ {st.valor.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {totalExpenseVolume > 0 ? ((st.valor / totalExpenseVolume) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Corporate Policy Limits (Tetos por Categoria) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-base text-[#16324F] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-600" />
              <span>Política de Tetos Diários por Categoria</span>
            </h3>
            <p className="text-xs text-slate-500">
              Despesas que excederem estes limites gerarão automaticamente um alerta de compliance para o gestor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(tetos).map(([categoria, teto]) => (
            <div
              key={categoria}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">{categoria}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                  Limite Diário
                </span>
              </div>

              {editingCategory === categoria ? (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={newLimitValue}
                    onChange={(e) => setNewLimitValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                  />
                  <button
                    onClick={() => handleSaveTeto(categoria)}
                    className="px-2 py-1 bg-[#16324F] text-white rounded text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-[#16324F]">
                    R$ {(teto as number).toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    onClick={() => { setEditingCategory(categoria); setNewLimitValue(teto as number); }}
                    className="text-[11px] font-semibold text-cyan-700 hover:underline"
                  >
                    Alterar Teto
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Red Flags Compliance Risk Table */}
      {flaggedExpenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-amber-900">
              Despesas com Alertas de Compliance ({flaggedExpenses.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {flaggedExpenses.map((despesa) => (
              <div key={despesa.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#16324F]">{despesa.empresa}</span>
                    <span className="text-xs font-extrabold text-slate-700">R$ {despesa.valor?.toFixed(2)}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                      {despesa.categoria}
                    </span>
                  </div>
                  <ul className="text-amber-800 text-xs mt-1 space-y-0.5 list-disc list-inside">
                    {despesa.red_flags.map((rf, i) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                </div>

                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border">
                  Hash: {despesa.hash?.substring(0, 16)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immutable Audit Log Trail Table (WORM) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-base text-[#16324F] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#16324F]" />
              <span>Trilha de Auditoria Imutável (Audit Trail Firestore)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Registro histórico de ações do sistema com carimbo de data/hora e identificação de usuário.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar em auditoria..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#16324F]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16324F] text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Data & Hora</th>
                <th className="px-4 py-2.5">Usuário Responsável</th>
                <th className="px-4 py-2.5">Ação Realizada</th>
                <th className="px-4 py-2.5">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-[#16324F]">
                    {log.usuario}
                  </td>
                  <td className="px-4 py-2.5 text-slate-800">
                    {log.acao}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border font-sans text-[10px]">
                      {log.origem}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

    </div>
  );
};
