import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface PlanConfig {
  id: string; // e.g. 'essencial', 'profissional', 'corporativo'
  nome: string;
  badge: string;
  basePrice: number; // e.g. 99, 299, 899
  includedUsers: number; // e.g. 5, 20, 75
  extraUserCost: number; // e.g. 18, 15, 12
  documentsQuota: string; // e.g. "150 notas/mês", "800 notas/mês", "Customizado (2000+)"
  annualDiscountPct: number; // e.g. 15 for 15%
  active: boolean;
  features: string[];
  popular?: boolean;
}

export interface SimulatorConfig {
  // Pricing Simulator Rules
  essentialBasePrice: number;
  essentialIncludedUsers: number;
  essentialExtraUserCost: number;
  essentialQuota: string;

  proBasePrice: number;
  proIncludedUsers: number;
  proExtraUserCost: number;
  proQuota: string;

  corpBasePrice: number;
  corpIncludedUsers: number;
  corpExtraUserCost: number;
  corpQuota: string;

  annualDiscountPct: number; // 15%
  extraPack100Cost: number; // R$ 29
  extraPack500Cost: number; // R$ 99

  // ROI Calculator Rules
  minutesSavedPerReceipt: number; // 8 min
  hourlyCostR$: number; // R$ 65
}

export interface AdminAnalyticsData {
  mrr: number; // R$ 42.850
  arr: number; // R$ 514.200
  totalSubscribers: number; // 128
  churnRatePct: number; // 0.8%
  cacR$: number; // 420
  ltvR$: number; // 18400
  geminiAccuracyPct: number; // 98.6%
  totalProcessedValueR$: number; // 1840500
  planDistribution: {
    essencial: number;
    profissional: number;
    corporativo: number;
  };
  monthlyRevenueHistory: { mes: string; mrr: number; novosClientes: number }[];
  recentTransactions: {
    id: string;
    empresa: string;
    plano: string;
    valor: number;
    metodo: 'Pix' | 'Cartão' | 'Boleto';
    status: 'aprovado' | 'pendente' | 'falhado';
    data: string;
  }[];
  companyAccounts: {
    id: string;
    nome: string;
    plano: string;
    usuariosAtivos: number;
    mrrMensal: number;
    status: 'Ativa' | 'Degustação' | 'Inadimplente';
  }[];
}

export interface ResponsibilitiesConfig {
  // Quem tem permissão para aprovar e reprovar despesas
  approvalRoles: ('gestor' | 'financeiro' | 'admin' | 'auditor')[];
  // Cargo ou descrição do responsável pela aprovação (personalizável por empresa)
  approvalRoleTitle: string; // Ex: "Gestor Imediato", "Diretor Financeiro", "Auditoria Interna", "Controladoria"
  // Quem tem permissão para criar / lançar despesas e viagens
  creationRoles: ('funcionario' | 'gestor' | 'financeiro' | 'admin')[];
  // Quem tem permissão para exportar trilha probatória WORM, PDF e XLSX
  auditExportRoles: ('funcionario' | 'gestor' | 'financeiro' | 'admin')[];
  // Valor teto para aprovação com 1 aprovador (acima desse valor requer alçada superior/dupla aprovação)
  highValueThresholdR$: number; // Ex: 1000
  // Exigir dupla aprovação para valores acima do teto
  requireDualApprovalAboveThreshold: boolean;
  // Permitir autoaprovação caso o próprio aprovador lance uma despesa
  allowSelfApproval: boolean;
  // Notificar por e-mail quando uma despesa for submetida
  notifyOnSubmission: boolean;
}

export interface AdminFullConfig {
  plans: PlanConfig[];
  simulator: SimulatorConfig;
  analytics: AdminAnalyticsData;
  responsibilities: ResponsibilitiesConfig;
}

export const DEFAULT_RESPONSIBILITIES_CONFIG: ResponsibilitiesConfig = {
  approvalRoles: ['gestor', 'financeiro', 'admin'],
  approvalRoleTitle: 'Gestor Direto & Financeiro',
  creationRoles: ['funcionario', 'gestor', 'financeiro', 'admin'],
  auditExportRoles: ['gestor', 'financeiro', 'admin'],
  highValueThresholdR$: 1000,
  requireDualApprovalAboveThreshold: false,
  allowSelfApproval: false,
  notifyOnSubmission: true
};

