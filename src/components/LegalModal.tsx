import React, { useState } from 'react';
import { ShieldCheck, FileText, X, Check, Copy, Download, Building2, Lock, Scale, Eye } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, defaultTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = activeTab === 'privacy' ? privacyPolicyContent : termsOfUseContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = activeTab === 'privacy' ? privacyPolicyContent : termsOfUseContent;
    const filename = activeTab === 'privacy' ? 'politica-de-privacidade-notadiaria.txt' : 'termos-de-uso-notadiaria.txt';
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Modal */}
        <div className="bg-[#16324F] px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#35E08C]/10 border border-[#35E08C]/20 text-[#35E08C]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight">Documentos Legais — NotaDiária</h2>
              <p className="text-xs text-slate-300">Em conformidade com a LGPD e Diretrizes da Google Play Store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-bold flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        {/* Tab Selection & Actions */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'privacy'
                  ? 'bg-[#16324F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#35E08C]" />
              <span>Política de Privacidade</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'terms'
                  ? 'bg-[#16324F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
              }`}
            >
              <FileText className="w-4 h-4 text-[#35E08C]" />
              <span>Termos de Uso</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Copiar texto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Baixar arquivo TXT"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar TXT</span>
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed max-h-[65vh]">
          {activeTab === 'privacy' ? (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-[#35E08C]/20 text-[#16324F] px-2.5 py-1 rounded-md">
                  Última Atualização: 07 de Agosto de 2026
                </span>
                <h1 className="text-xl font-extrabold text-[#16324F] mt-3">
                  POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  NotaDiária Tecnologia e Soluções Corporativas Ltda. — CNPJ / Plataforma SaaS
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#35E08C]" /> 1. Introdução e Compromisso
                </h3>
                <p>
                  A presente Política de Privacidade descreve como a plataforma <strong>NotaDiária</strong> (disponível via web e aplicativo móvel) coleta, utiliza, armazena, compartilha e protege as informações pessoais de seus usuários, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e com os requisitos do Google Play Developer Distribution Agreement.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#35E08C]" /> 2. Dados Coletados e Permissões Solicitadas
                </h3>
                <p>Para o funcionamento das funcionalidades corporativas do NotaDiária, coletamos e processamos os seguintes dados:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li><strong>Dados de Cadastro e Autenticação:</strong> Nome completo, endereço de e-mail corporativo, foto de perfil, cargo/função e identificador único de usuário (Firebase Auth UID).</li>
                  <li><strong>Captura de Imagens de Comprovantes (Câmera do Dispositivo):</strong> Imagens de recibos, notas fiscais (NFC-e, NF-e), cupons de abastecimento e recibos de alimentação/hospedagem capturados pelo usuário.</li>
                  <li><strong>Dados Fiscais e Financeiros Extraídos:</strong> Valor da despesa, data/hora, CNPJ do estabelecimento emissor, razão social, endereço do estabelecimento, itens discriminados e forma de pagamento.</li>
                  <li><strong>Dados de Viagens e Prestação de Contas:</strong> Destino, período da viagem, objetivo corporativo, adiantamentos e relatórios de prestação de contas associados.</li>
                  <li><strong>Logs de Auditoria e Conformidade:</strong> Registros automatizados de envio, aprovação, reprovação ou ajuste de despesas para atendimento às regras de compliance corporativo.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#35E08C]" /> 3. Finalidade do Tratamento
                </h3>
                <p>A coleta e o tratamento dos dados possuem como finalidades exclusivas:</p>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-600">
                  <li>Automação de leitura de comprovantes fiscais via Inteligência Artificial e OCR (Reconhecimento Óptico de Caracteres).</li>
                  <li>Sincronização do relatório de reembolso entre o colaborador e a equipe financeira/gestora da empresa contratante.</li>
                  <li>Prevenção de fraudes, duplicidade de notas e auditoria de conformidade com políticas de reembolsos.</li>
                  <li>Comunicação sobre o status de aprovação de despesas e atualizações do serviço.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">4. Uso da Câmera e Armazenamento do Dispositivo (Android/iOS)</h3>
                <p className="text-xs text-slate-600">
                  O aplicativo solicita permissão de acesso à <strong>Câmera</strong> e à <strong>Galeria de Fotos</strong> do dispositivo unicamente no momento em que o usuário opta por fotografar ou anexar um recibo fiscal. Nenhuma outra imagem da galeria ou acesso continuo à câmera é realizado sem ação direta do usuário.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">5. Compartilhamento de Dados com Terceiros</h3>
                <p className="text-xs text-slate-600">
                  O NotaDiária não vende nem comercializa dados pessoais. O compartilhamento ocorre estritamente com:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                  <li><strong>A Empresa Empregadora / Contratante:</strong> Gestores e auditores financeiros autorizados pela empresa à qual a conta do usuário está vinculada.</li>
                  <li><strong>Infraestrutura e Provedores de Nuvem:</strong> Google Cloud Platform e Firebase (para armazenamento seguro de banco de dados criptografado e autenticação) e serviço de Inteligência Artificial Google Gemini (para análise e parsing dos comprovantes).</li>
                  <li><strong>Processadores de Pagamentos:</strong> Stripe, Asaas ou Mercado Pago para faturamento de assinaturas corporativas.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">6. Armazenamento, Criptografia e Segurança</h3>
                <p className="text-xs text-slate-600">
                  Todas as comunicações entre o aplicativo e os servidores ocorrem via protocolo seguro HTTPS/TLS com criptografia SSL de 256 bits. O banco de dados em nuvem utiliza controle de acesso por regra de segurança (Firestore Security Rules) e autenticação segura.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">7. Seus Direitos (LGPD) e Exclusão de Conta/Dados</h3>
                <p className="text-xs text-slate-600">
                  Nos termos do art. 18 da LGPD, o titular dos dados tem o direito de solicitar a confirmação, acesso, correção, anonimização, bloqueio ou eliminação de seus dados pessoais.
                </p>
                <p className="text-xs text-slate-600">
                  Para solicitar a exclusão definitiva de sua conta ou dados pessoais armazenados, o usuário ou o administrador da empresa pode enviar uma solicitação diretamente para o e-mail: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[#16324F] font-bold">notadiariapp@gmail.com</span>. O pedido será processado no prazo legal de até 15 dias uteis, ressalvadas as obrigações legais de retenção fiscal e contábil pela empresa empregadora.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">8. Contato do Encarregado de Proteção de Dados (DPO)</h3>
                <p className="text-xs text-slate-600">
                  Dúvidas relacionadas a esta Política de Privacidade ou ao tratamento de dados pessoais podem ser encaminhadas para o Encarregado de Proteção de Dados através do e-mail: <strong className="text-[#16324F]">notadiariapp@gmail.com</strong>.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-[#35E08C]/20 text-[#16324F] px-2.5 py-1 rounded-md">
                  Versão 2.4 — Vigor a partir de Agosto de 2026
                </span>
                <h1 className="text-xl font-extrabold text-[#16324F] mt-3">
                  TERMOS DE USO E PRESTAÇÃO DE SERVIÇOS SAAS
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  NotaDiária - Gestão Inteligente de Despesas e Prestação de Contas
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">1. Objeto e Aceitação dos Termos</h3>
                <p>
                  Estes Termos de Uso regem a utilização da plataforma <strong>NotaDiária</strong> por empresas contratantes, colaboradores e usuários individuais. Ao acessar, cadastrar-se ou utilizar qualquer funcionalidade do NotaDiária, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com a nossa Política de Privacidade.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">2. Descrição da Plataforma</h3>
                <p className="text-xs text-slate-600">
                  O NotaDiária é uma solução de software como serviço (SaaS B2B) destinada à automação do processo de prestação de contas corporativas, reembolso de viagens, captura e digitalização de comprovantes fiscais com leitura via inteligência artificial, classificação de despesas e conciliação financeira.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">3. Cadastro, Contas e Acesso</h3>
                <p className="text-xs text-slate-600">
                  O acesso à plataforma exige a criação de uma conta com e-mail corporativo válido e senha pessoal ou login seguro via Google. O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso. O NotaDiária não se responsabiliza por acessos não autorizados decorrentes do compartilhamento indevido de credenciais pelo usuário.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">4. Veracidade das Informações e Lançamentos de Despesas</h3>
                <p className="text-xs text-slate-600">
                  O usuário declara ser o único responsável pela veracidade, exatidão e legitimidade das imagens de comprovantes fiscais e valores informados na plataforma. A tentativa de inclusão de comprovantes adulterados, falsificados ou duplicados sujeitará o usuário às sanções administrativas da empresa contratante e às penalidades da lei penal e civil cabíveis.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">5. Planos de Assinatura, Faturamento e Cancelamento</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li><strong>Planos Corporativos:</strong> A utilização dos planos pagos é contratada mediante assinatura mensal ou anual com cobrança por número de usuários ou volume de comprovantes processados.</li>
                  <li><strong>Renovação e Faturamento:</strong> As assinaturas são renovadas automaticamente no final do período contratado, salvo cancelamento prévio de pelo menos 7 dias antes do vencimento.</li>
                  <li><strong>Inadimplência:</strong> O atraso no pagamento da assinatura superior a 15 dias poderá acarretar a suspensão temporária do acesso do painel de gestão corporativa.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">6. Propriedade Intelectual</h3>
                <p className="text-xs text-slate-600">
                  Todos os direitos de propriedade intelectual sobre o software NotaDiária, incluindo código-fonte, marcas, logotipos, layouts, interfaces e algoritmos de IA, pertencem exclusivamente à NotaDiária Tecnologia Ltda. É expressamente vedado copiar, modificar, fazer engenharia reversa ou sublicenciar a plataforma sem autorização formal por escrito.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">7. Limitação de Responsabilidade e Disponibilidade (SLA)</h3>
                <p className="text-xs text-slate-600">
                  Buscamos manter o serviço disponível 24/7 com índice de disponibilidade superior a 99,5%. Todavia, o NotaDiária não se responsabiliza por falhas decorrentes de interrupções de conexão à internet do usuário, indisponibilidade temporária de serviços de terceiros (como servidores de e-mail ou bancos) ou eventos de força maior.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#16324F]">8. Legislação Aplicável e Foro</h3>
                <p className="text-xs text-slate-600">
                  Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o Foro da Comarca da Capital do Estado de São Paulo para dirimir quaisquer controvérsias oriundas destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Dúvidas? Entre em contato pelo e-mail <strong className="text-[#16324F]">notadiariapp@gmail.com</strong>
          </p>
          <button
            onClick={onClose}
            className="bg-[#16324F] hover:bg-[#0E2338] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs"
          >
            Compreendi e Aceito
          </button>
        </div>

      </div>
    </div>
  );
};

const privacyPolicyContent = `POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD) — NOTADIÁRIA
Última Atualização: 07 de Agosto de 2026

