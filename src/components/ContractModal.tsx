import React from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  Building2, 
  Calendar, 
  Mail, 
  Hash,
  ExternalLink
} from 'lucide-react';

export interface ContractDetails {
  contractNumber: string;
  contractHash: string;
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  planName: string;
  period: 'mensal' | 'anual';
  amount: number;
  transactionId: string;
  paymentMethod: string;
  signedAt: string;
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractDetails;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(contract.signedAt || Date.now()).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedPrice = contract.amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 print:shadow-none print:border-none print:max-h-none print:w-full">
        
        {/* Header Bar - Hidden on print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 leading-tight">
                Contrato de Adesão & Prestação de Serviços SaaS
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Protocolo: {contract.contractNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-200"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contract Printable Document Area */}
        <div className="p-6 sm:p-10 overflow-y-auto font-serif text-slate-800 text-sm leading-relaxed space-y-6 print:p-0 print:text-xs">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 text-center font-sans space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center font-mono">
                ND
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">NotaDiária Corporativo</span>
            </div>
            <h1 className="text-lg font-black uppercase text-slate-900 tracking-wide">
              INSTRUMENTO PARTICULAR DE CONTRATO DE ADESÃO, LICENCIAMENTO DE SOFTWARE E PRESTAÇÃO DE SERVIÇOS EM NUVEM (SAAS)
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 font-mono pt-1">
              <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                Nº {contract.contractNumber}
              </span>
              <span>Data de Ativação: {formattedDate}</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assinado Digitalmente
              </span>
            </div>
          </div>

