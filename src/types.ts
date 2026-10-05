export type UserRole = 'funcionario' | 'gestor' | 'financeiro' | 'admin';

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  empresa_id: string;
  perfil: UserRole;
  cargo?: string;
  avatarUrl?: string;
}

export interface Empresa {
  id: string;
  nome: string;
  logo?: string;
  politicas: string[];
  tetos: Record<string, number>; // e.g. { Alimentação: 120, Hospedagem: 450, Transporte: 200 }
}

export type ViagemStatus = 'em_andamento' | 'enviada' | 'aprovada' | 'rejeitada';

export interface Viagem {
  id: string;
  usuario_id: string;
  usuario_nome?: string;
  cliente: string;
  projeto: string;
  data_inicio: string;
  data_fim: string;
  status: ViagemStatus;
  total_gastos?: number;
  createdAt?: string;
}

export type ComplianceStatus = 'essencial' | 'condicional' | 'vetada';
export type ApprovalStatus = 'pendente' | 'aprovado' | 'rejeitado';

export interface ReceiptItem {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface Despesa {
  id: string;
  viagem_id: string;
  usuario_id: string;
  usuario_nome?: string;
  data: string;
  hora: string;
  cnpj: string;
  razao_social?: string;
  empresa: string;
  categoria: string;
  valor: number;
  status_aprovacao: ApprovalStatus;
  comprovante_url: string;
  hash: string; // SHA-256
  compliance: ComplianceStatus;
  red_flags: string[];
  itens: ReceiptItem[];
  pagamento: string;
  chave_nfce?: string;
  protocolo_sefaz?: string;
  sefaz_url?: string;
  justificativa_rejeicao?: string;
  localizacao?: string;
  confidence_score?: number;
  primeira_aprovacao_por?: string;
  primeira_aprovacao_em?: string;
  segunda_aprovacao_por?: string;
  segunda_aprovacao_em?: string;
  status_alcada?: 'pendente' | 'aguardando_segunda_aprovacao' | 'aprovado';
  createdAt?: string;
}

export interface AuditoriaLog {
  id: string;
  usuario: string;
  usuario_id: string;
  acao: string;
  timestamp: string;
  origem: string;
  despesa_id?: string;
  detalhes?: string;
}

// Payment Gateway Types
export type PaymentProvider = 'stripe' | 'asaas' | 'mercadopago';
export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';
export type PlanTier = 'pessoal' | 'starter' | 'essencial' | 'profissional' | 'enterprise' | 'corporativo' | string;

export interface PlanDetails {
  id: PlanTier;
  nome: string;
  precoMensal: number;
  maxUsuarios: number;
  descontoAnualPercentage: number;
  features: string[];
}

export interface PaymentTransactionRequest {
  provider: PaymentProvider;
  method: PaymentMethod;
  planId: PlanTier;
  period: 'mensal' | 'anual';
  customerInfo: {
    nome: string;
    email: string;
    cpfCnpj: string;
    telefone?: string;
  };
  cardDetails?: {
    number: string;
    holderName: string;
    expiry: string;
    cvv: string;
  };
}

export interface PaymentTransactionResult {
  transactionId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: 'approved' | 'pending_pix' | 'pending_boleto' | 'failed';
  amount: number;
  currency: string;
  planId: PlanTier;
  period: 'mensal' | 'anual';
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  pixExpiresAt?: string;
  boletoBarcode?: string;
  boletoPdfUrl?: string;
  receiptUrl?: string;
  createdAt: string;
  message?: string;
  contractNumber?: string;
  contractHash?: string;
  contractDispatched?: boolean;
  contractDispatchedTo?: string;
  contractDispatchedAt?: string;
  customerName?: string;
}

export interface GatewayProviderConfig {
  provider: PaymentProvider;
  nome: string;
  status: 'active' | 'configured' | 'test_mode';
  supportedMethods: PaymentMethod[];
  currencySupported: string[];
  publicKey?: string;
  hasSecretKey: boolean;
  description: string;
  badgeText: string;
}