1. INTRODUÇÃO E COMPROMISSO
A presente Política de Privacidade descreve como a plataforma NotaDiária coleta, utiliza, armazena, compartilha e protege as informações pessoais de seus usuários, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e com as diretrizes do Google Play.

2. DADOS COLETADOS E PERMISSÕES
- Dados de Cadastro: Nome, e-mail corporativo, cargo, foto de perfil.
- Câmera e Galeria: Imagens de comprovantes fiscais (NFC-e, NF-e, recibos) capturados para envio de despesas.
- Dados Fiscais Extraídos: Valor, data, CNPJ e itens do comprovante.
- Registros de Dispositivo: Logs de auditoria, IP, versão do app e timestamp de acessos.

3. FINALIDADE DO TRATAMENTO
- Leitura automatizada OCR/IA de recibos para prestação de contas.
- Envio e fluxo de aprovação de despesas de viagem para a equipe financeira.
- Auditoria de compliance e prevenção de erros/duplicações.

4. COMPARTILHAMENTO DE DADOS
Os dados não são vendidos. Compartilhamos estritamente com:
- A Empresa empregadora contratante responsável pela aprovação da despesa.
- Infraestrutura Google Cloud / Firebase (armazenamento criptografado) e Google Gemini (IA).
- Processadores de pagamento (Stripe/Asaas/Mercado Pago).

