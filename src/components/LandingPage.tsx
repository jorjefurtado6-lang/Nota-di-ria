import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  Receipt, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  FileCheck2, 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  Building2, 
  Lock, 
  ChevronRight, 
  Camera, 
  FileSpreadsheet, 
  Users, 
  ShieldAlert,
  Star,
  Clock,
  Award,
  Calculator,
  Scan,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Briefcase,
  Shield,
  Menu,
  X,
  MousePointer2,
  MoveHorizontal
} from 'lucide-react';
import { AuthView } from './AuthView';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { LegalModal } from './LegalModal';
import { PlanTier } from '../types';
import {
  AdminFullConfig,
  getInitialAdminConfig,
  subscribeToAdminConfig
} from '../lib/adminConfigStore';

interface LandingPageProps {
  onSuccess: () => void;
  onDemoSuccess?: (demoUser: any, demoRole: UserRole, demoName: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSuccess, onDemoSuccess }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRoleForModal, setSelectedRoleForModal] = useState<UserRole>('funcionario');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic Admin Config State (Plan prices & Simulator formulas)
  const [adminConfig, setAdminConfig] = useState<AdminFullConfig>(getInitialAdminConfig);

  React.useEffect(() => {
    const unsub = subscribeToAdminConfig((cfg) => {
      setAdminConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Legal Modal State
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('privacy');

  // Payment Gateway Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanTier>('profissional');

  // ROI Calculator State
  const [employees, setEmployees] = useState<number>(15);
  const [receiptsPerEmployee, setReceiptsPerEmployee] = useState<number>(12);
  const [showSliderGuide, setShowSliderGuide] = useState<boolean>(true);

  // Calculated Metrics (using configured admin rules)
  const totalReceiptsMonth = employees * receiptsPerEmployee;
  const hoursSavedMonth = Math.round((totalReceiptsMonth * (adminConfig.simulator.minutesSavedPerReceipt || 8)) / 60);
  const annualSavingsR$ = Math.round(hoursSavedMonth * (adminConfig.simulator.hourlyCostR$ || 65) * 12);

  // OCR Live Simulator State
  const [simulatingOcr, setSimulatingOcr] = useState<boolean>(false);
  const [ocrCompleted, setOcrCompleted] = useState<boolean>(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Pricing Active Users Calculator State
  const [planActiveUsers, setPlanActiveUsers] = useState<number>(12);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'mensal' | 'anual'>('anual');
  const [showPlanSliderGuide, setShowPlanSliderGuide] = useState<boolean>(true);

  // Pricing Calculation Helper reading dynamically from Admin Config
  const calculateBestPlan = (users: number) => {
    const sim = adminConfig.simulator;
    const discountFactor = 1 - ((sim.annualDiscountPct || 15) / 100);

    const personalPlan = adminConfig.plans.find(p => (p.id === 'pessoal' || p.nome?.toLowerCase().includes('pessoal')) && p.active);
    if (personalPlan && users <= 1) {
      const monthlyTotal = personalPlan.basePrice;
      return {
        planName: personalPlan.nome,
        basePrice: personalPlan.basePrice,
        includedUsers: personalPlan.includedUsers,
        extraUserCost: personalPlan.extraUserCost,
        monthlyTotal: selectedBillingPeriod === 'anual' ? Math.round(monthlyTotal * discountFactor) : monthlyTotal,
        documentsIncluded: personalPlan.documentsQuota,
        extraUsers: 0,
        badge: personalPlan.badge || 'Pessoa Física e Autônomos'
      };
    }

    if (users <= sim.essentialIncludedUsers) {
      const extraUsers = Math.max(0, users - sim.essentialIncludedUsers);
      const monthlyTotal = sim.essentialBasePrice + (extraUsers * sim.essentialExtraUserCost);
      return {
        planName: 'Essencial',
        basePrice: sim.essentialBasePrice,
        includedUsers: sim.essentialIncludedUsers,
        extraUserCost: sim.essentialExtraUserCost,
        monthlyTotal: selectedBillingPeriod === 'anual' ? Math.round(monthlyTotal * discountFactor) : monthlyTotal,
        documentsIncluded: sim.essentialQuota,
        extraUsers,
        badge: 'Ideal para Pequenas Equipes'
      };
    } else if (users <= sim.proIncludedUsers) {
      const extraUsers = Math.max(0, users - sim.proIncludedUsers);
      const monthlyTotal = sim.proBasePrice + (extraUsers * sim.proExtraUserCost);
      return {
        planName: 'Profissional',
        basePrice: sim.proBasePrice,
        includedUsers: sim.proIncludedUsers,
        extraUserCost: sim.proExtraUserCost,
        monthlyTotal: selectedBillingPeriod === 'anual' ? Math.round(monthlyTotal * discountFactor) : monthlyTotal,
        documentsIncluded: sim.proQuota,
        extraUsers,
        badge: 'Mais Recomendado'
      };
    } else {
      const extraUsers = Math.max(0, users - sim.corpIncludedUsers);
      const monthlyTotal = sim.corpBasePrice + (extraUsers * sim.corpExtraUserCost);
      return {
        planName: 'Corporativo',
        basePrice: sim.corpBasePrice,
        includedUsers: sim.corpIncludedUsers,
        extraUserCost: sim.corpExtraUserCost,
        monthlyTotal: selectedBillingPeriod === 'anual' ? Math.round(monthlyTotal * discountFactor) : monthlyTotal,
        documentsIncluded: sim.corpQuota,
        extraUsers,
        badge: 'Para Operações de Grande Porte'
      };
    }
  };

  const calculatedPlan = calculateBestPlan(planActiveUsers);

  const handleSimulateOcr = () => {
    setSimulatingOcr(true);
    setOcrCompleted(false);
    setTimeout(() => {
      setSimulatingOcr(false);
      setOcrCompleted(true);
    }, 1200);
  };

  const handleQuickAccess = (role: UserRole, email: string, name: string) => {
    const fakeUid = `demo_${role}_${email.split('@')[0]}`;
    const demoUserObj = {
      uid: fakeUid,
      email: email,
      displayName: name
    };

    if (onDemoSuccess) {
      onDemoSuccess(demoUserObj, role, name);
    } else {
      onSuccess();
    }
  };

  const faqItems = [
    {
      q: 'Como funciona a cobrança por usuário ativo?',
      a: 'Você paga uma mensalidade base fixa conforme o plano e apenas pelos usuários que realmente desempenharem alguma ação no mês (como lançar, aprovar, editar ou exportar despesas). Funcionários inativos no período não geram custo adicional.'
    },
    {
      q: 'O que acontece se ultrapassarmos a franquia mensal de documentos?',
      a: 'Nenhum lançamento é bloqueado! A empresa pode adquirir pacotes adicionais de notas (ex: +100 documentos por R$ 29 ou +500 documentos por R$ 99) sem interromper a rotina das equipes.'
    },
    {
      q: 'Como funciona o teste gratuito de 30 dias?',
      a: 'O trial dura 30 dias, inclui até 10 usuários ativos e 100 notas com acesso completo a todas as funções do Plano Profissional. Não exigimos cartão de crédito para iniciar.'
    },
    {
      q: 'O que está incluído no Piloto Assistido de 45 dias?',
      a: 'Empresas de médio e grande porte qualificadas pelo nosso time comercial recebem acompanhamento dedicado durante 45 dias, com cadastro guiado de políticas, parametrização de limites e reunião de avaliação com relatório de resultados.'
    },
    {
      q: 'Qual a validade jurídica das notas arquivadas no NotaDiária?',
      a: 'Todas as notas passam por extração multimodal e recebem um Hash Probatório SHA-256 no momento do envio, garantindo o padrão WORM (Write Once, Read Many). As notas possuem validade para auditorias contábeis e fiscais conforme exigências nacionais.'
    },
    {
      q: 'O aplicativo funciona em locais sem conexão com a internet (Offline)?',
      a: 'Sim! O funcionário pode fotografar e salvar todas as despesas mesmo estando sem sinal ou em voos. Assim que o dispositivo reconectar ao Wi-Fi ou 4G, os dados são sincronizados automaticamente com o Firestore.'
    },
    {
      q: 'Como funciona a taxa de implantação e onboarding?',
      a: 'Para os planos Essencial e Profissional, o onboarding é automatizado e gratuito. Para empresas que exigem parametrizações complexas, múltiplos CNPJs ou treinamento de equipes, oferecemos o pacote de Implantação Padrão (R$ 1.500 a R$ 4.000) ou Corporativa.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/notadiaria_icon.svg" 
              alt="NotaDiária Logo" 
              className="w-10 h-10 rounded-xl object-cover border border-indigo-500/40 shadow-inner" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">NotaDiária</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#recursos" className="hover:text-indigo-400 transition-colors">
              Recursos & IA
            </a>
            <a href="#beneficios" className="hover:text-indigo-400 transition-colors">
              Benefícios Corporativos
            </a>
            <a href="#calculadora" className="hover:text-indigo-400 transition-colors">
              Calculadora ROI
            </a>
            <a href="#planos" className="hover:text-indigo-400 transition-colors">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-indigo-400 transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuickAccess('funcionario', 'carlos@empresa.com.br', 'Carlos Santos')}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/80"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Instantânea</span>
            </button>

            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Acessar Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
              aria-label="Abrir Menu de Navegação"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-2 text-sm font-medium text-slate-200 border-b border-slate-800 pb-4">
              <a
                href="#recursos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              >
                Recursos & IA
              </a>
              <a
                href="#beneficios"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              >
                Benefícios Corporativos
              </a>
              <a
                href="#calculadora"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              >
                Calculadora ROI
              </a>
              <a
                href="#planos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              >
                Planos & Preços
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              >
                FAQ
              </a>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleQuickAccess('funcionario', 'carlos@empresa.com.br', 'Carlos Santos');
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-amber-300 bg-slate-950 border border-amber-500/30 px-4 py-2.5 rounded-xl hover:bg-amber-500/10 transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Testar Demo Instantânea</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-indigo-600 border border-indigo-500 px-4 py-2.5 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
              >
                <span>Entrar / Cadastrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 border-b border-slate-200">
        {/* Background Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-indigo-700 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>OCR & Arquivamento Probatório WORM</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Zero Digitação.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                Total Controle Fiscal.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Simplifique viagens corporativas, auditoria e reembolsos de despesas. Fotografe a nota e deixe a IA extrair os dados e calcular impostos automaticamente.
            </p>

            {/* Direct High Conversion CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Acessar Painel Agora</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleQuickAccess('gestor', 'mariana@empresa.com.br', 'Mariana Lima')}
                className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-sm px-6 py-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-amber-600" />
                <span>Entrar como Gestor (Demo)</span>
              </button>
            </div>

            {/* Trust bullet features */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>45 dias grátis no Plano Essencial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Sem necessidade de cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Pronto em 30 segundos</span>
              </div>
            </div>

          </div>

          {/* Persona Direct Access Cards (Instant Painel Access) */}
          <div className="mt-14 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Acesso Direto ao Painel por Perfil Corporativo</span>
                </h2>
                <p className="text-xs text-slate-500">Escolha uma persona para explorar o sistema em tempo real com dados de teste</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded">
                1-Click Login
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Viajante */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between group shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-emerald-100/80 text-emerald-700 border border-emerald-200">
                      <Camera className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Viajante</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Carlos Santos</h3>
                    <p className="text-xs text-slate-500">Consultor de Campo & Vendas</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Fotografe recibos pelo celular, visualize relatórios de viagens e sincronize notas offline.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickAccess('funcionario', 'carlos@notadiaria.com.br', 'Carlos Santos')}
                  className="mt-5 w-full bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Acessar como Viajante</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2: Gestor */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-amber-500 transition-all flex flex-col justify-between group shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-amber-100/80 text-amber-700 border border-amber-200">
                      <FileCheck2 className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Aprovador</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Mariana Lima</h3>
                    <p className="text-xs text-slate-500">Gestora da Equipe de Operações</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aprove ou rejeite despesas com 1 toque, visualize alertas de teto orçamentário e notas pendentes.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickAccess('gestor', 'mariana@notadiaria.com.br', 'Mariana Lima')}
                  className="mt-5 w-full bg-white hover:bg-amber-600 hover:text-white text-amber-700 border border-amber-300 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Acessar como Gestora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3: Financeiro & Compliance */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-indigo-500 transition-all flex flex-col justify-between group shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-indigo-100/80 text-indigo-700 border border-indigo-200">
                      <BarChart3 className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Auditoria</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Roberto Alves</h3>
                    <p className="text-xs text-slate-500">Analista de Compliance & Contábil</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Acesse gráficos Recharts por categoria, consulte a trilha WORM imutável e exporte relatórios PDF/XLSX.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickAccess('financeiro', 'roberto@notadiaria.com.br', 'Roberto Alves')}
                  className="mt-5 w-full bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-300 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Acessar como Compliance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Interactive OCR Live Simulator */}
      <section id="recursos" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest font-mono inline-flex items-center justify-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Demonstração ao Vivo</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Veja como a IA Visual Lê suas Notas</h2>
            <p className="text-xs sm:text-sm text-slate-600">Experimente a velocidade de extração de campos em tempo real sem digitação manual.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-lg">
            
            {/* Left side: Simulated Receipt Image */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Nota de Exemplo (Foto do Celular)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Restaurante Sabor & Arte</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 space-y-2 relative overflow-hidden shadow-xs">
                <div className="text-center border-b border-dashed border-slate-300 pb-2">
                  <p className="font-extrabold text-slate-900 text-sm">RESTAURANTE SABOR & ARTE LTDA</p>
                  <p className="text-[10px] text-slate-500">CNPJ: 12.345.678/0001-90</p>
                  <p className="text-[10px] text-slate-500">Av. Paulista, 1500 - São Paulo/SP</p>
                </div>

                <div className="space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between">
                    <span>1x ALMOCO EXECUTIVO</span>
                    <span>R$ 68,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x SUCO NATURAL</span>
                    <span>R$ 12,00</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>SUBTOTAL</span>
                    <span>R$ 80,00</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-[10px] font-semibold">
                    <span>GORJETA / TAXA DE SERVIÇO (10%)</span>
                    <span>R$ 8,00</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL PAGO</span>
                  <span>R$ 88,00</span>
                </div>

                <div className="text-center text-[9px] text-slate-400 pt-1">
                  28/07/2026 13:42 • NFC-e Nº 004921
                </div>

                {simulatingOcr && (
                  <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 text-white">
                    <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs font-bold text-indigo-200">Extraindo dados via IA Visão Avançada...</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSimulateOcr}
                disabled={simulatingOcr}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                <Scan className="w-4 h-4" />
                <span>{simulatingOcr ? 'Processando OCR...' : 'Simular Leitura OCR em 1,2s'}</span>
              </button>
            </div>

            {/* Right side: Extracted Data Result */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Dados Estruturados Resultantes</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${ocrCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                  {ocrCompleted ? '100% EXTRAÍDO' : 'AGUARDANDO TESTE'}
                </span>
              </div>

              {ocrCompleted ? (
                <div className="bg-white border border-emerald-300 rounded-xl p-4 space-y-3 animate-in fade-in duration-300 shadow-xs">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Empresa / Estabelecimento</span>
                      <span className="font-bold text-slate-900">RESTAURANTE SABOR & ARTE</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">CNPJ</span>
                      <span className="font-mono text-indigo-700">12.345.678/0001-90</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Categoria</span>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">Alimentação</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor Total</span>
                      <span className="font-extrabold text-emerald-600 text-sm">R$ 88,00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Gorjeta Identificada</span>
                      <span className="text-slate-800 font-mono">R$ 8,00 (10%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Data do Cupom</span>
                      <span className="text-slate-800">28/07/2026</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Hash Probatório WORM SHA-256:</span>
                    </span>
                    <span className="text-emerald-700 font-bold truncate max-w-[180px]">e3b0c44298fc1c149afbf4c8996fb...</span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Usar no Painel de Despesas</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-slate-300 rounded-xl h-56 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Scan className="w-8 h-8 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">Clique no botão ao lado para testar a extração</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">A IA identifica valores, impostos e calcula os totais sem você digitar uma linha.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Interactive ROI & Time Savings Calculator */}
      <section id="calculadora" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-widest font-mono inline-flex items-center justify-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Simulador de ROI</span>
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Quanto Sua Empresa Vai Economizar?</h2>
            <p className="text-sm text-slate-600">Calcule as horas produtivas recuperadas e a redução de custos na gestão de despesas corporativas.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xl">
            
            {/* Left Controls */}
            <div className="space-y-6">
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Colaboradores que Viajam / Prestam Contas</span>
                    {showSliderGuide && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse">
                        <MoveHorizontal className="w-3 h-3" /> Arraste a barra
                      </span>
                    )}
                  </label>
                  <span className="text-sm font-extrabold text-indigo-700 font-mono">{employees} pessoas</span>
                </div>

                <div className="relative py-2">
                  <input
                    type="range"
                    min="2"
                    max="150"
                    value={employees}
                    onMouseEnter={() => setShowSliderGuide(false)}
                    onTouchStart={() => setShowSliderGuide(false)}
                    onChange={(e) => {
                      setEmployees(parseInt(e.target.value));
                      setShowSliderGuide(false);
                    }}
                    className="w-full accent-indigo-600 bg-slate-200 rounded-lg h-2.5 cursor-pointer relative z-0"
                  />

                  {/* Animated Cursor Guide */}
                  {showSliderGuide && (
                    <div 
                      className="pointer-events-none absolute -top-5 z-20 flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-xl border border-indigo-400"
                      style={{
                        animation: 'slideCursor 3.8s ease-in-out infinite, cursorPulse 2s ease-in-out infinite'
                      }}
                    >
                      <MousePointer2 className="w-3.5 h-3.5 text-indigo-300 fill-indigo-400 shrink-0" />
                      <span className="whitespace-nowrap">Deslize para simular</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800">Média de Notas por Pessoa/Mês</label>
                  <span className="text-sm font-extrabold text-indigo-700 font-mono">{receiptsPerEmployee} notas</span>
                </div>
                <div className="relative py-1.5">
                  <input
                    type="range"
                    min="2"
                    max="50"
                    value={receiptsPerEmployee}
                    onMouseEnter={() => setShowSliderGuide(false)}
                    onTouchStart={() => setShowSliderGuide(false)}
                    onChange={(e) => {
                      setReceiptsPerEmployee(parseInt(e.target.value));
                      setShowSliderGuide(false);
                    }}
                    className="w-full accent-indigo-600 bg-slate-200 rounded-lg h-2.5 cursor-pointer relative z-0"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Volume Mensal Estimado:</span>
                  <span className="font-bold text-slate-900 font-mono">{totalReceiptsMonth} recibos/mês</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo Médio Manual Sem IA:</span>
                  <span className="font-bold text-slate-900 font-mono">~8 min/nota</span>
                </div>
              </div>
            </div>

            {/* Right Projected Results */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 text-center space-y-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 font-mono bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-xs">
                Economia Anual Projetada
              </span>

              <div className="space-y-1">
                <p className="text-4xl font-black text-emerald-600 font-mono">
                  R$ {annualSavingsR$.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-slate-600">em horas de trabalho e redução de inconsistências</p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-indigo-200/80 pt-4 text-left">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Horas Salvas/Mês</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{hoursSavedMonth}h/mês</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Tempo com IA</span>
                  <span className="text-lg font-black text-indigo-700 font-mono">1.2s / foto</span>
                </div>
              </div>

              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                <span>Garantir essa Economia no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Corporate Benefits Section (Por Que Sua Empresa se Beneficia) */}
      <section id="beneficios" className="py-24 bg-white border-t border-slate-200 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest font-mono bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>POR QUE USAR O NOTADIÁRIA?</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Benefícios Estratégicos que Transformam a Operação da Sua Empresa
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Elimine gargalos manuais, diminua riscos de autuações fiscais e traga velocidade e transparência para toda a cadeia de despesas corporativas.
            </p>
          </div>

          {/* 6 Benefit Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Benefit 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-white transition-all space-y-4 group hover:shadow-xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Redução Drástica de Custos & ROI Imediato
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Economize até 85% do tempo gasto por funcionários e equipes financeiras preenchendo e conferindo planilhas manuais. Retorno financeiro positivo logo no primeiro mês.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-white transition-all space-y-4 group hover:shadow-xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Compliance Fiscal & Controle de Política
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Verificação automática de CNPJ do estabelecimento, cálculo exato de gorjetas e alertas visuais instantâneos quando um gasto excede o teto permitido da empresa.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-white transition-all space-y-4 group hover:shadow-xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                Guarda Probatória WORM (Zero Risco)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Cada nota ganha um Hash SHA-256 criptográfico e imutável. Sua empresa resguardada com evidências fiscais auditáveis prontas para fiscalizações.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-white transition-all space-y-4 group hover:shadow-xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Aprovação Rápida & Ciclo de Reembolso Agilizado
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Reduza o prazo médio de aprovação e reembolso de semanas para poucas horas. Gestores aprovam em 1 clique pelo celular com histórico auditável.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-white transition-all space-y-4 group hover:shadow-xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Visibilidade em Tempo Real & DRE de Viagens
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Dashboards interativos com gráficos Recharts por categoria, centro de custo, viagem e projeto. Saiba exatamente onde cada real está sendo investido.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-white transition-all space-y-4 group hover:shadow-xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Alta Produtividade & Satisfação da Equipe
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Seu time focado no que realmente importa: gerar receita em vez de burocracia.
              </p>
            </div>

          </div>

          {/* Before vs After Comparison Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 lg:p-10 shadow-lg space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest font-mono">Transformação Operacional</span>
              <h3 className="text-2xl font-black text-slate-900">Sua Empresa Antes vs. Depois do NotaDiária</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sem NotaDiaria */}
              <div className="bg-rose-50/80 border border-rose-200 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>Sem o NotaDiária (Processo Manual)</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold shrink-0">✕</span>
                    <span>Reembolsos demoram de 15 a 30 dias para serem processados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold shrink-0">✕</span>
                    <span>Notas de papel apagam ou são perdidas durante a viagem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold shrink-0">✕</span>
                    <span>Digitação manual sujeita a erros de digitação e fraudes de notas duplicadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold shrink-0">✕</span>
                    <span>Falta de trilha probatória auditável em caso de fiscalização tributária</span>
                  </li>
                </ul>
              </div>

              {/* Com NotaDiaria */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>Com o NotaDiária (Processo Automatizado)</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>Reembolsos liquidados em poucas horas após o envio da foto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>Extração OCR inteligente dos dados do recibo em apenas 1.2 segundos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>Checklist automático de compliance e validação fiscal de CNPJ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>Arquivamento imutável com Hash WORM SHA-256 e exportação em PDF/Excel</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="pt-4 text-center">
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-2 hover:scale-[1.02]"
              >
                <span>Experimentar Benefícios no Seu Negócio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Monetization & Pricing Section */}
      <section id="planos" className="py-24 bg-slate-50 border-t border-slate-200 relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest font-mono bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-xs">
              Modelo B2B Transparente & Escalável
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Planos Inteligentes para o Tamanho da Sua Operação
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Combinação justa de <strong className="text-slate-900">Mensalidade Mínima + Cobrança por Usuário Ativo</strong>. Pague apenas por quem realmente utilizar a plataforma no mês.
            </p>

            {/* Toggle Billing Period */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${selectedBillingPeriod === 'mensal' ? 'text-slate-900' : 'text-slate-500'}`}>
                Faturamento Mensal
              </span>
              <button
                onClick={() => setSelectedBillingPeriod(selectedBillingPeriod === 'mensal' ? 'anual' : 'mensal')}
                className="w-14 h-8 bg-slate-200 rounded-full p-1 border border-slate-300 relative transition-colors focus:outline-none"
              >
                <div className={`w-6 h-6 bg-indigo-600 rounded-full transition-transform ${selectedBillingPeriod === 'anual' ? 'translate-x-6 bg-emerald-500' : ''}`} />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${selectedBillingPeriod === 'anual' ? 'text-slate-900' : 'text-slate-500'}`}>
                <span>Anual</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-300 font-bold">
                  15% OFF
                </span>
              </span>
            </div>
          </div>

          {/* Dynamic Pricing Cards Grid mapped from adminConfig */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${
            adminConfig.plans.filter(p => p.active).length >= 4 
              ? 'xl:grid-cols-4 lg:grid-cols-2' 
              : 'lg:grid-cols-3'
          } gap-6 items-stretch`}>
            {adminConfig.plans.filter(p => p.active).map((plan) => {
              const isPopular = plan.popular || plan.id === 'profissional';
              const discountPct = plan.annualDiscountPct || adminConfig.simulator.annualDiscountPct || 15;
              const monthlyCalculated = selectedBillingPeriod === 'anual'
                ? Math.round(plan.basePrice * (1 - (discountPct / 100)))
                : plan.basePrice;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all space-y-6 relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-indigo-50/90 via-white to-white border-2 border-indigo-600 shadow-xl lg:scale-105 z-20'
                      : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 font-mono">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                      <span>{plan.badge || 'Mais Vendido & Recomendado'}</span>
                    </div>
                  )}

                  <div className={`space-y-4 ${isPopular ? 'pt-2' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold uppercase tracking-wider font-mono ${isPopular ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {plan.nome}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        isPopular ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {plan.badge || 'Plano Oficial'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xs font-bold ${isPopular ? 'text-indigo-700' : 'text-slate-500'}`}>R$</span>
                        <span className="text-4xl font-black text-slate-900 font-mono">
                          {monthlyCalculated}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/mês</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Inclui <strong>até {plan.includedUsers} {plan.includedUsers === 1 ? 'usuário ativo' : 'usuários ativos'}</strong> no mês
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border text-xs text-slate-700 space-y-1 ${
                      isPopular ? 'bg-slate-50 border-indigo-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Usuário ativo extra:</span>
                        <span className={`font-bold font-mono ${isPopular ? 'text-amber-700' : 'text-indigo-700'}`}>
                          R$ {plan.extraUserCost} /mês
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Franquia de IA:</span>
                        <span className="font-bold text-emerald-700 font-mono">{plan.documentsQuota}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Implantação:</span>
                        <span className="font-bold text-slate-800">Padrão Guiada</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-200">
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${isPopular ? 'text-indigo-700' : 'text-slate-500'}`}>
                        Benefícios inclusos:
                      </p>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlanForPayment(plan.id);
                      setShowPaymentModal(true);
                    }}
                    className={`w-full font-extrabold py-3.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 shadow-xs'
                    }`}
                  >
                    <span>{plan.id === 'essencial' || plan.id === 'pessoal' ? 'Testar 45 Dias Grátis' : `Assinar ${plan.nome}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Dynamic Interactive Plan Estimator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono">Calculadora de Fatura Dinâmica</span>
                <h3 className="text-xl font-extrabold text-slate-900">Simule a Fatura Estimada para Sua Empresa</h3>
                <p className="text-xs text-slate-500">Ajuste a quantidade de usuários ativos mensais para ver o plano ideal</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <Users className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Usuários Ativos:</span>
                <span className="text-lg font-black text-indigo-900 font-mono bg-indigo-100 text-indigo-800 px-3 py-0.5 rounded-lg border border-indigo-200">
                  {planActiveUsers}
                </span>
              </div>
            </div>

            <div className="pt-6 space-y-6">
              <div className="relative">
                <div className="relative py-2">
                  <input
                    type="range"
                    min="1"
                    max="120"
                    value={planActiveUsers}
                    onMouseEnter={() => setShowPlanSliderGuide(false)}
                    onTouchStart={() => setShowPlanSliderGuide(false)}
                    onChange={(e) => {
                      setPlanActiveUsers(parseInt(e.target.value));
                      setShowPlanSliderGuide(false);
                    }}
                    className="w-full accent-indigo-600 bg-slate-200 rounded-lg h-2.5 cursor-pointer relative z-0"
                  />

                  {/* Animated Cursor Guide */}
                  {showPlanSliderGuide && (
                    <div 
                      className="pointer-events-none absolute -top-5 z-20 flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-xl border border-indigo-400"
                      style={{
                        animation: 'slideCursor 3.8s ease-in-out infinite, cursorPulse 2s ease-in-out infinite'
                      }}
                    >
                      <MousePointer2 className="w-3.5 h-3.5 text-indigo-300 fill-indigo-400 shrink-0" />
                      <span className="whitespace-nowrap">Deslize para simular</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>1 usuário</span>
                  <span>5 (Essencial)</span>
                  <span>20 (Profissional)</span>
                  <span>75+ (Corporativo)</span>
                  <span>120 usuários</span>
                </div>
              </div>

              {/* Simulation Result Output */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-50/70 p-5 rounded-xl border border-indigo-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Plano Recomendado</span>
                  <span className="text-base font-black text-indigo-800 flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>{calculatedPlan.planName}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{calculatedPlan.badge}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Detalhamento de Usuários</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {calculatedPlan.includedUsers} inclusos
                    {calculatedPlan.extraUsers > 0 ? (
                      <span className="text-amber-700 font-mono text-[11px] block font-bold">
                        + {calculatedPlan.extraUsers} extras (R$ {calculatedPlan.extraUserCost}/cada)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-mono text-[11px] block font-bold">Sem excedente de usuários</span>
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Fatura Mensal Estimada</span>
                  <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                    R$ {calculatedPlan.monthlyTotal}
                    <span className="text-xs text-slate-500 font-normal"> /mês</span>
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Inclui franquia de {calculatedPlan.documentsIncluded} documentos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Structured Grid: Implementation Fees, Trial Terms & Volume Packs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            
            {/* Box 1: Taxa de Implantação e Onboarding */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Taxa de Implantação</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Opções adaptadas para a complexidade da sua infraestrutura corporativa:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-900">Onboarding Automático</span>
                  <span className="text-emerald-600 font-bold font-mono">Gratuito</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-900">Implantação Padrão</span>
                  <span className="text-indigo-700 font-bold font-mono">R$ 1.500 a 4.000</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold text-slate-900">Implantação Corporativa</span>
                  <span className="text-amber-700 font-bold font-mono">A partir de R$ 5.000</span>
                </li>
              </ul>
              <p className="text-[10px] text-slate-500 italic">
                Inclui cadastro de políticas, parametrização de limites por cargo e treinamento de gestores.
              </p>
            </div>

            {/* Box 2: Trial Estruturado & Piloto Assistido */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Período de Degustação</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Valide os ganhos em produtividade sem nenhum risco financeiro inicial:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="space-y-0.5 border-b border-slate-200 pb-1.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Teste Gratuito (45 Dias)</span>
                    <span className="text-emerald-600 font-mono">Exclusivo Essencial</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Exclusivo para o Plano Essencial (até 5 usuários). Teste completo sem cartão de crédito.</p>
                </li>
                <li className="space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Piloto Assistido corporativo</span>
                    <span className="text-indigo-700 font-mono">Enterprise</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Acompanhamento guiado com relatório de resultados e ROI final.</p>
                </li>
              </ul>
            </div>

            {/* Box 3: Pacotes de Volume Excedente (Notas IA) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Pacotes de Documentos Extra</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Suas operações não param se a franquia acabar. Adquira pacotes sem complicação:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex justify-between border-b border-slate-200 pb-1.5 font-mono">
                  <span>+100 notas</span>
                  <span className="font-bold text-slate-900">R$ 29 /mês</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-1.5 font-mono">
                  <span>+500 notas</span>
                  <span className="font-bold text-slate-900">R$ 99 /mês</span>
                </li>
                <li className="flex justify-between font-mono">
                  <span>+2.000+ notas</span>
                  <span className="font-bold text-indigo-700">Conforme negociação comercial</span>
                </li>
              </ul>
              <p className="text-[10px] text-slate-500 italic">
                Sem cobrança por tokens de API. A unidade comercial é simples: nota processada.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Social Proof & Corporate Testimonials */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest font-mono">Depoimentos Reais</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Aprovado por Quem Gerencia Equipes de Campo</h2>
            <p className="text-sm text-slate-600">Veja o impacto na rotina de gestores, controladores e profissionais em deslocamento de viagem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "Antes meus consultores perdiam o domingo digitando planilhas de reembolso. Agora fotografam a nota no restaurante e a aprovação chega para mim em segundos."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200" 
                  alt="Fernanda Vasconcelos" 
                  className="w-[50px] h-[50px] rounded-full object-cover border border-indigo-100 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Fernanda Vasconcelos</h4>
                  <p className="text-[10px] text-slate-500">Gerente de Operações Comercial</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "O rastreamento WORM com Hash SHA-256 trouxe total tranquilidade para a auditoria fiscal. Nossos relatórios exportados em Excel e PDF são 100% confiáveis."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200" 
                  alt="Marcelo Camargo" 
                  className="w-[50px] h-[50px] rounded-full object-cover border border-emerald-100 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Marcelo Camargo</h4>
                  <p className="text-[10px] text-slate-500">Diretor Financeiro & Compliance</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "O modo offline é o meu recurso favorito. Quando estou em viagens pelo interior sem sinal de celular, vou fotografando tudo e o app sincroniza assim que chego ao hotel."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200" 
                  alt="Thiago Siqueira" 
                  className="w-[50px] h-[50px] rounded-full object-cover border border-sky-100 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Thiago Siqueira</h4>
                  <p className="text-[10px] text-slate-500">Consultor Técnico de Campo</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest font-mono">Dúvidas Frequentes</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Tudo o que Você Precisa Saber</h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full text-left p-4 text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{item.q}</span>
                  </span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-200/80 leading-relaxed font-normal bg-white">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Badges Strip */}
      <section className="border-t border-slate-200 bg-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-600 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conformidade LGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Criptografia SHA-256</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Padrão Probatório WORM</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Infraestrutura Cloud / Firestore Realtime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border-t border-slate-200 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white">Pronto para transformar sua prestação de contas?</h2>
          <p className="text-[#f7f703] font-bold text-[17px] max-w-2xl mx-auto">
            Acesse o painel agora e comece a testar em ambiente totalmente funcional.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-[#00da92] hover:bg-[#00c080] font-extrabold text-sm px-8 py-4 rounded-xl shadow-xl transition-all flex items-center gap-2 hover:scale-105"
            >
              <span className="text-[#303030]">Acessar o Painel Agora</span>
              <ArrowRight className="w-5 h-5 text-[#1b1515]" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NotaDiária - Gestão de Despesas & Prestação de Contas Corporativas sem Digitação</p>
          <div className="flex items-center gap-4 font-semibold">
            <button
              onClick={() => {
                setLegalModalTab('privacy');
                setShowLegalModal(true);
              }}
              className="hover:text-[#16324F] transition-colors underline underline-offset-2"
            >
              Política de Privacidade
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => {
                setLegalModalTab('terms');
                setShowLegalModal(true);
              }}
              className="hover:text-[#16324F] transition-colors underline underline-offset-2"
            >
              Termos de Uso
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Documentos Legais */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />

      {/* Modal de Autenticação com Formato Horizontal Responsivo para Desktop */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-50 rounded-2xl max-w-4xl w-full p-2 relative shadow-2xl animate-in fade-in zoom-in duration-200 my-auto max-h-[92vh] overflow-y-auto border border-slate-200">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 p-2 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-xs font-bold z-30 transition-colors shadow-sm flex items-center gap-1"
            >
              <span>✕</span>
              <span className="hidden sm:inline">Fechar</span>
            </button>
            <AuthView 
              onSuccess={() => {
                setShowAuthModal(false);
                onSuccess();
              }} 
              onDemoSuccess={(demoUser, demoRole, demoName) => {
                setShowAuthModal(false);
                if (onDemoSuccess) onDemoSuccess(demoUser, demoRole, demoName);
              }}
              onSelectPlanAndPay={(planId) => {
                setShowAuthModal(false);
                setSelectedPlanForPayment(planId);
                setShowPaymentModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal do Gateway de Pagamento Multi-Provedor (Stripe, Asaas, Mercado Pago) */}
      <PaymentGatewayModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialPlanId={selectedPlanForPayment}
        onSuccessPayment={(result) => {
          // Open login or notify after success
          setShowAuthModal(true);
        }}
      />

    </div>
  );
};