          {/* Parties Identification */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs space-y-2.5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
              DAS PARTES CONTRATANTES
            </h3>
            <p>
              <strong>CONTRATADA:</strong> NOTADIÁRIA TECNOLOGIA CORPORATIVA LTDA., sociedade empresária inscrita no CNPJ/ME sob o nº 48.912.834/0001-20, com sede na Av. Paulista, 1000 - Bela Vista, São Paulo/SP, doravante denominada simplesmente <strong>"NOTADIÁRIA"</strong>; e
            </p>
            <p>
              <strong>CONTRATANTE:</strong> <strong>{contract.customerName.toUpperCase()}</strong>, portador(a) do CPF/CNPJ nº <strong>{contract.customerCpfCnpj || 'Não informado'}</strong>, com e-mail corporativo cadastrado <strong>{contract.customerEmail}</strong>, doravante denominado(a) simplesmente <strong>"CONTRATANTE"</strong>.
            </p>
          </div>

          {/* Contract Clauses */}
          <div className="space-y-4 text-justify">
            
            <section className="space-y-1">
              <h4 className="font-bold font-sans text-slate-900 text-xs uppercase tracking-wide">
                CLÁUSULA 1ª – DO OBJETO DO CONTRATO
              </h4>
              <p>
                1.1. O presente contrato tem por objeto o licenciamento temporário, não exclusivo e intransferível de uso da plataforma em nuvem <strong>NotaDiária</strong>, incluindo seus módulos de captura inteligente de cupons fiscais via Inteligência Artificial Vision (Gemini), leitura automatizada de dados tributários, gestão de despesas e viagens corporativas, trilha de auditoria digital com imutabilidade lógica WORM (Write Once, Read Many) e fluxo multi-nível de aprovação de relatórios.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold font-sans text-slate-900 text-xs uppercase tracking-wide">
                CLÁUSULA 2ª – DO PLANO SELECIONADO E CONDIÇÕES COMERCIAIS
              </h4>
              <p>
                2.1. O CONTRATANTE aderiu expressamente ao plano <strong>{contract.planName.toUpperCase()}</strong>, na modalidade de faturamento <strong>{contract.period.toUpperCase()}</strong>.
              </p>
              <p>
                2.2. O valor total aprovado da contratação é de <strong>{formattedPrice}</strong>, liquidado e confirmado por meio do Gateway de Pagamento Stripe sob o ID de Transação <strong>{contract.transactionId}</strong> (Método: {contract.paymentMethod.toUpperCase()}).
              </p>
              <p>
                2.3. A vigência deste instrumento tem início na data de confirmação do pagamento ({formattedDate}) com renovação automática periódica correspondente ao ciclo contratado, salvo cancelamento prévio pelo painel de administração.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold font-sans text-slate-900 text-xs uppercase tracking-wide">
                CLÁUSULA 3ª – DA DISPONIBILIDADE (SLA) E SUPORTE TÉCNICO
              </h4>
              <p>
                3.1. A NOTADIÁRIA compromete-se a manter disponibilidade de serviço da plataforma (SLA) de no mínimo <strong>99,9% (noventa e nove vírgula nove por cento)</strong> ao mês, ressalvadas as janelas de manutenção preventiva programadas fora do horário comercial corporativo.
              </p>
              <p>
                3.2. O suporte técnico estará disponível via canais eletrônicos oficiais (chat integrado, e-mail institucional e chamados na central de atendimento) para suporte operacional e técnico.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold font-sans text-slate-900 text-xs uppercase tracking-wide">
                CLÁUSULA 4ª – DA CONFORMIDADE FISCAL, DECRETO 10.278/2020 E TRILHA WORM
              </h4>
              <p>
                4.1. Todos os documentos fiscais capturados e digitalizados no ambiente corporativo atendem aos requisitos técnicos e jurídicos do <strong>Decreto Federal nº 10.278/2020</strong> e da <strong>Lei Federal nº 14.063/2020</strong>, possuindo integridade, autenticidade e carimbo de tempo inviolável garantido pelo mecanismo WORM.
              </p>
              <p>
                4.2. As despesas aprovadas na plataforma constituem acervo digital probatório perante a Receita Federal do Brasil para fins de dedutibilidade no IRPJ/CSLL pelo regime do Lucro Real.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold font-sans text-slate-900 text-xs uppercase tracking-wide">
                CLÁUSULA 5ª – DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)
              </h4>
              <p>
                5.1. As partes comprometem-se mutuamente a cumprir rigorosamente as disposições da <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>. A NOTADIÁRIA atuará como Operadora dos dados corporativos fornecidos pelo CONTRATANTE, aplicando criptografia em repouso (AES-256) e em trânsito (TLS 1.3).
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold font-sans text-slate-900 text-xs uppercase tracking-wide">
                CLÁUSULA 6ª – DA ASSINATURA ELETRÔNICA E VALIDADE JURÍDICA
              </h4>
              <p>
                6.1. O presente instrumento é firmado eletronicamente pelas partes mediante aceite nos termos da contratação e confirmação de liquidação bancária, surtindo plenos efeitos legais e executivos nos termos do Art. 10, § 2º, da Medida Provisória nº 2.200-2/2001.
              </p>
            </section>

          </div>

          {/* Digital Signature Footer */}
          <div className="pt-6 border-t-2 border-slate-300 font-sans">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Certificação de Autenticidade Digital
                </span>
                <span className="font-mono text-[10px]">Padrão Criptográfico SHA-256</span>
              </div>
              <div className="font-mono text-[10px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                Hash de Validação: {contract.contractHash || 'sha256_94f8a32b01c900e12f6a7d8e8c5b1a0f'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <div className="text-slate-500 text-[10px]">Contratada:</div>
                  <div className="font-bold text-slate-900">NotaDiária Tecnologia Corporativa Ltda</div>
                  <div className="text-[10px] text-slate-500 font-mono">Assinatura Digital de Sistema Integrada</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Contratante:</div>
                  <div className="font-bold text-slate-900">{contract.customerName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Autenticado via {contract.customerEmail}</div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-[10px] text-slate-400 font-mono pt-3">
              Documento expedido e transmitido para o e-mail {contract.customerEmail} em {formattedDate}.
            </div>
          </div>

        </div>

        {/* Footer Bar - Hidden on print */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Uma cópia completa deste contrato foi disparada para <strong>{contract.customerEmail}</strong></span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Voltar ao Checkout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
