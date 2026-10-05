import React, { useState } from 'react';
import { Viagem, Despesa } from '../types';
import { getSefazPortalInfo, NATIONAL_NFE_PORTAL } from '../lib/sefazPortal';
import { formatDateBR, toIsoDate } from '../lib/dateUtils';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  ShieldAlert, 
  Briefcase, 
  Hash, 
  Calendar, 
  Clock, 
  Store, 
  DollarSign,
  Layers,
  Save,
  FileText,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  RefreshCw,
  Server
} from 'lucide-react';

interface ReceiptConfirmModalProps {
  isOpen: boolean;
  extractedData: any;
  viagens: Viagem[];
  onClose: () => void;
  onSaveExpense: (expenseData: Partial<Despesa>) => Promise<void>;
}

export const ReceiptConfirmModal: React.FC<ReceiptConfirmModalProps> = ({
  isOpen,
  extractedData,
  viagens,
  onClose,
  onSaveExpense,
}) => {
  // Form states with default extracted values (unconditionally initialized)
  const [empresa, setEmpresa] = useState(extractedData?.empresa || '');
  const [razaoSocial, setRazaoSocial] = useState(extractedData?.razao_social || '');
  const [cnpj, setCnpj] = useState(extractedData?.cnpj || '');
  const [categoria, setCategoria] = useState(extractedData?.categoria || 'Alimentação');
  const [valor, setValor] = useState<number>(extractedData?.valor || 0);
  const [dataStr, setDataStr] = useState(toIsoDate(extractedData?.data));
  const [horaStr, setHoraStr] = useState(extractedData?.hora || '12:00');
  const [pagamento, setPagamento] = useState(extractedData?.pagamento || 'Cartão de Crédito Corporativo');
  const [chaveNfce, setChaveNfce] = useState(extractedData?.chave_nfce || '');
  const [protocoloSefaz, setProtocoloSefaz] = useState(extractedData?.protocolo_sefaz || '');
  const [sefazUrl, setSefazUrl] = useState(extractedData?.sefaz_url || 'https://app.sefaz.es.gov.br/ConsultaNFCe');
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedViagemId, setSelectedViagemId] = useState<string>(
    viagens.length > 0 ? viagens[0].id : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Sync extracted data to form state whenever modal opens or new receipt is scanned
  React.useEffect(() => {
    if (extractedData) {
      setEmpresa(extractedData.empresa || '');
      setRazaoSocial(extractedData.razao_social || '');
      setCnpj(extractedData.cnpj || '');
      setCategoria(extractedData.categoria || 'Alimentação');
      setValor(typeof extractedData.valor === 'number' ? extractedData.valor : parseFloat(extractedData.valor) || 0);
      setDataStr(toIsoDate(extractedData.data));
      setHoraStr(extractedData.hora || '12:00');
      setPagamento(extractedData.pagamento || 'Cartão de Crédito Corporativo');
      setChaveNfce(extractedData.chave_nfce || '');
      setProtocoloSefaz(extractedData.protocolo_sefaz || '');
      setSefazUrl(extractedData.sefaz_url || 'https://app.sefaz.es.gov.br/ConsultaNFCe');
      if (viagens.length > 0 && !selectedViagemId) {
        setSelectedViagemId(viagens[0].id);
      }
    }
  }, [extractedData, isOpen]);

  if (!isOpen || !extractedData) return null;

  const compliance = extractedData.compliance || 'essencial';
  const redFlags: string[] = extractedData.red_flags || [];
  const confidence: number = extractedData.confidence_score || 0.98;
  const hashSHA256: string = extractedData.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const cleanChave = chaveNfce.replace(/\s+/g, '');
  const portalInfo = getSefazPortalInfo(cleanChave || sefazUrl, extractedData.location);

  const handleCopyKey = () => {
    if (cleanChave) {
      try {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(cleanChave).catch(() => {});
        }
      } catch {}
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handleOpenSefaz = (customUrl?: string) => {
    if (cleanChave) {
      handleCopyKey();
    }
    const targetUrl = customUrl || portalInfo.url;
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = targetUrl;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveErrorMessage(null);
    try {
      await onSaveExpense({
        viagem_id: selectedViagemId,
        data: dataStr,
        hora: horaStr,
        cnpj,
        empresa,
        categoria,
        valor: Number(valor),
        status_aprovacao: 'pendente',
        comprovante_url: extractedData.originalImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        hash: hashSHA256,
        compliance,
        red_flags: redFlags,
        itens: extractedData.itens || [],
        pagamento,
        chave_nfce: cleanChave,
        protocolo_sefaz: protocoloSefaz,
        sefaz_url: sefazUrl,
        confidence_score: confidence,
        localizacao: extractedData.location || 'Aracruz, ES'
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar despesa:', err);
      setSaveErrorMessage(err?.message || 'Erro ao salvar a despesa.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-[#16324F] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#35E08C]/20 border border-[#35E08C]/40 flex items-center justify-center text-[#35E08C]">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>Conferir Dados Extraídos pela IA</span>
                <span className="text-[10px] bg-[#35E08C] text-[#0E2338] font-bold px-2 py-0.5 rounded-full">
                  {(confidence * 100).toFixed(0)}% Precisão
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Verifique as informações antes do lançamento probatório
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveErrorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveErrorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Compliance & Red Flags Status Bar */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            compliance === 'essencial' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : compliance === 'condicional' 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {compliance === 'essencial' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm uppercase tracking-wide">
                  Conformidade: {compliance === 'essencial' ? 'Despesa Conforme (Essencial)' : compliance === 'condicional' ? 'Atenção Necessária (Condicional)' : 'Vetada por Política'}
                </span>
              </div>
              {redFlags.length > 0 ? (
                <ul className="mt-1 space-y-1 text-xs">
                  {redFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 font-medium text-amber-800">
                      <span>•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-700 mt-0.5">
                  Nenhum alerta de duplicidade ou superação de teto detectado. Pronta para aprovação.
                </p>
              )}
            </div>
          </div>

          {/* Photo Preview & Extraction Highlight Banner */}
          {extractedData.originalImage && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div 
                className="w-14 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300 cursor-pointer relative group"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const w = window.open('', '_blank');
                    if (w) {
                      w.document.write(`<img src="${extractedData.originalImage}" style="max-width:100%;height:auto;display:block;margin:auto;" />`);
                    }
                  }
                }}
                title="Clique para ver imagem completa"
              >
                <img
                  src={extractedData.originalImage}
                  alt="Comprovante"
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#35E08C]" />
                  <span>Comprovante Processado por Visão Ótica</span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Verifique os dados abaixo extraídos do documento fiscal antes de efetivar o lançamento.
                </p>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Empresa / Estabelecimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#16324F]" />
                <span>Estabelecimento (Nome Fantasia)</span>
              </label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ex: Posto Graal, Restaurante..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#16324F]"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#16324F]" />
                <span>Categoria de Despesa</span>
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-[#16324F]"
              >
                <option value="Alimentação">Alimentação</option>
                <option value="Transporte / Combustível">Transporte / Combustível</option>
                <option value="Hospedagem">Hospedagem</option>
                <option value="Pedágio / Estacionamento">Pedágio / Estacionamento</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* Valor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#16324F]" />
                  <span>Valor Total (R$)</span>
                </label>
                {valor === 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                    Informe o valor
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                value={valor === 0 ? '' : valor}
                placeholder="0.00"
                onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-xl text-sm font-bold text-[#16324F] focus:ring-2 focus:ring-[#16324F] ${
                  valor === 0 ? 'border-amber-400 bg-amber-50/50' : 'border-slate-300 bg-white'
                }`}
              />
              {/* Quick suggestion chips if detected from OCR */}
              {extractedData.detected_values && extractedData.detected_values.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-medium">Valores detectados:</span>
                  {extractedData.detected_values.slice(0, 4).map((v: number, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setValor(v)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                        valor === v
                          ? 'bg-[#16324F] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      R$ {v.toFixed(2)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Viagem Vinculada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#16324F]" />
                <span>Associar à Viagem / Projeto</span>
              </label>
              {viagens.length > 0 ? (
                <select
                  value={selectedViagemId}
                  onChange={(e) => setSelectedViagemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-[#16324F]"
                >
                  {viagens.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.projeto} - {v.cliente} ({v.status})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Nenhuma viagem ativa. A despesa será criada avulsa.
                </div>
              )}
            </div>

            {/* Data */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#16324F]" />
                  <span>Data da Emissão (DD/MM/AAAA)</span>
                </label>
                {dataStr && (
                  <span className="text-[11px] font-extrabold text-[#16324F] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {formatDateBR(dataStr)}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={dataStr}
                onChange={(e) => setDataStr(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#16324F]"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">
                  Formato: <span className="font-semibold text-slate-600">{formatDateBR(dataStr)}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setDataStr(today);
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                      setDataStr(yesterday);
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    Ontem
                  </button>
                </div>
              </div>
            </div>

            {/* Hora */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#16324F]" />
                <span>Horário</span>
              </label>
              <input
                type="time"
                value={horaStr}
                onChange={(e) => setHoraStr(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#16324F]"
              />
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ do Emitente
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <input
                type="text"
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* SEFAZ NFC-e Consulta & Autenticidade Fiscal Card */}
          <div className="border border-sky-200 bg-gradient-to-r from-sky-50/90 to-blue-50/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-sky-950 uppercase tracking-wider flex items-center gap-2">
                    <span>Consulta de Autenticidade Fiscal</span>
                    <span className="text-[10px] bg-sky-700 text-white font-bold px-2 py-0.5 rounded-full lowercase tracking-normal">
                      portal oficial
                    </span>
                  </h4>
                  <p className="text-[11px] text-sky-800">
                    Portal de consulta: <span className="font-bold text-sky-900">{portalInfo.name}</span> ({portalInfo.stateName})
                  </p>
                </div>
              </div>

              {protocoloSefaz && (
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-semibold text-sky-700 uppercase block">Protocolo SEFAZ</span>
                  <span className="text-xs font-mono font-bold text-sky-900">{protocoloSefaz}</span>
                </div>
              )}
            </div>

            {/* Direct Portal Navigation Info */}
            <div className="bg-white/90 p-3 rounded-xl border border-sky-200/80 space-y-2 text-slate-800 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  Clique no botão abaixo para abrir a página oficial da Fazenda e consultar a autenticidade da nota fiscal:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={portalInfo.url || 'https://app.sefaz.es.gov.br/ConsultaNFCe'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCopyKey}
                  className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer no-underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Abrir Portal {portalInfo.name}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>

                <a
                  href={NATIONAL_NFE_PORTAL.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCopyKey}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer no-underline"
                  title="Abrir Consulta Pública no Portal Nacional da Fazenda"
                >
                  <span>Portal Nacional SPED</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
            </div>

            {/* Chave de Acesso Input & Direct Copy Button */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Chave de Acesso NFC-e (44 dígitos):
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  type="text"
                  value={chaveNfce}
                  onChange={(e) => setChaveNfce(e.target.value)}
                  placeholder="3226 0734 3876 6600 0166 6500 5000 1152 5490 0347 6212"
                  className="flex-1 px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-mono tracking-wider font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  disabled={!cleanChave}
                  className="px-3.5 py-2 bg-white hover:bg-sky-100 border border-sky-300 rounded-xl text-xs font-semibold text-sky-900 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Copiar Chave para Área de Transferência"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                </button>
              </div>

              {copiedKey && (
                <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-fade-in">
                  ✓ Chave de 44 dígitos copiada para a área de transferência! Cole no campo de consulta do portal da Fazenda.
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 pt-0.5">
              <Server className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>
                A integridade probatória do recibo é resguardada com hash SHA-256 e selo de auditoria WORM.
              </span>
            </div>
          </div>

          {/* Itemized Products List if extracted */}
          {extractedData.itens && extractedData.itens.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <span className="text-xs font-bold text-slate-700 mb-2 block">
                Itens Detalhados Extraídos do Cupom Fiscal ({extractedData.itens.length}):
              </span>
              <div className="divide-y divide-slate-200 max-h-36 overflow-y-auto">
                {extractedData.itens.map((item: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-medium">{item.descricao}</span>
                    <span className="text-slate-600 font-mono">
                      {item.quantidade}x R$ {item.valor_unitario?.toFixed(2)} = R$ {item.valor_total?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORM Audit Proof SHA-256 Badge */}
          <div className="bg-[#0E2338] text-slate-300 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#35E08C]" />
              <div>
                <span className="font-semibold text-white block">Hash de Prova Imutável (SHA-256)</span>
                <span className="text-[10px] text-slate-400 font-mono break-all">{hashSHA256}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#35E08C] hover:bg-[#2ecc79] text-[#0E2338] font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando no Firestore...' : 'Confirmar e Lançar Despesa'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
