import React, { useState, useMemo } from 'react';
import { Despesa, Viagem } from '../types';
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
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Filter,
  Receipt,
  Sparkles,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Layers,
  ArrowDownRight
} from 'lucide-react';

interface DashboardViewProps {
  despesas: Despesa[];
  viagens: Viagem[];
  onOpenCapture?: () => void;
  onSelectTrip?: (tripId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#4F46E5', // Indigo
  'Hospedagem': '#0EA5E9', // Sky
  'Transporte / Combustível': '#10B981', // Emerald
  'Pedágio / Estacionamento': '#F59E0B', // Amber
  'Passagens Aéreas / Terrestres': '#8B5CF6', // Violet
  'Material / Escritório': '#EC4899', // Pink
  'Outros': '#64748B' // Slate
};

const PALETTE = [
  '#4F46E5',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
  '#14B8A6',
  '#F97316'
];

function getCategoryColor(category: string, index: number): string {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  return PALETTE[index % PALETTE.length];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
};

function parseExpenseDate(d: Despesa): Date {
  if (d.data) {
    if (d.data.includes('/')) {
      const parts = d.data.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const dt = new Date(year, month, day);
        if (!isNaN(dt.getTime())) return dt;
      }
    }
    const dt = new Date(d.data);
    if (!isNaN(dt.getTime())) return dt;
  }
  if (d.createdAt) {
    const dt = new Date(d.createdAt);
    if (!isNaN(dt.getTime())) return dt;
  }
  return new Date();
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  despesas,
  viagens,
  onOpenCapture,
  onSelectTrip
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '3m' | '6m' | 'year'>('all');
  const [selectedTripId, setSelectedTripId] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [monthlyChartType, setMonthlyChartType] = useState<'bar' | 'area'>('bar');
  const [categoryChartType, setCategoryChartType] = useState<'pie' | 'bar'>('pie');

  // Filtered dataset based on user controls
  const filteredDespesas = useMemo(() => {
    let list = [...despesas];

    if (selectedTripId !== 'todas') {
      list = list.filter(d => d.viagem_id === selectedTripId);
    }

    if (selectedStatus !== 'todos') {
      list = list.filter(d => d.status_aprovacao === selectedStatus);
    }

    if (selectedPeriod !== 'all') {
      const now = new Date();
      let threshold = new Date(0);
      if (selectedPeriod === '3m') {
        threshold = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      } else if (selectedPeriod === '6m') {
        threshold = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      } else if (selectedPeriod === 'year') {
        threshold = new Date(now.getFullYear(), 0, 1);
      }

      list = list.filter(d => {
        const dt = parseExpenseDate(d);
        return dt >= threshold;
      });
    }

    return list;
  }, [despesas, selectedTripId, selectedStatus, selectedPeriod]);

  // General KPIs
  const kpis = useMemo(() => {
    const totalGasto = filteredDespesas.reduce((acc, d) => acc + (d.valor || 0), 0);
    const totalAprovado = filteredDespesas
      .filter(d => d.status_aprovacao === 'aprovado')
      .reduce((acc, d) => acc + (d.valor || 0), 0);
    const totalPendente = filteredDespesas
      .filter(d => d.status_aprovacao === 'pendente')
      .reduce((acc, d) => acc + (d.valor || 0), 0);
    const totalRejeitado = filteredDespesas
      .filter(d => d.status_aprovacao === 'rejeitado')
      .reduce((acc, d) => acc + (d.valor || 0), 0);

    const count = filteredDespesas.length;
    const ticketMedio = count > 0 ? totalGasto / count : 0;
    const taxaAprovacao = totalGasto > 0 ? (totalAprovado / totalGasto) * 100 : 0;

    return {
      totalGasto,
      totalAprovado,
      totalPendente,
      totalRejeitado,
      count,
      ticketMedio,
      taxaAprovacao
    };
  }, [filteredDespesas]);

