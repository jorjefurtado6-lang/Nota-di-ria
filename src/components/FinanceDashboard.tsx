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
  CartesianGrid,
  ComposedChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  Download,
  Filter,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface FinanceDashboardProps {
  despesas: Despesa[];
  viagens: Viagem[];
  onSelectTripFilter?: (tripId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#16324F',
  'Hospedagem': '#06B6D4',
  'Transporte / Combustível': '#35E08C',
  'Pedágio / Estacionamento': '#F59E0B',
  'Outros': '#8B5CF6'
};

const DEFAULT_COLOR = '#16324F';

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  despesas,
  viagens,
  onSelectTripFilter
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '6m' | '3m'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // Filter expenses based on selection
  const filteredExpenses = useMemo(() => {
    let result = [...despesas];

    if (selectedCategory !== 'todas') {
      result = result.filter(d => d.categoria === selectedCategory);
    }

    if (selectedPeriod === '3m') {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      result = result.filter(d => {
        const dDate = new Date(d.data || d.createdAt || Date.now());
        return dDate >= threeMonthsAgo;
      });
    } else if (selectedPeriod === '6m') {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      result = result.filter(d => {
        const dDate = new Date(d.data || d.createdAt || Date.now());
        return dDate >= sixMonthsAgo;
      });
    }

    return result;
  }, [despesas, selectedCategory, selectedPeriod]);

  // Key KPI Aggregations
  const totalVolume = useMemo(() => {
    return filteredExpenses.reduce((acc, d) => acc + (d.valor || 0), 0);
  }, [filteredExpenses]);

  const approvedVolume = useMemo(() => {
    return filteredExpenses
      .filter(d => d.status_aprovacao === 'aprovado')
      .reduce((acc, d) => acc + (d.valor || 0), 0);
  }, [filteredExpenses]);

  const pendingVolume = useMemo(() => {
    return filteredExpenses
      .filter(d => d.status_aprovacao === 'pendente')
      .reduce((acc, d) => acc + (d.valor || 0), 0);
  }, [filteredExpenses]);

  const averageTicket = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return totalVolume / filteredExpenses.length;
  }, [totalVolume, filteredExpenses]);

  // Chart 1: Category Data Aggregation
  const categoryData = useMemo(() => {
    const map: Record<string, { categoria: string; total: number; aprovado: number; quantidade: number }> = {};
    
    filteredExpenses.forEach(d => {
      const cat = d.categoria || 'Outros';
      if (!map[cat]) {
        map[cat] = { categoria: cat, total: 0, aprovado: 0, quantidade: 0 };
      }
      map[cat].total += d.valor || 0;
      if (d.status_aprovacao === 'aprovado') {
        map[cat].aprovado += d.valor || 0;
      }
      map[cat].quantidade += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  // Chart 2: Monthly Reimbursement Aggregation (Total Lançado vs Total Reembolsado/Aprovado)
  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const map: Record<string, { mesKey: string; mesLabel: string; totalGasto: number; totalReembolsado: number; pendente: number; count: number }> = {};

    // Generate base current calendar year trailing months
    const currentYear = new Date().getFullYear();
    const monthsList = [3, 4, 5, 6, 7]; // May, Jun, Jul, Aug...
    monthsList.forEach(mIdx => {
      const key = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
      const label = `${monthNames[mIdx]}/${String(currentYear).substring(2)}`;
      map[key] = {
        mesKey: key,
        mesLabel: label,
        totalGasto: 0,
        totalReembolsado: 0,
        pendente: 0,
        count: 0
      };
    });

    filteredExpenses.forEach(d => {
      let dDate = new Date(d.data);
      if (isNaN(dDate.getTime())) {
        dDate = new Date(d.createdAt || Date.now());
      }
      
      const year = dDate.getFullYear();
      const monthIdx = dDate.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${monthNames[monthIdx]}/${String(year).substring(2)}`;

      if (!map[key]) {
        map[key] = {
          mesKey: key,
          mesLabel: label,
          totalGasto: 0,
          totalReembolsado: 0,
          pendente: 0,
          count: 0
        };
      }

      const val = d.valor || 0;
      map[key].totalGasto += val;
      if (d.status_aprovacao === 'aprovado') {
        map[key].totalReembolsado += val;
      } else if (d.status_aprovacao === 'pendente') {
        map[key].pendente += val;
      }
      map[key].count += 1;
    });

    return Object.values(map).sort((a, b) => a.mesKey.localeCompare(b.mesKey));
  }, [filteredExpenses]);

  // Approval Status Breakdown for Donut
  const approvalStatusData = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    filteredExpenses.forEach(d => {
      if (d.status_aprovacao === 'aprovado') approved += d.valor || 0;
      else if (d.status_aprovacao === 'rejeitado') rejected += d.valor || 0;
      else pending += d.valor || 0;
    });

    return [
      { name: 'Reembolsado / Aprovado', value: approved, color: '#35E08C' },
      { name: 'Aguardando Aprovação', value: pending, color: '#F59E0B' },
      { name: 'Reprovado / Glosado', value: rejected, color: '#EF4444' }
    ].filter(item => item.value > 0 || despesas.length === 0);
  }, [filteredExpenses, despesas]);

  return (
    <div className="space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Dashboard Financeiro & Reembolsos</h2>
              <p className="text-xs text-slate-500">
                Análise em tempo real de despesas corporativas, reconciliação mensal e controle de caixa.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedPeriod === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedPeriod('6m')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedPeriod === '6m' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setSelectedPeriod('3m')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedPeriod === '3m' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3 Meses
            </button>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 shadow-xs"
          >
            <option value="todas">Todas as Categorias</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Hospedagem">Hospedagem</option>
            <option value="Transporte / Combustível">Transporte / Combustível</option>
            <option value="Pedágio / Estacionamento">Pedágio / Estacionamento</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
      </div>

      {/* Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Lançado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
              Volume Solicitado
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{filteredExpenses.length} nota(s) fiscal(is)</span>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
              {viagens.length} viagens
            </span>
          </div>
        </div>

        {/* Card 2: Total Reembolsado/Aprovado */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-2 relative overflow-hidden bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 font-mono">
              Reembolso Aprovado
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            R$ {approvedVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="text-emerald-700 font-semibold">Liberado para crédito</span>
            <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
              {totalVolume > 0 ? `${((approvedVolume / totalVolume) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Pendente de Aprovação */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-2 relative overflow-hidden bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 font-mono">
              Aguardando Aprovação
            </span>
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-200 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            R$ {pendingVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="text-amber-800 font-semibold">Em análise pelo Gestor</span>
            <span className="font-mono text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">
              {filteredExpenses.filter(d => d.status_aprovacao === 'pendente').length} item(ns)
            </span>
          </div>
        </div>

        {/* Card 4: Ticket Médio por Comprovante */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
              Ticket Médio / Nota
            </span>
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Média ponderada</span>
            <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded text-[10px]">
              OCR Validado
            </span>
          </div>
        </div>

      </div>

      {/* Recharts Analytics Section 1: Monthly Total Reimbursements vs Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart: Total de Reembolso Mensal (AreaChart / Composed) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Evolução dos Reembolsos Mensais</h3>
                <p className="text-[11px] text-slate-500">Comparativo entre volume total solicitado e reembolsos efetivamente aprovados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Solicitado
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Reembolsado
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16324F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16324F" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReembolsado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#35E08C" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#35E08C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="mesLabel" 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1">
                          <p className="font-extrabold text-indigo-300 border-b border-slate-800 pb-1">{label}</p>
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <span className="text-slate-300">Total Solicitado:</span>
                            <span className="font-mono font-bold text-indigo-300">
                              R$ {data.totalGasto.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-300">Reembolso Aprovado:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              R$ {data.totalReembolsado.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">Pendente:</span>
                            <span className="font-mono font-bold text-amber-400">
                              R$ {data.pendente.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 pt-1 font-mono">
                            {data.count} nota(s) processada(s)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalGasto" 
                  stroke="#16324F" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorGasto)" 
                  name="Total Solicitado"
                />
                <Area 
                  type="monotone" 
                  dataKey="totalReembolsado" 
                  stroke="#35E08C" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorReembolsado)" 
                  name="Total Reembolsado"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Approval Proportions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Taxa de Aprovação</h3>
                <p className="text-[11px] text-slate-500">Distribuição por status do fluxo financeiro</p>
              </div>
            </div>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={approvalStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {approvalStatusData.map((entry, index) => (
                    <Cell key={`status-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg border border-slate-800 text-xs">
                          <p className="font-bold" style={{ color: data.color }}>{data.name}</p>
                          <p className="text-white font-extrabold text-sm mt-0.5 font-mono">
                            R$ {data.value.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {totalVolume > 0 ? `${((data.value / totalVolume) * 100).toFixed(1)}% do total` : '0%'}
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

          {/* Legend Items */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {approvalStatusData.map((st, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                  <span className="text-slate-700 font-medium">{st.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  R$ {st.value.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recharts Analytics Section 2: Spend by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BarChart: Gastos por Categoria */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Gastos por Categoria</h3>
                <p className="text-[11px] text-slate-500">Distribuição total de despesas por rubrica corporativa</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              {categoryData.length} categorias
            </span>
          </div>

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
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs font-sans">
                          <p className="font-bold text-indigo-300">{data.categoria}</p>
                          <p className="text-emerald-400 font-extrabold text-sm mt-1 font-mono">
                            R$ {data.total.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Reembolsado: R$ {data.aprovado.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {data.quantidade} nota(s) registrada(s)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cat-cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.categoria] || DEFAULT_COLOR} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Category Progress Bars & Limits */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Detalhamento Financeiro por Rubrica</h3>
                <p className="text-[11px] text-slate-500">Participação relativa e volume acumulado</p>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 my-auto">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Nenhuma categoria registrada.</p>
            ) : (
              categoryData.map((cat) => {
                const percentage = totalVolume > 0 ? (cat.total / totalVolume) * 100 : 0;
                const catColor = CATEGORY_COLORS[cat.categoria] || DEFAULT_COLOR;

                return (
                  <div key={cat.categoria} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                        <span className="font-bold text-slate-800">{cat.categoria}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({cat.quantidade} notas)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 font-mono">
                          R$ {cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold ml-2">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: catColor }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Conformidade com os tetos corporativos validada via Inteligência NotaDiária</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
