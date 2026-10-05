import React, { useState, useEffect } from 'react';
import { formatDateTimeBR } from '../lib/dateUtils';
import {
  ShieldAlert,
  CreditCard,
  BarChart3,
  Sliders,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  FileText,
  Zap,
  ArrowUpRight,
  Check,
  X,
  Edit3,
  HelpCircle,
  Eye,
  Percent,
  Clock,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Shield
} from 'lucide-react';
import {
  AdminFullConfig,
  PlanConfig,
  SimulatorConfig,
  AdminAnalyticsData,
  ResponsibilitiesConfig,
  getInitialAdminConfig,
  saveAdminConfigToDb,
  subscribeToAdminConfig,
  DEFAULT_PLANS_CONFIG,
  DEFAULT_SIMULATOR_CONFIG,
  DEFAULT_RESPONSIBILITIES_CONFIG
} from '../lib/adminConfigStore';

interface AdminPanelProps {
  onClose?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'responsibilities' | 'simulator' | 'analytics' | 'email'>('plans');
  const [config, setConfig] = useState<AdminFullConfig>(getInitialAdminConfig);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editable state clones
  const [plans, setPlans] = useState<PlanConfig[]>(config.plans);
  const [simulator, setSimulator] = useState<SimulatorConfig>(config.simulator);
  const [responsibilities, setResponsibilities] = useState<ResponsibilitiesConfig>(config.responsibilities || DEFAULT_RESPONSIBILITIES_CONFIG);
  const [analytics] = useState<AdminAnalyticsData>(config.analytics);
  const [isDirty, setIsDirty] = useState(false);