export const DEFAULT_PLANS_CONFIG: PlanConfig[] = [
  {
    id: 'pessoal',
    nome: 'Plano pessoal (Pessoa física)',
    badge: 'Profissionais liberais e autônomos',
    basePrice: 75,
    includedUsers: 1,
    extraUserCost: 75,
    documentsQuota: '90 notas/mês',
    annualDiscountPct: 15,
    active: true,
    features: [
      'Usuários inclusos customizáveis',
      'Leitura avançada com IA Gemini',
      'Relatórios financeiros e exportação PDF/Excel'
    ]
  },
  {
    id: 'essencial',
    nome: 'Essencial',
    badge: 'Ideal para Pequenas Equipes',
    basePrice: 99,
    includedUsers: 5,
    extraUserCost: 18,
    documentsQuota: '150 notas/mês',
    annualDiscountPct: 15,
    active: true,
    features: [
      'Até 5 usuários inclusos no preço base',
      'Leitura de comprovantes com IA Gemini',
      'Exportação em Excel e PDF com Hash WORM',
      'Fila de aprovação de despesas com 1 toque',
      'Suporte via e-mail e chat em horário comercial'
    ]
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    badge: 'Mais Recomendado',
    basePrice: 299,
    includedUsers: 20,
    extraUserCost: 15,
    documentsQuota: '800 notas/mês',
    annualDiscountPct: 15,
    active: true,
    popular: true,
    features: [
      'Até 20 usuários inclusos no preço base',
      'Trilha de auditoria probatória WORM completa',
      'Alertas automatizados de compliance e duplicidade',
      'Relatórios e DRE de viagens em tempo real',
      'Suporte prioritário via WhatsApp e e-mail'
    ]
  },
  {
    id: 'corporativo',
    nome: 'Corporativo',
    badge: 'Para Operações de Grande Porte',
    basePrice: 899,
    includedUsers: 75,
    extraUserCost: 12,
    documentsQuota: 'Customizado (2000+)',
    annualDiscountPct: 15,
    active: true,
    features: [
      'Até 75 usuários inclusos no preço base',
      'Gerente de conta e onboarding dedicado',
      'Integração via API com ERPs corporativos',
      'Multi-CNPJ e parametrização de políticas avançadas',
      'SLA de suporte garantido em 2 horas'
    ]
  }
];

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  essentialBasePrice: 99,
  essentialIncludedUsers: 5,
  essentialExtraUserCost: 18,
  essentialQuota: '150 notas/mês',

  proBasePrice: 299,
  proIncludedUsers: 20,
  proExtraUserCost: 15,
  proQuota: '800 notas/mês',

  corpBasePrice: 899,
  corpIncludedUsers: 75,
  corpExtraUserCost: 12,
  corpQuota: 'Customizado (2000+)',

  annualDiscountPct: 15,
  extraPack100Cost: 29,
  extraPack500Cost: 99,

  minutesSavedPerReceipt: 8,
  hourlyCostR$: 65
};

export const DEFAULT_ANALYTICS_DATA: AdminAnalyticsData = {
  mrr: 42850,
  arr: 514200,
  totalSubscribers: 128,
  churnRatePct: 0.8,
  cacR$: 420,
  ltvR$: 18400,
  geminiAccuracyPct: 98.6,
  totalProcessedValueR$: 1840500,
  planDistribution: {
    essencial: 42,
    profissional: 68,
    corporativo: 18
  },
  monthlyRevenueHistory: [
    { mes: 'Jan', mrr: 28500, novosClientes: 8 },
    { mes: 'Fev', mrr: 31200, novosClientes: 11 },
    { mes: 'Mar', mrr: 33800, novosClientes: 9 },
    { mes: 'Abr', mrr: 36000, novosClientes: 12 },
    { mes: 'Mai', mrr: 38400, novosClientes: 10 },
    { mes: 'Jun', mrr: 40100, novosClientes: 8 },
    { mes: 'Jul', mrr: 41500, novosClientes: 9 },
    { mes: 'Ago', mrr: 42850, novosClientes: 14 }
  ],
  recentTransactions: [
    {
      id: 'tx_8932',
      empresa: 'Logística Alfa Brasil',
      plano: 'Profissional (Anual)',
      valor: 6018,
      metodo: 'Pix',
      status: 'aprovado',
      data: '2026-08-11 10:14'
    },
    {
      id: 'tx_8931',
      empresa: 'TechCorp Soluções',
      plano: 'Corporativo (Mensal)',
      valor: 899,
      metodo: 'Cartão',
      status: 'aprovado',
      data: '2026-08-11 09:45'
    },
    {
      id: 'tx_8930',
      empresa: 'Consultoria Vanguarda',
      plano: 'Essencial (Mensal)',
      valor: 99,
      metodo: 'Cartão',
      status: 'aprovado',
      data: '2026-08-10 18:20'
    },
    {
      id: 'tx_8929',
      empresa: 'Engenharia Solar Ltda',
      plano: 'Profissional (Mensal)',
      valor: 299,
      metodo: 'Boleto',
      status: 'pendente',
      data: '2026-08-10 16:05'
    },
    {
      id: 'tx_8928',
      empresa: 'Distribuidora Horizonte',
      plano: 'Corporativo (Anual)',
      valor: 9170,
      metodo: 'Pix',
      status: 'aprovado',
      data: '2026-08-10 14:12'
    }
  ],
  companyAccounts: [
    { id: 'emp_1', nome: 'Logística Alfa Brasil', plano: 'Profissional', usuariosAtivos: 24, mrrMensal: 359, status: 'Ativa' },
    { id: 'emp_2', nome: 'TechCorp Soluções', plano: 'Corporativo', usuariosAtivos: 82, mrrMensal: 983, status: 'Ativa' },
    { id: 'emp_3', nome: 'Consultoria Vanguarda', plano: 'Essencial', usuariosAtivos: 4, mrrMensal: 99, status: 'Ativa' },
    { id: 'emp_4', nome: 'Engenharia Solar Ltda', plano: 'Profissional', usuariosAtivos: 18, mrrMensal: 299, status: 'Degustação' },
    { id: 'emp_5', nome: 'Distribuidora Horizonte', plano: 'Corporativo', usuariosAtivos: 110, mrrMensal: 1319, status: 'Ativa' },
    { id: 'emp_6', nome: 'Farmacêutica Viva', plano: 'Profissional', usuariosAtivos: 31, mrrMensal: 464, status: 'Ativa' }
  ]
};

