import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  Receipt, 
  Shield, 
  UserCheck, 
  Briefcase, 
  LogOut, 
  ChevronDown,
  Sparkles,
  Building2,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  Home
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  onSignOut: () => void;
  isOnline: boolean;
  activeTab: 'viagens' | 'despesas' | 'dashboard' | 'aprovacoes' | 'compliance' | 'admin';
  setActiveTab: (tab: 'viagens' | 'despesas' | 'dashboard' | 'aprovacoes' | 'compliance' | 'admin') => void;
  onOpenCapture: () => void;
  onOpenPaymentGateway?: () => void;
  pendingApprovalsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentRole,
  onRoleChange,
  onSignOut,
  isOnline,
  activeTab,
  setActiveTab,
  onOpenCapture,
  onOpenPaymentGateway,
  pendingApprovalsCount = 0
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Safe fallback values so UI never crashes or disappears
  const displayName = user?.nome || (user?.email ? user.email.split('@')[0] : 'Usuário Conectado');
  const displayEmail = user?.email || 'Sessão Corporativa Ativa';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSelectTab = (tab: 'viagens' | 'despesas' | 'dashboard' | 'aprovacoes' | 'compliance' | 'admin') => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role);
    setRoleDropdownOpen(false);
    if (role === 'admin') {
      setActiveTab('admin');
    }
    setMobileDrawerOpen(false);
  };

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 shadow-sm font-sans sticky top-0 z-40">
      {/* Top Console Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        
        {/* Brand & System Badges */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSelectTab('viagens')}
            className="flex items-center gap-2.5 text-left focus:outline-none hover:opacity-90 transition-opacity"
            title="Ir para o início do painel"
          >
            <img 
              src="/notadiaria_icon.svg" 
              alt="NotaDiária Logo" 
              className="w-8 h-8 rounded-lg object-cover shadow-xs border border-indigo-200/80" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">NotaDiária</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                  B2B
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center: Primary OCR Action */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onOpenCapture}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98]"
            title="Fotografar ou anexar cupom fiscal com IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-100 fill-current" />
            <span>Fotografar Nota</span>
          </button>
        </div>

        {/* Right side: Status, Role Switcher, Account, Exit Button & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Status Pill */}
          <div className={`flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded border font-mono ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden lg:inline">{isOnline ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          {/* Persona Switcher Dropdown (Desktop & Tablet) */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 transition-colors font-medium"
              title="Alternar Perfil do Usuário"
            >
              <span className="text-slate-500 text-[11px]">Perfil:</span>
              <span className="font-bold text-indigo-600 capitalize">
                {currentRole === 'funcionario' ? 'Viajante' : currentRole === 'gestor' ? 'Gestor' : currentRole === 'admin' ? 'Admin Master' : 'Compliance'}
              </span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white font-extrabold text-[10px] rounded-full font-mono animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setRoleDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span>Alternar Papel B2B</span>
                    {pendingApprovalsCount > 0 && (
                      <span className="text-amber-600 font-mono text-[10px] font-bold">
                        {pendingApprovalsCount} pendente(s)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRoleSelect('funcionario')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${currentRole === 'funcionario' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <div>Funcionário Viajante</div>
                      <div className="text-[10px] text-slate-400 font-normal">Captura e lança notas</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSelect('gestor')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${currentRole === 'gestor' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <div>
                        <div>Gestor / Aprovador</div>
                        <div className="text-[10px] text-slate-400 font-normal">Aprova e reprova despesas</div>
                      </div>
                    </div>
                    {pendingApprovalsCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-full font-mono shrink-0">
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleRoleSelect('financeiro')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${currentRole === 'financeiro' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <div>
                      <div>Financeiro & Compliance</div>
                      <div className="text-[10px] text-slate-400 font-normal">Trilha WORM e auditoria</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors border-t border-slate-100 mt-1 pt-1.5 ${currentRole === 'admin' ? 'bg-indigo-900/10 text-indigo-900 font-bold border border-indigo-300' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Administrador SaaS</div>
                      <div className="text-[10px] text-slate-500 font-normal">Planos, Analytics e Simulador</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
            <div 
              className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-200 shadow-xs"
              title={displayEmail}
            >
              {initial}
            </div>
            <div className="text-right hidden xl:block">
              <div className="text-xs font-bold text-slate-900 leading-none">{displayName}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[110px]">{displayEmail}</div>
            </div>
          </div>

          {/* Prominent Sign Out / Exit Button */}
          <button
            onClick={onSignOut}
            title="Sair do aplicativo e voltar à tela inicial / apresentação"
            aria-label="Sair / Desconectar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all font-semibold text-xs shadow-xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-bold">Sair</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            aria-label={mobileDrawerOpen ? 'Fechar Menu de Navegação' : 'Abrir Menu de Navegação'}
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Bar (Desktop / Tablet) - ALWAYS VISIBLE */}
      <nav 
        aria-label="Navegação principal"
        className="hidden md:block bg-slate-50/95 backdrop-blur-sm border-t border-slate-200 px-4 sm:px-6 lg:px-8 shadow-xs"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none">
          <button
            onClick={() => handleSelectTab('viagens')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'viagens'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Minhas Viagens</span>
          </button>

          <button
            onClick={() => handleSelectTab('despesas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'despesas'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Despesas & WORM</span>
          </button>

          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard & Gráficos</span>
          </button>

          <button
            onClick={() => handleSelectTab('aprovacoes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'aprovacoes'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Fila de Aprovação</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-full font-mono shadow-xs animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleSelectTab('compliance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Compliance & Auditoria</span>
          </button>

          <button
            onClick={() => handleSelectTab('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-indigo-900 text-white border border-indigo-700 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Painel Admin</span>
          </button>

          {onOpenPaymentGateway && (
            <button
              onClick={onOpenPaymentGateway}
              className="ml-auto px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gateway & Assinatura</span>
            </button>
          )}

          {/* Quick Exit Link in Nav Bar */}
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
            title="Sair do painel e voltar à apresentação inicial"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileDrawerOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick Snapshot of logged user & Exit */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {initial}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{displayName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{displayEmail}</div>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

          {/* Quick Capture Button on mobile drawer */}
          <button
            onClick={() => {
              setMobileDrawerOpen(false);
              onOpenCapture();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md shadow-indigo-600/20"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 fill-current" />
            <span>Fotografar Novo Comprovante</span>
          </button>

          {/* Role selection in mobile drawer */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Perfil Atual
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleRoleSelect('funcionario')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border flex items-center gap-2 ${currentRole === 'funcionario' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'border-slate-200 text-slate-700'}`}
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Viajante</span>
              </button>
              <button
                onClick={() => handleRoleSelect('gestor')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border flex items-center justify-between ${currentRole === 'gestor' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'border-slate-200 text-slate-700'}`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Gestor</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white font-extrabold text-[10px] rounded-full">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleRoleSelect('financeiro')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border flex items-center gap-2 ${currentRole === 'financeiro' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'border-slate-200 text-slate-700'}`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Financeiro</span>
              </button>
              <button
                onClick={() => handleRoleSelect('admin')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border flex items-center gap-2 ${currentRole === 'admin' ? 'bg-indigo-900 text-white font-bold border-indigo-800' : 'border-slate-200 text-slate-700'}`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Navegação
            </div>
            <button
              onClick={() => handleSelectTab('viagens')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 ${activeTab === 'viagens' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span>Minhas Viagens</span>
            </button>
            <button
              onClick={() => handleSelectTab('despesas')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 ${activeTab === 'despesas' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Receipt className="w-4 h-4 text-slate-500" />
              <span>Despesas & WORM</span>
            </button>
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>Dashboard & Gráficos</span>
            </button>
            <button
              onClick={() => handleSelectTab('aprovacoes')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${activeTab === 'aprovacoes' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>Fila de Aprovação</span>
              </div>
              {pendingApprovalsCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-full font-mono">
                  {pendingApprovalsCount} pendente(s)
                </span>
              )}
            </button>
            <button
              onClick={() => handleSelectTab('compliance')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 ${activeTab === 'compliance' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Compliance & Auditoria</span>
            </button>
            <button
              onClick={() => handleSelectTab('admin')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 ${activeTab === 'admin' ? 'bg-indigo-900 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Painel Admin SaaS</span>
            </button>
            {onOpenPaymentGateway && (
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenPaymentGateway();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 text-indigo-700 hover:bg-indigo-50"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Gateway & Assinatura</span>
              </button>
            )}
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                onSignOut();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 mt-2"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sair / Voltar ao Início</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
