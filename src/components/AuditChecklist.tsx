import React from 'react';
import { Despesa } from '../types';
import { formatDateTimeBR } from '../lib/dateUtils';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Hash, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCheck2, 
  Lock, 
  Building2, 
  Calendar, 
  Sparkles 
} from 'lucide-react';

interface AuditChecklistProps {
  despesa: Despesa;
  variant?: 'compact' | 'full' | 'inline-badge';
}

export const AuditChecklist: React.FC<AuditChecklistProps> = ({ despesa, variant = 'full' }) => {
  // Checks
  const isApproved = despesa.status_aprovacao === 'aprovado';
  const hasValidHash = Boolean(despesa.hash && despesa.hash.length >= 16);
  const isComplianceOk = despesa.compliance === 'essencial';
  const isComplianceWarning = despesa.compliance === 'condicional';
  const hasRedFlags = despesa.red_flags && despesa.red_flags.length > 0;
  const hasCNPJ = Boolean(despesa.cnpj && despesa.cnpj.trim().length > 0);
  const hasReceipt = Boolean(despesa.comprovante_url && despesa.comprovante_url.length > 0);

  // Overall Audit Score
  let score = 0;
  if (isComplianceOk) score += 35;
  else if (isComplianceWarning) score += 20;
  if (hasValidHash) score += 35;
  if (!hasRedFlags) score += 15;
  if (hasCNPJ) score += 10;
  if (hasReceipt) score += 5;

  const isFullyAudited = isApproved && hasValidHash && !hasRedFlags && isComplianceOk;

  if (variant === 'inline-badge') {
    return (
      <div className="flex items-center gap-1.5 font-sans">
        {/* Compliance Status Badge */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isComplianceOk
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isComplianceWarning
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={`Status de Conformidade: ${despesa.compliance}`}
        >
          {isComplianceOk ? (
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-3 h-3 text-amber-600" />
          )}
          <span>{isComplianceOk ? 'Conforme' : isComplianceWarning ? 'Alerta' : 'Vetado'}</span>
        </span>

        {/* Auditability WORM Hash Badge */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            hasValidHash
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title={hasValidHash ? `Hash WORM Válido: ${despesa.hash}` : 'Sem Hash Criptográfico'}
        >
          <Hash className="w-3 h-3 text-indigo-600" />
          <span>WORM {hasValidHash ? 'SHA-256' : 'Pendente'}</span>
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-white">Checklist de Auditoria</span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
            isFullyAudited 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isFullyAudited ? '100% Auditado' : 'Atenção Necessária'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            {isComplianceOk ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : isComplianceWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="truncate">Compliance: <strong className="text-white">{despesa.compliance}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            {hasValidHash ? (
              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="truncate">WORM: <strong className="text-white">{hasValidHash ? 'Validado' : 'Incompleto'}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // Full Visual Checklist Display
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 space-y-4 font-sans">
      
      {/* Checklist Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>Checklist de Auditoria Visual & WORM</span>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Score: {score}%
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Validação automática de regras fiscais e integridade criptográfica
            </p>
          </div>
        </div>

        <span className={`text-xs font-black font-mono px-3 py-1 rounded-full border ${
          isApproved 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          {isApproved ? 'APROVADO & VERIFICADO' : 'PENDENTE DE AUDITORIA'}
        </span>
      </div>

      {/* Grid of Audit Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        
        {/* Item 1: Status de Compliance */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
          isComplianceOk 
            ? 'bg-slate-950/60 border-emerald-500/30' 
            : isComplianceWarning
            ? 'bg-amber-950/20 border-amber-500/30'
            : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          {isComplianceOk ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : isComplianceWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold text-white block">Status de Conformidade</span>
            <p className="text-[11px] text-slate-300">
              Nível: <strong className="capitalize text-emerald-300">{despesa.compliance}</strong>
              {isComplianceWarning && ' (requer atenção ao teto ou categoria)'}
            </p>
          </div>
        </div>

        {/* Item 2: Integrity WORM SHA-256 */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
          hasValidHash 
            ? 'bg-slate-950/60 border-indigo-500/30' 
            : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          {hasValidHash ? (
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold text-white block">Auditabilidade WORM (SHA-256)</span>
            <p className="text-[11px] text-slate-300 font-mono">
              {hasValidHash ? `${despesa.hash.substring(0, 16)}...` : 'Sem hash criptográfico'}
            </p>
          </div>
        </div>

        {/* Item 3: Red Flags & Compliance Alerts */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
          !hasRedFlags 
            ? 'bg-slate-950/60 border-emerald-500/30' 
            : 'bg-amber-950/20 border-amber-500/30'
        }`}>
          {!hasRedFlags ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold text-white block">Red Flags & Alertas de Risco</span>
            <p className="text-[11px] text-slate-300">
              {!hasRedFlags 
                ? 'Nenhum alerta de risco detectado' 
                : `${despesa.red_flags.length} alerta(s): ${despesa.red_flags.join(', ')}`}
            </p>
          </div>
        </div>

        {/* Item 4: Comprovante e Emissor Fiscal */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
          hasCNPJ && hasReceipt 
            ? 'bg-slate-950/60 border-emerald-500/30' 
            : 'bg-amber-950/20 border-amber-500/30'
        }`}>
          {hasCNPJ && hasReceipt ? (
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold text-white block">Dados Fiscais & Anexo</span>
            <p className="text-[11px] text-slate-300">
              CNPJ: <strong className="font-mono text-slate-200">{despesa.cnpj || 'Não informado'}</strong>
              {hasReceipt ? ' • Imagem Anexada' : ' • Sem imagem'}
            </p>
          </div>
        </div>

      </div>

      {/* Footer Banner */}
      <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verificação realizada automaticamente pelo motor de Inteligência Artificial e Trilha WORM.</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">{formatDateTimeBR(despesa.data, despesa.hora)}</span>
      </div>

    </div>
  );
};