5. SEGURANÇA E ARMAZENAMENTO
Todas as comunicações utilizam criptografia SSL/TLS (HTTPS). Os dados são mantidos em servidores de alta segurança com controle estrito de acesso.

6. DIREITOS DO TITULAR E EXCLUSÃO DE DADOS
O usuário pode solicitar a confirmação, correção ou exclusão de seus dados a qualquer momento enviando um e-mail para: notadiariapp@gmail.com.

Contato DPO: notadiariapp@gmail.com`;

const termsOfUseContent = `TERMOS DE USO E PRESTAÇÃO DE SERVIÇOS SAAS — NOTADIÁRIA
Versão 2.4 — Vigor a partir de Agosto de 2026

1. ACEITAÇÃO DOS TERMOS
Ao utilizar a plataforma NotaDiária, você aceita estes Termos de Uso e a Política de Privacidade.

2. DESCRIÇÃO DO SERVIÇO
O NotaDiária é uma plataforma SaaS corporativa para gestão de despesas de viagens, captura de comprovantes por IA e prestação de contas.

3. RESPONSABILIDADE PELOS LANÇAMENTOS
O usuário é o único responsável pela exatidão e legitimidade das imagens e dados de recibos lançados na plataforma.

4. ASSINATURAS E CANCELAMENTO
As assinaturas corporativas são renovadas automaticamente conforme o plano contratado. O cancelamento pode ser efetuado antes da renovação.

5. PROPRIEDADE INTELECTUAL
Todos os direitos de software, marcas e algoritmos pertencem exclusivamente à NotaDiária Tecnologia Ltda.

6. FORO
Fica eleito o Foro da Comarca de São Paulo/SP para dirimir controvérsias.`;