const LOCAL_STORAGE_KEY = 'notadiaria_admin_config_v1';

export function getInitialAdminConfig(): AdminFullConfig {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const loadedPlans: PlanConfig[] = Array.isArray(parsed.plans) ? parsed.plans : DEFAULT_PLANS_CONFIG;

      return {
        plans: loadedPlans,
        simulator: { ...DEFAULT_SIMULATOR_CONFIG, ...(parsed.simulator || {}) },
        analytics: { ...DEFAULT_ANALYTICS_DATA, ...(parsed.analytics || {}) },
        responsibilities: { ...DEFAULT_RESPONSIBILITIES_CONFIG, ...(parsed.responsibilities || {}) }
      };
    }
  } catch (e) {
    console.warn('Erro ao carregar admin_config do localStorage:', e);
  }
  return {
    plans: DEFAULT_PLANS_CONFIG,
    simulator: DEFAULT_SIMULATOR_CONFIG,
    analytics: DEFAULT_ANALYTICS_DATA,
    responsibilities: DEFAULT_RESPONSIBILITIES_CONFIG
  };
}

export async function saveAdminConfigToDb(config: AdminFullConfig): Promise<void> {
  try {
    // Save to LocalStorage immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));

    // Dispatch custom event for immediate in-tab reactive updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notadiaria_admin_config_updated', { detail: config }));
    }

    // Save to Firestore
    const configDocRef = doc(db, 'configuracoes', 'admin_config');
    await setDoc(configDocRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erro ao salvar admin_config no Firestore:', err);
  }
}

export function subscribeToAdminConfig(callback: (config: AdminFullConfig) => void): () => void {
  const localConfig = getInitialAdminConfig();
  callback(localConfig);

  const handleCustomEvent = (e: Event) => {
    const customEvt = e as CustomEvent<AdminFullConfig>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('notadiaria_admin_config_updated', handleCustomEvent);
  }

  let unsubscribeFirestore: (() => void) | undefined;

  try {
    const configDocRef = doc(db, 'configuracoes', 'admin_config');
    unsubscribeFirestore = onSnapshot(configDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const loadedPlans: PlanConfig[] = Array.isArray(data.plans) ? data.plans : DEFAULT_PLANS_CONFIG;

        const fullConfig: AdminFullConfig = {
          plans: loadedPlans,
          simulator: { ...DEFAULT_SIMULATOR_CONFIG, ...(data.simulator || {}) },
          analytics: { ...DEFAULT_ANALYTICS_DATA, ...(data.analytics || {}) },
          responsibilities: { ...DEFAULT_RESPONSIBILITIES_CONFIG, ...(data.responsibilities || {}) }
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fullConfig));
        callback(fullConfig);
      }
    }, (err) => {
      console.warn('Snapshot listener de admin_config usará cache local:', err.message);
    });
  } catch (err) {
    console.warn('Falha no listener Firestore de admin_config, usando apenas localStorage:', err);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('notadiaria_admin_config_updated', handleCustomEvent);
    }
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}
