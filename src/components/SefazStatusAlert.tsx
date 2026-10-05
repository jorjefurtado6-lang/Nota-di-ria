import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  WifiOff, 
  ShieldAlert, 
  Clock, 
  Server,
  Lock,
  Copy,
  Check
} from 'lucide-react';
import { SefazVerificationResult, NATIONAL_NFE_PORTAL } from '../lib/sefazPortal';

interface SefazStatusAlertProps {
  result: SefazVerificationResult | null;
  isLoading: boolean;
  onRetry?: () => void;
  onCopyKey?: () => void;
  copiedKey?: boolean;
  chaveNfce?: string;
  className?: string;
  compact?: boolean;
}

export const SefazStatusAlert: React.FC<SefazStatusAlertProps> = ({
  result,
  isLoading,
  onRetry,
  onCopyKey,
  copiedKey,
  chaveNfce,
  className = '',
  compact = false
}) => {
  if (isLoading) {
    return (
      <div className={`p-3 bg-sky-50/80 border border-sky-200 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-900 ${className}`}>
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 text-sky-600 animate-spin flex-shrink-0" />
          <div>
            <p className="font-bold text-sky-950">Verificando conectividade da SEFAZ...</p>
            <p className="text-[10px] text-sky-700">Testando tempo de resposta e certificados de segurança.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isSuccess = result.reachable && (result.status === 'online' || result.status === 'warning');
  const isWarning = result.status === 'warning';
  const isAuthError = result.status === 'auth_error' || result.errorType === 'AUTH_CERT_ERROR';
  const isTimeout = result.status === 'timeout' || result.errorType === 'TIMEOUT';
  const isMaintenance = result.status === 'maintenance' || result.errorType === 'PORTAL_MAINTENANCE';
  const isOffline = !result.reachable || result.status === 'offline';

  // Helper for rendering status icon
  const renderBadgeIcon = (sizeClass = "w-3.5 h-3.5") => {
    if (isWarning) {
      return <AlertTriangle className={`${sizeClass} text-amber-600 flex-shrink-0`} />;
    }
    if (isAuthError) {
      return <Lock className={`${sizeClass} text-amber-700 flex-shrink-0`} />;
    }
    if (isTimeout) {
      return <Clock className={`${sizeClass} text-orange-600 flex-shrink-0`} />;
    }
    if (isMaintenance || isOffline) {
      return <WifiOff className={`${sizeClass} text-rose-600 flex-shrink-0`} />;
    }
    return <CheckCircle2 className={`${sizeClass} text-emerald-600 flex-shrink-0`} />;
  };

  // Choose style tokens based on severity
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let containerBg = 'bg-emerald-50/70 border-emerald-200 text-emerald-950';

  if (isWarning) {
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    containerBg = 'bg-amber-50/80 border-amber-200 text-amber-950';
  } else if (isAuthError) {
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    containerBg = 'bg-amber-50/90 border-amber-200 text-amber-950';
  } else if (isTimeout) {
    badgeColor = 'bg-orange-100 text-orange-900 border-orange-300';
    containerBg = 'bg-orange-50/85 border-orange-200 text-orange-950';
  } else if (isMaintenance || isOffline) {
    badgeColor = 'bg-rose-100 text-rose-900 border-rose-300';
    containerBg = 'bg-rose-50/85 border-rose-200 text-rose-950';
  }

  if (compact) {
    return (
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${containerBg} ${className}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          {renderBadgeIcon("w-3.5 h-3.5")}
          <div className="truncate">
            <span className="font-bold block text-[11px] truncate">
              {result.portal.name}: {result.userMessage}
            </span>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-2 py-1 bg-white/90 hover:bg-white text-[10px] font-bold rounded-lg border border-slate-300 shadow-xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Reverificar</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${containerBg} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {renderBadgeIcon("w-4 h-4")}
          <div>
            <h5 className="font-bold text-xs flex items-center gap-1.5">
              <span>Status SEFAZ ({result.portal.uf})</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${badgeColor}`}>
                {result.reachable ? (isWarning ? 'Atenção' : 'Operacional') : 'Indisponível'}
              </span>
            </h5>
            <p className="text-[11px] opacity-90 leading-tight mt-0.5">
              {result.userMessage}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            title="Testar Conectividade com a SEFAZ"
            className="px-2.5 py-1 bg-white/90 hover:bg-white text-[10px] font-bold rounded-lg border border-slate-300 shadow-xs flex items-center gap-1 cursor-pointer transition-colors text-slate-800"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Testar</span>
          </button>
        )}
      </div>

      {/* Troubleshooting and Help guidance when error/warning occurs */}
      {(!isSuccess || isWarning) && (
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 space-y-2 text-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Recomendações e Alternativas:</span>
          </div>

          <p className="text-slate-600 leading-relaxed text-[10.5px]">
            {result.troubleshootingHelp}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onCopyKey && (
              <button
                type="button"
                onClick={onCopyKey}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10.5px] font-semibold text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
              </button>
            )}

            <a
              href={NATIONAL_NFE_PORTAL.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (onCopyKey) onCopyKey();
              }}
              className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-[10.5px] flex items-center gap-1 cursor-pointer shadow-xs transition-all no-underline"
            >
              <span>Portal Nacional SPED (Receita Federal)</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <a
              href={result.portal.url || 'https://app.sefaz.es.gov.br/ConsultaNFCe'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (onCopyKey) onCopyKey();
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-lg text-[10.5px] flex items-center gap-1 cursor-pointer transition-colors no-underline"
            >
              <span>Portal {result.portal.name}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      )}

      {/* Non-blocking assurance notice */}
      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 pt-0.5">
        <Server className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <span>
          O lançamento não é bloqueado por instabilidade na SEFAZ: a conformidade é resguardada com hash SHA-256 e selo de auditoria WORM.
        </span>
      </div>
    </div>
  );
};