  // Chart 1: Category Breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, {
      categoria: string;
      total: number;
      aprovado: number;
      pendente: number;
      rejeitado: number;
      quantidade: number;
    }> = {};

    filteredDespesas.forEach(d => {
      const cat = d.categoria?.trim() || 'Outros';
      if (!map[cat]) {
        map[cat] = {
          categoria: cat,
          total: 0,
          aprovado: 0,
          pendente: 0,
          rejeitado: 0,
          quantidade: 0
        };
      }
      const val = d.valor || 0;
      map[cat].total += val;
      if (d.status_aprovacao === 'aprovado') map[cat].aprovado += val;
      else if (d.status_aprovacao === 'pendente') map[cat].pendente += val;
      else if (d.status_aprovacao === 'rejeitado') map[cat].rejeitado += val;
      map[cat].quantidade += 1;
    });

    const totalAll = Object.values(map).reduce((acc, item) => acc + item.total, 0);

    return Object.values(map)
      .map(item => ({
        ...item,
        percentual: totalAll > 0 ? (item.total / totalAll) * 100 : 0,
        ticketMedio: item.quantidade > 0 ? item.total / item.quantidade : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredDespesas]);

  // Chart 2: Monthly Breakdown
  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const map: Record<string, {
      mesKey: string;
      mesLabel: string;
      totalGasto: number;
      totalAprovado: number;
      pendente: number;
      rejeitado: number;
      count: number;
    }> = {};

    // Determine min and max month
    filteredDespesas.forEach(d => {
      const dt = parseExpenseDate(d);
      const year = dt.getFullYear();
      const month = dt.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = `${monthNames[month]}/${String(year).slice(-2)}`;

      if (!map[key]) {
        map[key] = {
          mesKey: key,
          mesLabel: label,
          totalGasto: 0,
          totalAprovado: 0,
          pendente: 0,
          rejeitado: 0,
          count: 0
        };
      }

      const val = d.valor || 0;
      map[key].totalGasto += val;
      if (d.status_aprovacao === 'aprovado') map[key].totalAprovado += val;
      else if (d.status_aprovacao === 'pendente') map[key].pendente += val;
      else if (d.status_aprovacao === 'rejeitado') map[key].rejeitado += val;
      map[key].count += 1;
    });

    // If empty or few entries, seed current month and previous 2 months so chart looks great
    if (Object.keys(map).length === 0) {
      const now = new Date();
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const k = `${y}-${String(m + 1).padStart(2, '0')}`;
        map[k] = {
          mesKey: k,
          mesLabel: `${monthNames[m]}/${String(y).slice(-2)}`,
          totalGasto: 0,
          totalAprovado: 0,
          pendente: 0,
          rejeitado: 0,
          count: 0
        };
      }
    }

    return Object.values(map).sort((a, b) => a.mesKey.localeCompare(b.mesKey));
  }, [filteredDespesas]);

  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  return (
    <div id="dashboard-view-container" className="space-y-6 pb-12 font-sans">
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard de Gastos & Analytics
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualização consolidada de despesas por categoria e evolução mensal em tempo real
                </p>
              </div>
            </div>
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Trip Filter */}
            {viagens.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  aria-label="Filtrar por viagem"
                  value={selectedTripId}
                  onChange={e => setSelectedTripId(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="todas">Todas as Viagens ({viagens.length})</option>
                  {viagens.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.cliente} - {v.projeto}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Approval Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                aria-label="Filtrar por status"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="aprovado">Apenas Aprovadas</option>
                <option value="pendente">Apenas Pendentes</option>
                <option value="rejeitado">Apenas Rejeitadas</option>
              </select>
            </div>

            {/* Period Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedPeriod('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tudo
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('3m')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === '3m'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3 Meses
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('6m')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === '6m'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Meses
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('year')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'year'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ano Atual
              </button>
            </div>

            {onOpenCapture && (
              <button
                type="button"
                onClick={onOpenCapture}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Fotografar Nota</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gasto */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gastos Totais</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(kpis.totalGasto)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <Receipt className="w-3.5 h-3.5 text-indigo-500" />
            <span>{kpis.count} comprovante(s) registrado(s)</span>
          </div>
        </div>

        {/* Total Aprovado */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Aprovado p/ Reembolso</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(kpis.totalAprovado)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{kpis.taxaAprovacao.toFixed(1)}% do montante total</span>
          </div>
        </div>

        {/* Total Pendente */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Fila de Aprovação</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {formatCurrency(kpis.totalPendente)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <span>Aguardando revisão de gestores</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ticket Médio</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(kpis.ticketMedio)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            {topCategory ? (
              <span>Maior categoria: <strong>{topCategory.categoria}</strong></span>
            ) : (
              <span>Sem despesas no período</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Gastos Totais por Categoria */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-900">Gastos Totais por Categoria</h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distribuição e percentual de gastos por centro de despesa
              </p>
            </div>

            {/* Toggle View Type */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCategoryChartType('pie')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  categoryChartType === 'pie'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Rosca
              </button>
              <button
                type="button"
                onClick={() => setCategoryChartType('bar')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  categoryChartType === 'bar'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Barras
              </button>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Receipt className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Nenhuma despesa para exibir no filtro atual</p>
              <p className="text-[11px] text-slate-400 mt-1">Fotografe um recibo para ver as categorias geradas por IA</p>
            </div>
          ) : (
            <>
              {/* Recharts Container */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {categoryChartType === 'pie' ? (
                    <PieChart>
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Total Gasto']}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '0.75rem',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#FFFFFF' }}
                      />
                      <Pie
                        data={categoryData}
                        dataKey="total"
                        nameKey="categoria"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={getCategoryColor(entry.categoria, idx)} />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : (
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `R$${v}`}
                        tick={{ fontSize: 10, fill: '#64748B' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        width={90}
                        tick={{ fontSize: 10, fill: '#334155' }}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), 'Total']}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '0.75rem',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                        {categoryData.map((entry, idx) => (
                          <Cell key={`bar-${idx}`} fill={getCategoryColor(entry.categoria, idx)} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Categorized Progress List */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {categoryData.map((cat, idx) => {
                  const color = getCategoryColor(cat.categoria, idx);
                  return (
                    <div key={cat.categoria} className="text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-semibold text-slate-800">{cat.categoria}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({cat.quantidade} notas)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900">{formatCurrency(cat.total)}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                            {cat.percentual.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(2, cat.percentual))}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* CHART 2: Gastos Totais por Mês */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-900">Gastos Totais por Mês</h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evolução cronológica e comparativo entre montante total e aprovado
              </p>
            </div>

            {/* Toggle Chart Type */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMonthlyChartType('bar')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  monthlyChartType === 'bar'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Colunas
              </button>
              <button
                type="button"
                onClick={() => setMonthlyChartType('area')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  monthlyChartType === 'area'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Área
              </button>
            </div>
          </div>

          {/* Recharts Monthly Container */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {monthlyChartType === 'bar' ? (
                <BarChart data={monthlyData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="mesLabel"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$${v}`}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any, name: string) => [
                      formatCurrency(Number(val)),
                      name === 'totalGasto' ? 'Total Gasto' : name === 'totalAprovado' ? 'Aprovado' : 'Pendente'
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => (
                      <span className="text-[11px] text-slate-600 font-medium">
                        {val === 'totalGasto' ? 'Total Lançado' : val === 'totalAprovado' ? 'Reembolso Aprovado' : 'Pendente'}
                      </span>
                    )}
                  />
                  <Bar dataKey="totalGasto" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="totalAprovado" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              ) : (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientAprovado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="mesLabel"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$${v}`}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any, name: string) => [
                      formatCurrency(Number(val)),
                      name === 'totalGasto' ? 'Total Gasto' : 'Aprovado'
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => (
                      <span className="text-[11px] text-slate-600 font-medium">
                        {val === 'totalGasto' ? 'Total Lançado' : 'Aprovado'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalGasto"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradientTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalAprovado"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradientAprovado)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Monthly Table / Summary list */}
          <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="pb-1.5 font-semibold">Mês</th>
                  <th className="pb-1.5 font-semibold text-right">Total Lançado</th>
                  <th className="pb-1.5 font-semibold text-right">Aprovado</th>
                  <th className="pb-1.5 font-semibold text-right">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {monthlyData.map(m => (
                  <tr key={m.mesKey} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 font-bold text-slate-900">{m.mesLabel}</td>
                    <td className="py-2 text-right font-mono font-bold text-indigo-700">
                      {formatCurrency(m.totalGasto)}
                    </td>
                    <td className="py-2 text-right font-mono text-emerald-600">
                      {formatCurrency(m.totalAprovado)}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-500">
                      {m.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trips / Projects Correlation Section */}
      {viagens.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Distribuição por Viagem & Projeto
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Acompanhamento de custos alocados a cada cliente e missão corporativa
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {viagens.map(v => {
              const tripExpenses = despesas.filter(d => d.viagem_id === v.id);
              const tripTotal = tripExpenses.reduce((acc, d) => acc + (d.valor || 0), 0);
              const tripApproved = tripExpenses
                .filter(d => d.status_aprovacao === 'aprovado')
                .reduce((acc, d) => acc + (d.valor || 0), 0);

              return (
                <div
                  key={v.id}
                  onClick={() => onSelectTrip && onSelectTrip(v.id)}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {v.cliente}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {v.projeto}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 shrink-0">
                      {tripExpenses.length} notas
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Total Gasto:</span>
                    <span className="font-black text-slate-900 font-mono">
                      {formatCurrency(tripTotal)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-600 font-medium">
                    <span>Aprovado:</span>
                    <span className="font-mono">{formatCurrency(tripApproved)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
