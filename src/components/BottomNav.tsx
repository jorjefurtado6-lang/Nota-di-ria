import React from 'react';
import { 
  Briefcase, 
  Receipt, 
  BarChart3, 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  Sparkles,
  Layers
} from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavProps {
  activeTab: 'viagens' | 'despesas' | 'dashboard' | 'aprovacoes' | 'compliance' | 'admin';
  setActiveTab: (tab: 'viagens' | 'despesas' | 'dashboard' | 'aprovacoes' | 'compliance' | 'admin') => void;
  onOpenCapture: () => void;
  currentRole: UserRole;
  pendingApprovalsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenCapture,
  currentRole,
  pendingApprovalsCount = 0
}) => {
  return (
    <nav 
      aria-label="Navegação rápida móvel"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around"
    >
      {/* 1. Viagens */}
      <button
        onClick={() => setActiveTab('viagens')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative min-w-[54px] ${
          activeTab === 'viagens'
            ? 'text-indigo-600'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Briefcase className="w-5 h-5 mb-0.5" />
        <span>Viagens</span>
      </button>

      {/* 2. Despesas */}
      <button
        onClick={() => setActiveTab('despesas')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative min-w-[54px] ${
          activeTab === 'despesas'
            ? 'text-indigo-600'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Receipt className="w-5 h-5 mb-0.5" />
        <span>Notas</span>
      </button>

      {/* 3. Center Action: Fotografar Nota */}
      <button
        onClick={onOpenCapture}
        aria-label="Fotografar Cupom Fiscal"
        className="flex flex-col items-center justify-center -mt-5 bg-indigo-600 text-white rounded-full w-12 h-12 shadow-lg shadow-indigo-600/40 hover:bg-indigo-700 active:scale-95 transition-all border-2 border-white shrink-0"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* 4. Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative min-w-[54px] ${
          activeTab === 'dashboard'
            ? 'text-indigo-600'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span>Gráficos</span>
      </button>

      {/* 5. Papel Específico: Aprovação (Gestor/Financeiro), Compliance ou Admin */}
      {currentRole === 'gestor' ? (
        <button
          onClick={() => setActiveTab('aprovacoes')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative min-w-[54px] ${
            activeTab === 'aprovacoes'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <UserCheck className="w-5 h-5 mb-0.5 text-amber-600" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
            )}
          </div>
          <span>Aprovar</span>
        </button>
      ) : currentRole === 'financeiro' ? (
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative min-w-[54px] ${
            activeTab === 'compliance'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-5 h-5 mb-0.5 text-indigo-600" />
          <span>Auditoria</span>
        </button>
      ) : currentRole === 'admin' ? (
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative min-w-[54px] ${
            activeTab === 'admin'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-0.5 text-rose-600" />
          <span>Admin</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative min-w-[54px] ${
            activeTab === 'admin'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Painel</span>
        </button>
      )}
    </nav>
  );
};