  // Email Hostinger SMTP State
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>('contato@notadiaria.digital');
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/email/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSmtpStatus(data);
        }
      })
      .catch(err => console.warn('Não foi possível carregar status SMTP:', err));
  }, []);

  const handleVerifySmtp = async () => {
    setEmailLoading(true);
    setEmailFeedback(null);
    try {
      const res = await fetch('/api/email/verify', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEmailFeedback({ type: 'success', message: data.message });
      } else {
        setEmailFeedback({ type: 'error', message: data.error || 'Falha na autenticação SMTP.' });
      }
    } catch (err: any) {
      setEmailFeedback({ type: 'error', message: err.message || 'Erro ao conectar ao servidor SMTP.' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) return;
    setEmailLoading(true);
    setEmailFeedback(null);
    try {
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailRecipient })
      });
      const data = await res.json();
      if (data.success) {
        setEmailFeedback({ type: 'success', message: data.message });
      } else {
        setEmailFeedback({ type: 'error', message: data.error || 'Falha ao enviar e-mail de teste.' });
      }
    } catch (err: any) {
      setEmailFeedback({ type: 'error', message: err.message || 'Erro de comunicação ao enviar e-mail.' });
    } finally {
      setEmailLoading(false);
    }
  };

  // Stripe Gateway Status
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [verifyingStripeAdmin, setVerifyingStripeAdmin] = useState(false);

  const fetchStripeStatus = async () => {
    setVerifyingStripeAdmin(true);
    try {
      const res = await fetch('/api/payment/stripe/verify');
      const data = await res.json();
      setStripeStatus(data);
    } catch (e) {
      console.warn('Erro ao verificar Stripe:', e);
    } finally {
      setVerifyingStripeAdmin(false);
    }
  };

  useEffect(() => {
    fetchStripeStatus();
  }, []);

  // New plan feature text state per plan index
  const [newFeatureInputs, setNewFeatureInputs] = useState<Record<number, string>>({});

  // Simulator test slider state for live preview
  const [testUsers, setTestUsers] = useState<number>(18);
  const [testReceiptsPerUser, setTestReceiptsPerUser] = useState<number>(12);
  const [testBillingPeriod, setTestBillingPeriod] = useState<'mensal' | 'anual'>('anual');

  // Sync state when config updates
  useEffect(() => {
    const unsub = subscribeToAdminConfig((updatedConfig) => {
      setConfig(updatedConfig);
      setPlans(updatedConfig.plans);
      setSimulator(updatedConfig.simulator);
      if (updatedConfig.responsibilities) {
        setResponsibilities(updatedConfig.responsibilities);
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save changes to Firestore & localStorage
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updatedFullConfig: AdminFullConfig = {
        plans,
        simulator,
        analytics,
        responsibilities
      };
      await saveAdminConfigToDb(updatedFullConfig);
      setIsDirty(false);
      showToast('Configurações salvas e publicadas no site em tempo real!');
    } catch (err) {
      console.error('Erro ao salvar no Admin:', err);
      showToast('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (isDirty) {
      // Auto-save changes on closing so the administrator's newly added plans are never lost!
      try {
        const updatedFullConfig: AdminFullConfig = {
          plans,
          simulator,
          analytics,
          responsibilities
        };
        await saveAdminConfigToDb(updatedFullConfig);
        setIsDirty(false);
      } catch (err) {
        console.warn('Erro ao auto-salvar ao fechar:', err);
      }
    }
    if (onClose) {
      onClose();
    }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetDefaults = async () => {
    setPlans(DEFAULT_PLANS_CONFIG);
    setSimulator(DEFAULT_SIMULATOR_CONFIG);
    setResponsibilities(DEFAULT_RESPONSIBILITIES_CONFIG);
    const resetConfig: AdminFullConfig = {
      plans: DEFAULT_PLANS_CONFIG,
      simulator: DEFAULT_SIMULATOR_CONFIG,
      analytics,
      responsibilities: DEFAULT_RESPONSIBILITIES_CONFIG
    };
    await saveAdminConfigToDb(resetConfig);
    setIsDirty(false);
    setShowResetConfirm(false);
    showToast('Valores padrões restaurados com sucesso.');
  };

  // Plan editing handlers
  const handleUpdatePlan = (index: number, field: keyof PlanConfig, value: any) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: value };
    setPlans(updated);
    setIsDirty(true);
  };

  const handleAddFeature = (planIndex: number) => {
    const text = newFeatureInputs[planIndex]?.trim();
    if (!text) return;
    const updated = [...plans];
    updated[planIndex].features = [...updated[planIndex].features, text];
    setPlans(updated);
    setIsDirty(true);
    setNewFeatureInputs(prev => ({ ...prev, [planIndex]: '' }));
  };

  const handleRemoveFeature = (planIndex: number, featureIndex: number) => {
    const updated = [...plans];
    updated[planIndex].features = updated[planIndex].features.filter((_, idx) => idx !== featureIndex);
    setPlans(updated);
    setIsDirty(true);
  };

  const handleAddNewPlan = () => {
    const newPlan: PlanConfig = {
      id: `plano_${Date.now()}`,
      nome: 'Novo Plano Custom',
      badge: 'Plano Personalizado',
      basePrice: 499,
      includedUsers: 30,
      extraUserCost: 14,
      documentsQuota: '1200 notas/mês',
      annualDiscountPct: 15,
      active: true,
      features: [
        'Usuários inclusos customizáveis',
        'Leitura avançada com IA Gemini',
        'Relatórios financeiros e exportação PDF/Excel'
      ]
    };
    setPlans([...plans, newPlan]);
    setIsDirty(true);
  };

  const handleDeletePlan = (index: number) => {
    if (index < 0 || index >= plans.length) return;
    const planToRemove = plans[index];
    const planName = planToRemove?.nome || 'Plano';
    const updated = plans.filter((_, idx) => idx !== index);
    setPlans(updated);
    setIsDirty(true);
    showToast(`Plano "${planName}" removido com sucesso.`);
  };

  // Responsibilities Matrix helper
  const handleToggleApprovalRole = (role: 'gestor' | 'financeiro' | 'admin' | 'auditor') => {
    const current = responsibilities.approvalRoles || [];
    const exists = current.includes(role);
    const updated = exists ? current.filter(r => r !== role) : [...current, role];
    setResponsibilities(prev => ({ ...prev, approvalRoles: updated }));
  };

  const handleToggleCreationRole = (role: 'funcionario' | 'gestor' | 'financeiro' | 'admin') => {
    const current = responsibilities.creationRoles || [];
    const exists = current.includes(role);
    const updated = exists ? current.filter(r => r !== role) : [...current, role];
    setResponsibilities(prev => ({ ...prev, creationRoles: updated }));
  };

  const handleToggleAuditExportRole = (role: 'funcionario' | 'gestor' | 'financeiro' | 'admin') => {
    const current = responsibilities.auditExportRoles || [];
    const exists = current.includes(role);
    const updated = exists ? current.filter(r => r !== role) : [...current, role];
    setResponsibilities(prev => ({ ...prev, auditExportRoles: updated }));
  };

  // Live calculation for the Simulator Test Box in Admin Panel
  const calculateTestResult = () => {
    let planName = 'Essencial';
    let basePrice = simulator.essentialBasePrice;
    let included = simulator.essentialIncludedUsers;
    let extraCost = simulator.essentialExtraUserCost;
    let quota = simulator.essentialQuota;

    if (testUsers > simulator.essentialIncludedUsers && testUsers <= simulator.proIncludedUsers) {
      planName = 'Profissional';
      basePrice = simulator.proBasePrice;
      included = simulator.proIncludedUsers;
      extraCost = simulator.proExtraUserCost;
      quota = simulator.proQuota;
    } else if (testUsers > simulator.proIncludedUsers) {
      planName = 'Corporativo';
      basePrice = simulator.corpBasePrice;
      included = simulator.corpIncludedUsers;
      extraCost = simulator.corpExtraUserCost;
      quota = simulator.corpQuota;
    }

    const extraUsers = Math.max(0, testUsers - included);
    const monthlyTotalBase = basePrice + (extraUsers * extraCost);
    const finalMonthlyPrice = testBillingPeriod === 'anual'
      ? Math.round(monthlyTotalBase * (1 - (simulator.annualDiscountPct / 100)))
      : monthlyTotalBase;

    // ROI Calc
    const totalReceiptsMonth = testUsers * testReceiptsPerUser;
    const hoursSavedMonth = Math.round((totalReceiptsMonth * simulator.minutesSavedPerReceipt) / 60);
    const annualSavings = Math.round(hoursSavedMonth * simulator.hourlyCostR$ * 12);

    return {
      planName,
      basePrice,
      included,
      extraCost,
      extraUsers,
      quota,
      finalMonthlyPrice,
      annualSavings,
      hoursSavedMonth
    };
  };

  const testResult = calculateTestResult();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base text-slate-900">Restaurar Configurações Padrões?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta ação irá redefinir todos os planos comerciais, parâmetros do simulador de ROI e regras de responsabilidade para os valores de fábrica da NotaDiária.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card - Clean Light Theme */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Painel Administrativo & Gestão Master
            </h1>
            <span className="text-[10px] font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
              SaaS Control
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Gerencie planos comerciais, regras de aprovação e alçadas, calibrador de ROI e métricas em tempo real.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isDirty && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Alterações pendentes
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl border border-slate-300 text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            title="Restaurar padrões"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Padrões</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className={`font-extrabold px-5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/40'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Publicando...' : isDirty ? 'Salvar & Publicar no Site' : 'Salvar Alterações'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
              title="Fechar painel (salva pendências automaticamente)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs - Light Corporate Bar */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'plans'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Gestão de Planos & Preços</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${activeTab === 'plans' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'}`}>
            {plans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('responsibilities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'responsibilities'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Atribuição de Responsabilidades & Alçadas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-emerald-100 text-emerald-800">
            RBAC
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Calibrador do Simulador ROI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas & Receita SaaS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'email'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Servidor de E-mail (Hostinger SMTP)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-emerald-100 text-emerald-800">
            SSL 465
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GESTÃO DE PLANOS & PREÇOS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Planos de Assinatura Cadastrados</h2>
              <p className="text-xs text-slate-500">
                Edite valores base, usuários inclusos, franquia e benefícios. Atualizações impactam a Landing Page e o Checkout imediatamente.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddNewPlan}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-indigo-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Novo Plano</span>
            </button>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {plans.map((plan, index) => (
              <div
                key={plan.id || index}
                className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs relative transition-all ${
                  plan.popular ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200'
                }`}
              >
                {/* Popular Toggle & Delete */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={plan.popular || false}
                      onChange={(e) => handleUpdatePlan(index, 'popular', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Destacar (Mais Vendido)</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-slate-500 mr-2">
                      <input
                        type="checkbox"
                        checked={plan.active}
                        onChange={(e) => handleUpdatePlan(index, 'active', e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{plan.active ? 'Ativo' : 'Inativo'}</span>
                    </label>
                    <button
                      id={`btn-delete-plan-${plan.id || index}`}
                      type="button"
                      onClick={() => handleDeletePlan(index)}
                      className="text-slate-400 hover:text-rose-600 active:scale-95 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                      title="Excluir este plano"
                      aria-label="Excluir este plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Plan Name & Badge */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Nome do Plano
                    </label>
                    <input
                      type="text"
                      value={plan.nome}
                      onChange={(e) => handleUpdatePlan(index, 'nome', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-black text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Rótulo / Badge
                    </label>
                    <input
                      type="text"
                      value={plan.badge}
                      onChange={(e) => handleUpdatePlan(index, 'badge', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50"
                    />
                  </div>
                </div>

                {/* Price and Quota Inputs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Preço Base Mensal (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        min="0"
                        value={plan.basePrice}
                        onChange={(e) => handleUpdatePlan(index, 'basePrice', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-2 py-1 text-xs font-black text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Usuários Inclusos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={plan.includedUsers}
                      onChange={(e) => handleUpdatePlan(index, 'includedUsers', parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Usuário Extra (R$/mês)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        min="0"
                        value={plan.extraUserCost}
                        onChange={(e) => handleUpdatePlan(index, 'extraUserCost', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Desconto Anual (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={plan.annualDiscountPct || 15}
                        onChange={(e) => handleUpdatePlan(index, 'annualDiscountPct', parseInt(e.target.value, 10) || 0)}
                        className="w-full pr-6 pl-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Franquia de Docs / Mês
                    </label>
                    <input
                      type="text"
                      value={plan.documentsQuota}
                      onChange={(e) => handleUpdatePlan(index, 'documentsQuota', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Lista de Benefícios ({plan.features.length})
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-lg text-xs group">
                        <span className="text-[11px] text-slate-700 leading-tight">{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index, fIdx)}
                          className="text-slate-300 group-hover:text-rose-500 p-0.5 rounded hover:bg-rose-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Feature */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newFeatureInputs[index] || ''}
                      onChange={(e) => setNewFeatureInputs(prev => ({ ...prev, [index]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFeature(index)}
                      placeholder="Novo benefício..."
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddFeature(index)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Plan Card Footer with quick save */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Anual (15% off): <strong className="text-slate-900 font-mono">R$ {Math.round(plan.basePrice * (1 - (plan.annualDiscountPct || 15) / 100))}/mês</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    title="Publicar este plano na Home e Checkout"
                  >
                    <Save className="w-3 h-3" />
                    <span>{saving ? 'Publicando...' : 'Publicar'}</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATRIBUIÇÃO DE RESPONSABILIDADES & ALÇADAS (RBAC)                  */}
      {/* ========================================================================= */}
      {activeTab === 'responsibilities' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-indigo-950">
                Matriz de Responsabilidades, Perfis & Limites de Alçada
              </h2>
              <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                Configure quais papéis de usuário têm permissão para aprovar despesas, definir o cargo formal do aprovador na empresa, criar viagens e auditar relatórios fiscais probatórios.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box 1: Permissões de Aprovação e Cargo do Aprovador */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Alçada de Aprovação de Despesas</h3>
              </div>

              {/* Cargo ou Título Personalizado */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cargo / Título do Responsável Aprovador na Empresa
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={responsibilities.approvalRoleTitle || ''}
                    onChange={(e) => setResponsibilities(prev => ({ ...prev, approvalRoleTitle: e.target.value }))}
                    placeholder="Ex: Gestor Imediato, Controladoria, Diretor Financeiro"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Este título será exibido nos relatórios em PDF, no painel de aprovações e na assinatura eletrônica da prestação de contas.
                </p>
              </div>

              {/* Papéis com Permissão de Aprovação */}
              <div className="space-y-2 pt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Papéis de Usuário Habilitados para Aprovar / Reprovar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gestor', label: 'Gestor', desc: 'Aprovador de equipe' },
                    { id: 'financeiro', label: 'Financeiro', desc: 'Auditoria & Contas' },
                    { id: 'admin', label: 'Administrador', desc: 'Controle mestre' },
                    { id: 'auditor', label: 'Auditor Externo', desc: 'Compliance fiscal' }
                  ].map((roleItem) => {
                    const isChecked = (responsibilities.approvalRoles || []).includes(roleItem.id as any);
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => handleToggleApprovalRole(roleItem.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs">{roleItem.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{roleItem.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teto de Valor para Aprovação Simples */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Teto de Valor para Aprovação Simples (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={responsibilities.highValueThresholdR$ || 1000}
                      onChange={(e) => setResponsibilities(prev => ({ ...prev, highValueThresholdR$: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Despesas com valor superior a R$ {responsibilities.highValueThresholdR$ || 1000} recebem destaque de alta alçada e auditoria reforçada.
                  </p>
                </div>

                {/* Dupla Aprovação Switch */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Exigir Dupla Aprovação acima do Teto</div>
                    <div className="text-[10px] text-slate-500">Requer validação do Gestor + Financeiro para despesas de alto valor</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={responsibilities.requireDualApprovalAboveThreshold || false}
                    onChange={(e) => setResponsibilities(prev => ({ ...prev, requireDualApprovalAboveThreshold: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </label>
              </div>

            </div>

            {/* Box 2: Permissões de Criação, Auditoria & Políticas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Lançamento, Auditoria WORM & Notificações</h3>
              </div>

              {/* Criação de Viagens e Despesas */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Quem pode criar / lançar despesas e viagens
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'funcionario', label: 'Funcionário / Viajante' },
                    { id: 'gestor', label: 'Gestor' },
                    { id: 'financeiro', label: 'Financeiro' },
                    { id: 'admin', label: 'Administrador' }
                  ].map((roleItem) => {
                    const isChecked = (responsibilities.creationRoles || []).includes(roleItem.id as any);
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => handleToggleCreationRole(roleItem.id as any)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span>{roleItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exportação de Relatórios Fiscais e Hash WORM */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Quem pode exportar relatórios fiscais (PDF, XLSX & Trilha WORM)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'funcionario', label: 'Funcionário' },
                    { id: 'gestor', label: 'Gestor' },
                    { id: 'financeiro', label: 'Financeiro' },
                    { id: 'admin', label: 'Administrador' }
                  ].map((roleItem) => {
                    const isChecked = (responsibilities.auditExportRoles || []).includes(roleItem.id as any);
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => handleToggleAuditExportRole(roleItem.id as any)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span>{roleItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Políticas de Autoaprovação e Notificação */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Permitir Autoaprovação</div>
                    <div className="text-[10px] text-slate-500">Se o gestor lançar uma despesa própria, ele mesmo pode aprovar</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={responsibilities.allowSelfApproval || false}
                    onChange={(e) => setResponsibilities(prev => ({ ...prev, allowSelfApproval: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Notificar Gestores ao Submeter Despesa</div>
                    <div className="text-[10px] text-slate-500">Envia alerta instantâneo quando uma prestação de contas é submetida</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={responsibilities.notifyOnSubmission !== false}
                    onChange={(e) => setResponsibilities(prev => ({ ...prev, notifyOnSubmission: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </label>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CALIBRADOR DO SIMULADOR ROI                                       */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Parâmetros das Faixas de Preço</h3>
              </div>

              {/* Essential Tier Controls */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">1. Faixa Essencial (Starter)</span>
                  <span className="text-[10px] font-bold text-slate-500">Até {simulator.essentialIncludedUsers} usuários</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Preço Base (R$)</label>
                    <input
                      type="number"
                      value={simulator.essentialBasePrice}
                      onChange={(e) => setSimulator(prev => ({ ...prev, essentialBasePrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Usuários Inclusos</label>
                    <input
                      type="number"
                      value={simulator.essentialIncludedUsers}
                      onChange={(e) => setSimulator(prev => ({ ...prev, essentialIncludedUsers: parseInt(e.target.value, 10) || 1 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Extra (R$/usuário)</label>
                    <input
                      type="number"
                      value={simulator.essentialExtraUserCost}
                      onChange={(e) => setSimulator(prev => ({ ...prev, essentialExtraUserCost: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pro Tier Controls */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950">2. Faixa Profissional (Scale)</span>
                  <span className="text-[10px] font-bold text-indigo-700">De {simulator.essentialIncludedUsers + 1} a {simulator.proIncludedUsers} usuários</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-800 uppercase">Preço Base (R$)</label>
                    <input
                      type="number"
                      value={simulator.proBasePrice}
                      onChange={(e) => setSimulator(prev => ({ ...prev, proBasePrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-indigo-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-800 uppercase">Usuários Inclusos</label>
                    <input
                      type="number"
                      value={simulator.proIncludedUsers}
                      onChange={(e) => setSimulator(prev => ({ ...prev, proIncludedUsers: parseInt(e.target.value, 10) || 1 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-indigo-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-800 uppercase">Extra (R$/usuário)</label>
                    <input
                      type="number"
                      value={simulator.proExtraUserCost}
                      onChange={(e) => setSimulator(prev => ({ ...prev, proExtraUserCost: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-indigo-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Corporate Tier Controls */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">3. Faixa Corporativa (Enterprise)</span>
                  <span className="text-[10px] font-bold text-slate-500">Mais de {simulator.proIncludedUsers} usuários</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Preço Base (R$)</label>
                    <input
                      type="number"
                      value={simulator.corpBasePrice}
                      onChange={(e) => setSimulator(prev => ({ ...prev, corpBasePrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Usuários Inclusos</label>
                    <input
                      type="number"
                      value={simulator.corpIncludedUsers}
                      onChange={(e) => setSimulator(prev => ({ ...prev, corpIncludedUsers: parseInt(e.target.value, 10) || 1 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Extra (R$/usuário)</label>
                    <input
                      type="number"
                      value={simulator.corpExtraUserCost}
                      onChange={(e) => setSimulator(prev => ({ ...prev, corpExtraUserCost: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ROI Assumptions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-extrabold text-slate-900">Premissas de Economia & ROI</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Minutos Salvos / Nota</label>
                    <input
                      type="number"
                      value={simulator.minutesSavedPerReceipt}
                      onChange={(e) => setSimulator(prev => ({ ...prev, minutesSavedPerReceipt: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Custo Hora Equipe (R$)</label>
                    <input
                      type="number"
                      value={simulator.hourlyCostR$}
                      onChange={(e) => setSimulator(prev => ({ ...prev, hourlyCostR$: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Desconto Anual (%)</label>
                    <input
                      type="number"
                      value={simulator.annualDiscountPct}
                      onChange={(e) => setSimulator(prev => ({ ...prev, annualDiscountPct: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Simulator Live Preview Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-b from-indigo-50/90 via-white to-white rounded-2xl border-2 border-indigo-500 p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-700 font-mono">Live Simulator Preview</span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Tempo Real</span>
              </div>

              {/* Sliders for testing */}
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Usuários para Teste:</span>
                    <span className="text-indigo-600 font-mono font-black">{testUsers}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={testUsers}
                    onChange={(e) => setTestUsers(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Notas / Mês por Usuário:</span>
                    <span className="text-indigo-600 font-mono font-black">{testReceiptsPerUser}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={testReceiptsPerUser}
                    onChange={(e) => setTestReceiptsPerUser(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-bold text-slate-600">Ciclo:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTestBillingPeriod('mensal')}
                      className={`px-2 py-0.5 rounded ${testBillingPeriod === 'mensal' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                    >
                      Mensal
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestBillingPeriod('anual')}
                      className={`px-2 py-0.5 rounded ${testBillingPeriod === 'anual' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                    >
                      Anual (-{simulator.annualDiscountPct}%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Result Preview Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Plano Recomendado:</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">{testResult.planName}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Investimento Estimado:</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-white font-mono">
                      R$ {testResult.finalMonthlyPrice.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">/mês</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Horas economizadas/mês:</span>
                    <span className="font-bold text-white font-mono">{testResult.hoursSavedMonth} horas</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Economia anual estimada:</span>
                    <span className="font-black text-emerald-400 font-mono">R$ {testResult.annualSavings.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MÉTRICAS & RECEITA SAAS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Stripe Official Gateway Live Health Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-sm">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Stripe Payment Gateway
                  </h3>
                  {stripeStatus?.success ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado (API 200 OK)
                    </span>
                  ) : stripeStatus ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Desconectado
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">Verificando...</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {stripeStatus?.success
                    ? `Conta: ${stripeStatus.account?.name} (${stripeStatus.account?.id}) • ${stripeStatus.account?.livemode ? 'Modo Produção' : 'Modo Sandbox/Teste'}`
                    : stripeStatus?.error || 'Aguardando validação com a API da Stripe...'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchStripeStatus}
              disabled={verifyingStripeAdmin}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors border border-indigo-200 disabled:opacity-50 shrink-0 self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifyingStripeAdmin ? 'animate-spin' : ''}`} />
              <span>Testar Conexão Stripe</span>
            </button>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">MRR Recorrente</span>
              <div className="text-xl font-black text-slate-900 font-mono">
                R$ {analytics.mrr.toLocaleString('pt-BR')}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +14.2% este mês
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clientes Ativos</span>
              <div className="text-xl font-black text-slate-900 font-mono">
                {analytics.totalSubscribers}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> 18 em degustação
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acurácia IA Gemini</span>
              <div className="text-xl font-black text-indigo-600 font-mono">
                {analytics.geminiAccuracyPct}%
              </div>
              <span className="text-[10px] text-slate-500">Extração fiscal zero erro</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Despesas Auditadas</span>
              <div className="text-xl font-black text-slate-900 font-mono">
                R$ {(analytics.totalProcessedValueR$ / 1000000).toFixed(2)}M
              </div>
              <span className="text-[10px] text-slate-500">Hash WORM SHA-256</span>
            </div>
          </div>

          {/* Accounts & Recent Billing Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Accounts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Contas Corporativas Ativas</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-mono">Total: {analytics.companyAccounts.length}</span>
              </div>

              <div className="space-y-2">
                {analytics.companyAccounts.map((account) => (
                  <div key={account.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{account.nome}</div>
                      <div className="text-[10px] text-slate-500">Plano {account.plano} • {account.usuariosAtivos} usuários</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono">R$ {account.mrrMensal}/mês</div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        account.status === 'Ativa' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Transações Recentes de Checkout</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-mono">Stripe Live</span>
              </div>

              <div className="space-y-2">
                {analytics.recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{tx.empresa}</div>
                      <div className="text-[10px] text-slate-500">{tx.plano} • {tx.metodo}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono">R$ {tx.valor.toLocaleString('pt-BR')}</div>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SERVIDOR DE E-MAIL & NOTIFICAÇÕES (HOSTINGER SMTP)                 */}
      {/* ========================================================================= */}
      {activeTab === 'email' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Servidor Hostinger Email & Notificações Transacionais
                </h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SMTP SSL Ativo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Parâmetros oficiais configurados para envio de contratos de adesão com assinatura digital, alertas de aprovação de despesas e comprovantes fiscais.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVerifySmtp}
                disabled={emailLoading}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors border border-indigo-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${emailLoading ? 'animate-spin' : ''}`} />
                <span>Testar Conexão SMTP</span>
              </button>
            </div>
          </div>

          {/* Feedback alert */}
          {emailFeedback && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
              emailFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {emailFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{emailFeedback.message}</div>
              <button
                type="button"
                onClick={() => setEmailFeedback(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hostinger Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Servidor SMTP</div>
              <div className="text-sm font-extrabold text-slate-900 font-mono">
                {smtpStatus?.host || 'smtp.hostinger.com'}
              </div>
              <div className="text-[11px] text-slate-500">Hostinger Business Mail</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Porta & Criptografia</div>
              <div className="text-sm font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
                <span>{smtpStatus?.port || '465'}</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  SSL Obrigatório
                </span>
              </div>
              <div className="text-[11px] text-slate-500">Conexão Criptografada Direta</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Usuário Autenticado</div>
              <div className="text-sm font-extrabold text-slate-900 font-mono truncate" title={smtpStatus?.user || 'contato@notadiaria.digital'}>
                {smtpStatus?.user || 'contato@notadiaria.digital'}
              </div>
              <div className="text-[11px] text-slate-500">Conta Institucional Própria</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status do Serviço</div>
              <div className="text-sm font-extrabold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pronto para Envios</span>
              </div>
              <div className="text-[11px] text-slate-500">Credenciais Carregadas</div>
            </div>

          </div>

          {/* Test Email Dispatcher Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Disparo de Teste em Tempo Real
                </h3>
                <p className="text-xs text-slate-500">
                  Envie um e-mail de teste para verificar a entrega na sua caixa de entrada pessoal ou corporativa.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                De: contato@notadiaria.digital
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:flex-1 relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Seu e-mail (ex: gestaonotadiaria@gmail.com)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={emailLoading || !testEmailRecipient}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{emailLoading ? 'Transmitindo...' : 'Enviar E-mail de Teste'}</span>
              </button>
            </div>
          </div>

          {/* Active Email Automation Triggers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Gatilhos de Notificação Automáticos Configurados
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Contrato de Adesão & Boas-Vindas</div>
                  <p className="text-[11px] text-slate-500">
                    Disparado automaticamente ao aprovar checkout no Stripe ou Pix, contendo número de protocolo, hash SHA-256 e termos legais do Decreto 10.278/2020.
                  </p>
                  <span className="inline-block text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Ativo via /api/payment/send-contract
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Aprovação de Despesas e Viagens</div>
                  <p className="text-[11px] text-slate-500">
                    Notifica gestores corporativos quando um viajante submete um novo relatório de prestação de contas com recibos fiscais.
                  </p>
                  <span className="inline-block text-[9px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    Workflow Multi-Alçada
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Trilha de Auditoria e Integridade WORM</div>
                  <p className="text-[11px] text-slate-500">
                    Gera alertas para a equipe de compliance e financeiro em caso de divergência fiscal em notas ou duplicidade de cupons.
                  </p>
                  <span className="inline-block text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Garantia Anti-Fraude
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Comprovante de Pagamento & Faturamento</div>
                  <p className="text-[11px] text-slate-500">
                    Cópia do recibo de pagamento corporativo com dados do cartão ou chave Pix para o setor fiscal da empresa contratante.
                  </p>
                  <span className="inline-block text-[9px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    Stripe & Pix Integrados
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
