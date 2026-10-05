import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, syncUserProfile } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserRole } from '../types';
import { LegalModal } from './LegalModal';
import { 
  Shield, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  Phone, 
  FileText, 
  CreditCard, 
  Check, 
  ChevronRight, 
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  X
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
  onDemoSuccess?: (demoUser: any, demoRole: UserRole, demoName: string) => void;
  onSelectPlanAndPay?: (planId?: string, clientData?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    accountType: 'pessoal' | 'empresarial';
  }) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ 
  onSuccess, 
  onDemoSuccess,
  onSelectPlanAndPay 
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  
  // Registration Form Fields (Progressive Unfolding)
  const [accountType, setAccountType] = useState<'pessoal' | 'empresarial' | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  
  // Passwords (Step 2)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State indicators
  const [error, setError] = useState('');
  const [isEmailProviderError, setIsEmailProviderError] = useState(false);
  const [showFirebaseActivationModal, setShowFirebaseActivationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');

  // Progressive Disclosure State (fields unfold as user fills in previous ones)
  const [revealed, setRevealed] = useState<{
    name: boolean;
    email: boolean;
    phone: boolean;
    cpfCnpj: boolean;
  }>({
    name: false,
    email: false,
    phone: false,
    cpfCnpj: false,
  });

  // Track progressive unfolding
  useEffect(() => {
    if (accountType === 'pessoal' || accountType === 'empresarial') {
      setRevealed(prev => ({ ...prev, name: true }));
    }
  }, [accountType]);

  useEffect(() => {
    if (name.trim().length >= 3) {
      setRevealed(prev => ({ ...prev, email: true }));
    }
  }, [name]);

  useEffect(() => {
    if (email.trim().includes('@') && email.trim().includes('.')) {
      setRevealed(prev => ({ ...prev, phone: true }));
    }
  }, [email]);

  useEffect(() => {
    if (phone.replace(/\D/g, '').length >= 10) {
      setRevealed(prev => ({ ...prev, cpfCnpj: true }));
    }
  }, [phone]);

  // Format Brazilian Phone: (00) 00000-0000
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) {
      setPhone(raw ? `(${raw}` : '');
    } else if (raw.length <= 6) {
      setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2)}`);
    } else if (raw.length <= 10) {
      setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`);
    } else {
      setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`);
    }
  };

  // Format CPF (000.000.000-00) or CNPJ (00.000.000/0001-00)
  const handleCpfCnpjChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (accountType === 'pessoal') {
      const v = raw.slice(0, 11);
      if (v.length <= 3) setCpfCnpj(v);
      else if (v.length <= 6) setCpfCnpj(`${v.slice(0, 3)}.${v.slice(3)}`);
      else if (v.length <= 9) setCpfCnpj(`${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`);
      else setCpfCnpj(`${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9, 11)}`);
    } else {
      const v = raw.slice(0, 14);
      if (v.length <= 2) setCpfCnpj(v);
      else if (v.length <= 5) setCpfCnpj(`${v.slice(0, 2)}.${v.slice(2)}`);
      else if (v.length <= 8) setCpfCnpj(`${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`);
      else if (v.length <= 12) setCpfCnpj(`${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`);
      else setCpfCnpj(`${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`);
    }
  };

  // Progressive Step 1 Validation
  const isAccountTypeSelected = accountType === 'pessoal' || accountType === 'empresarial';
  const isNameValid = name.trim().length >= 3;
  const isEmailValid = email.trim().includes('@') && email.trim().includes('.');
  const isPhoneValid = phone.replace(/\D/g, '').length >= 10;
  const isCpfCnpjValid = accountType === 'pessoal' 
    ? cpfCnpj.replace(/\D/g, '').length === 11 
    : cpfCnpj.replace(/\D/g, '').length === 14;

  const isStep1Complete = Boolean(
    isAccountTypeSelected &&
    isNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isCpfCnpjValid
  );

  // Validation for Step 2
  const isPasswordValid = password.length >= 6;
  const isPasswordsMatch = isPasswordValid && password === confirmPassword;

  // Handle proceed to step 2 (Window 2)
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Complete) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setError('');
    setSignUpStep(2);
  };

  // Handle finalize registration and go to Payment Gateway Directory
  const handleFinalizeAndGoToPayment = async () => {
    if (!isPasswordsMatch) {
      setError('As senhas não coincidem ou têm menos de 6 caracteres.');
      return;
    }

    setError('');
    setIsEmailProviderError(false);
    setLoading(true);

    try {
      // 1. Create user account in Firebase
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const assignedRole: UserRole = accountType === 'empresarial' ? 'gestor' : 'funcionario';
        await syncUserProfile(res.user, assignedRole, name);
      } catch (authErr: any) {
        console.warn('Firebase Auth standard register notice:', authErr);
        if (authErr.code === 'auth/operation-not-allowed' || authErr.message?.includes('operation-not-allowed')) {
          setIsEmailProviderError(true);
          setError('O provedor de E-mail/Senha precisa ser ativado no Console do Firebase.');
          setShowFirebaseActivationModal(true);
        }
      }

      // 2. Direct to plan payment directory
      const chosenAccountType = accountType || 'empresarial';
      const recommendedPlan = chosenAccountType === 'pessoal' ? 'pessoal' : 'profissional';

      if (onSelectPlanAndPay) {
        onSelectPlanAndPay(recommendedPlan, {
          name,
          email,
          cpfCnpj,
          phone,
          accountType: chosenAccountType
        });
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Erro ao registrar usuário.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Standard Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailProviderError(false);
    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await syncUserProfile(res.user, role);
      onSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setIsEmailProviderError(true);
        setError('O provedor de E-mail/Senha não está ativado no Console do Firebase.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setIsEmailProviderError(false);
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/weak-password') {
        setIsEmailProviderError(false);
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setIsEmailProviderError(false);
        setError(err.message || 'Erro ao realizar autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await syncUserProfile(res.user, role, res.user.displayName || undefined);
      onSuccess();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('Erro no login Google: ' + (err.message || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: UserRole, demoEmail: string, demoName: string) => {
    setError('');
    setLoading(true);
    const demoPassword = 'DemoPassword123!';

    try {
      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          userCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        } else {
          throw e;
        }
      }
      await syncUserProfile(userCred.user, demoRole, demoName);
      onSuccess();
    } catch (err: any) {
      console.warn('Demo login standard auth fallback:', err);
      const fakeUid = `demo_${demoRole}_${demoEmail.split('@')[0]}`;
      const demoUserObj = {
        uid: fakeUid,
        email: demoEmail,
        displayName: demoName
      };

      try {
        await syncUserProfile(demoUserObj as any, demoRole, demoName);
      } catch (e) {
        console.warn('Firestore profile sync fallback:', e);
      }

      if (onDemoSuccess) {
        onDemoSuccess(demoUserObj, demoRole, demoName);
      } else {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect to plan checkout
  const handleGoToPlanSelection = () => {
    if (onSelectPlanAndPay) {
      onSelectPlanAndPay(
        accountType === 'pessoal' ? 'pessoal' : 'profissional',
        {
          name,
          email,
          cpfCnpj,
          phone,
          accountType
        }
      );
    } else {
      onSuccess();
    }
  };

  return (
    <div className="w-full bg-slate-50 rounded-2xl p-4 sm:p-6 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Branding, Demo Accounts & Key Features */}
        <div className="md:col-span-5 space-y-4 bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/notadiaria_icon.svg" 
                alt="NotaDiária Logo" 
                className="w-10 h-10 rounded-xl object-cover border border-indigo-500/30 shrink-0 shadow-md" 
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-black text-white tracking-tight">
                    NotaDiária
                  </h2>
                  <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 font-mono uppercase">
                    v2.4
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Gestão & Prestação de Contas sem Digitação
                </p>
              </div>
            </div>

            {/* High Density Quick Persona Bar */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Acesso Rápido de Teste (Demo)</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">1-Click</span>
              </div>
              
              <p className="text-[10px] text-slate-300">
                Clique para testar com perfil pré-configurado:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('funcionario', 'viajante@notadiaria.com.br', 'Carlos Santos')}
                  className="w-full bg-slate-800/90 hover:bg-slate-800 text-left p-2.5 rounded-xl border border-slate-700/80 text-xs transition-all hover:border-emerald-400 flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-emerald-400 text-xs">Carlos Santos</div>
                    <div className="text-[10px] text-slate-400">Funcionário Viajante</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('gestor', 'gestor@notadiaria.com.br', 'Mariana Lima')}
                  className="w-full bg-slate-800/90 hover:bg-slate-800 text-left p-2.5 rounded-xl border border-slate-700/80 text-xs transition-all hover:border-amber-400 flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-amber-300 text-xs">Mariana Lima</div>
                    <div className="text-[10px] text-slate-400">Gestora Aprovadora</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('financeiro', 'financeiro@notadiaria.com.br', 'Roberto Alves')}
                  className="w-full bg-slate-800/90 hover:bg-slate-800 text-left p-2.5 rounded-xl border border-slate-700/80 text-xs transition-all hover:border-indigo-400 flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-indigo-300 text-xs">Roberto Alves</div>
                    <div className="text-[10px] text-slate-400">Financeiro & Auditoria</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* High Density Value Highlights */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Gemini AI Vision</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Probatório WORM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>PDF & XLSX Fiscal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Firestore Real-Time</span>
            </div>
          </div>
        </div>

        {/* Right Column: Google Auth, Tabs & Progressive Multi-Step Form */}
        <div className="md:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            {/* Social Auth Option (Available on login and initial screen) */}
            {!isSignUp && (
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 border border-slate-300 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Entrar com Conta Google</span>
                </button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                    <span className="bg-white px-2">ou e-mail de acesso</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Mode Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`pb-2.5 text-xs font-bold flex-1 border-b-2 transition-all ${!isSignUp ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Acessar Conta
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setSignUpStep(1); setError(''); }}
                className={`pb-2.5 text-xs font-bold flex-1 border-b-2 transition-all ${isSignUp ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Criar Nova Conta
              </button>
            </div>

            {error && (
              <div className={`p-3.5 rounded-xl border text-xs mb-3.5 transition-all ${
                isEmailProviderError || error.includes('provedor de E-mail') || error.includes('Firebase')
                  ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isEmailProviderError || error.includes('provedor de E-mail') || error.includes('Firebase')
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`} />
                  <div className="flex-1 space-y-2">
                    <p className="font-bold text-xs leading-snug">{error}</p>
                    
                    {(isEmailProviderError || error.includes('provedor de E-mail') || error.includes('Firebase')) && (
                      <div className="pt-1 border-t border-amber-200/60 space-y-2">
                        <p className="text-[11px] text-amber-900 leading-relaxed">
                          Para criar contas e fazer login com e-mail/senha, ative a opção no Console do Firebase (leva menos de 1 minuto):
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-xs"
                          >
                            <span>Ativar no Console do Firebase</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setShowFirebaseActivationModal(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 underline underline-offset-2 px-1 py-1"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Ver passo a passo detalhado</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PROGRESSIVE MULTI-STEP SIGN UP WIZARD                                     */}
            {/* ========================================================================= */}
            {isSignUp ? (
              <div className="space-y-4">
                
                {/* Step Breadcrumb Indicators */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${signUpStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      1
                    </span>
                    <span className={`text-[11px] font-bold ${signUpStep === 1 ? 'text-indigo-600' : 'text-slate-500'}`}>
                      Dados Cadastrais
                    </span>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${signUpStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      2
                    </span>
                    <span className={`text-[11px] font-bold ${signUpStep === 2 ? 'text-indigo-600' : 'text-slate-500'}`}>
                      Login e Senha
                    </span>
                  </div>
                </div>

                {/* --- JANELA 1: Formulário Progressivo (Tipo -> Nome -> Email -> Telefone -> CPF/CNPJ -> Próximo Passo) --- */}
                {signUpStep === 1 && (
                  <form onSubmit={handleProceedToStep2} className="space-y-3.5">
                    
                    {/* Pergunta Inicial: Qual o tipo de conta você tem interesse? */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800 tracking-tight">
                        Qual o tipo de conta você tem interesse?
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountType('pessoal');
                            setCpfCnpj('');
                          }}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            accountType === 'pessoal'
                              ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                              accountType === 'pessoal'
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-400 bg-white'
                            }`}
                          >
                            {accountType === 'pessoal' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Pessoal</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Pessoa física ou autônomo</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAccountType('empresarial');
                            setCpfCnpj('');
                          }}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            accountType === 'empresarial'
                              ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                              accountType === 'empresarial'
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-400 bg-white'
                            }`}
                          >
                            {accountType === 'empresarial' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Empresarial</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Empresas com CNPJ e equipes</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Campo 2: Nome completo: (Abre após escolher o tipo) */}
                    {(revealed.name || isAccountTypeSelected) && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Nome completo: <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={accountType === 'pessoal' ? 'Digite seu nome completo' : 'Razão Social ou Nome do Titular'}
                            className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white font-medium"
                          />
                          {isNameValid && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3 animate-in zoom-in-75 duration-200" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Campo 3: E-mail: (Abre após preencher o nome) */}
                    {(revealed.email || isNameValid) && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          E-mail: <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu.email@exemplo.com.br"
                            className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white font-medium"
                          />
                          {isEmailValid && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3 animate-in zoom-in-75 duration-200" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Campo 4: Telefone: (Abre após preencher o e-mail) */}
                    {(revealed.phone || isEmailValid) && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Telefone: <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white"
                          />
                          {isPhoneValid && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3 animate-in zoom-in-75 duration-200" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Campo 5: Cpf/cnpj: (Abre após preencher o telefone) */}
                    {(revealed.cpfCnpj || isPhoneValid) && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          {accountType === 'pessoal' ? 'CPF:' : 'CNPJ:'} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            value={cpfCnpj}
                            onChange={(e) => handleCpfCnpjChange(e.target.value)}
                            placeholder={accountType === 'pessoal' ? '000.000.000-00' : '00.000.000/0001-00'}
                            className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white"
                          />
                          {isCpfCnpjValid && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3 animate-in zoom-in-75 duration-200" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Uma vêz completados todos os campos, aparecer um icone para clicar para “seguir” para o próximo passo */}
                    {isStep1Complete && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-3 duration-300">
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        >
                          <span>Seguir para o próximo passo</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* --- JANELA 2: Definir Login e Senha (E-mail já preenchido + Caixa de Senha + Caixa de Repetir Senha) --- */}
                {signUpStep === 2 && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Header da Janela 2 com botão de voltar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-indigo-600" />
                          <span>Definir Login e Senha</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Crie a senha de acesso para sua conta de faturamento e notas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignUpStep(1)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Editar dados</span>
                      </button>
                    </div>

                    {/* Campo de e-mail já preenchido com o e-mail citado anteriormente */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        E-mail de Login
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full pl-9 pr-24 py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Preenchido</span>
                        </div>
                      </div>
                    </div>

                    {/* Caixa de Senha */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Criar Senha de Acesso <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          autoFocus
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Digite uma senha (mínimo 6 caracteres)"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white"
                        />
                      </div>
                    </div>

                    {/* Caixa de Repetir Senha */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Repetir Senha <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a mesma senha"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white"
                        />
                      </div>
                    </div>

                    {/* Helper quando confirmPassword foi digitado mas não confere */}
                    {confirmPassword && !isPasswordsMatch && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="text-[11px] font-medium">
                          {password.length < 6
                            ? 'A senha deve conter pelo menos 6 caracteres.'
                            : 'As senhas digitadas ainda não são idênticas.'}
                        </span>
                      </div>
                    )}

                    {/* Quando ele terminou de inserir a segunda senha, estando correta, abrirá automaticamente uma caixa de texto com os dizeres */}
                    {isPasswordsMatch && (
                      <div className="bg-emerald-50 border-2 border-emerald-500/80 rounded-2xl p-5 text-center space-y-3.5 shadow-lg shadow-emerald-600/10 animate-in fade-in zoom-in-95 duration-300 mt-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-extrabold text-emerald-950 leading-relaxed px-2">
                            “Cadastro foi concluído com sucesso, escolha seu plano e comesse a utilizar agora mesmo”
                          </p>
                          <p className="text-[11px] text-emerald-800">
                            Titular: <span className="font-bold">{name}</span> • Login: <span className="font-mono font-bold">{email}</span>
                          </p>
                        </div>

                        {/* Criar um ícone para ele clicar para ser direcionado para a escolha do plano; e em clicando, ele será direcionado para o diretório de pagamento */}
                        <button
                          type="button"
                          onClick={handleFinalizeAndGoToPayment}
                          disabled={loading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4 text-emerald-100" />
                          <span>{loading ? 'Preparando diretório de pagamento...' : 'Escolher Plano & Ir para Pagamento'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                  </div>
                )}

              </div>
            ) : (
              /* ========================================================================= */
              /* STANDARD LOGIN FORM                                                       */
              /* ========================================================================= */
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com.br"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-slate-400 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#16324F] hover:bg-[#0E2338] text-white font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs cursor-pointer"
                >
                  {loading ? (
                    <span>Autenticando...</span>
                  ) : (
                    <>
                      <span>Entrar na Conta</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="text-[10px] text-center text-slate-500 mt-3 leading-tight">
              Ao continuar, você concorda com nossos{' '}
              <button
                type="button"
                onClick={() => {
                  setLegalTab('terms');
                  setShowLegalModal(true);
                }}
                className="text-[#16324F] font-bold hover:underline"
              >
                Termos de Uso
              </button>{' '}
              e{' '}
              <button
                type="button"
                onClick={() => {
                  setLegalTab('privacy');
                  setShowLegalModal(true);
                }}
                className="text-[#16324F] font-bold hover:underline"
              >
                Política de Privacidade
              </button>
              .
            </p>
          </div>
        </div>

      </div>

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalTab}
      />

      {/* Modal de Instruções de Ativação do Provedor de E-mail */}
      {showFirebaseActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Ativar E-mail no Firebase</h3>
                  <p className="text-[11px] text-slate-500">Procedimento de 30 segundos (única vez)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFirebaseActivationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-700">
              <p className="leading-relaxed">
                Por padrão de segurança da infraestrutura do Firebase/Google, o login com e-mail/senha precisa ser habilitado pelo administrador do projeto no console:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-800">Clique no botão azul:</span> Na tabela de Provedores de login, clique no botão azul <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Adicionar novo fornecedor</span> (no canto direito).
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-800">Escolha E-mail/senha:</span> Na lista de opções que abrir, clique em <span className="font-semibold text-slate-900">E-mail/senha</span> (Email/Password).
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-800">Ative e Salve:</span> Marque a primeira chave <span className="font-semibold text-emerald-700">Ativar</span> e clique no botão azul <span className="font-bold text-slate-900">Salvar</span>.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <p className="leading-tight">
                  <span className="font-bold">Dica:</span> Enquanto não ativa, você pode entrar instantaneamente usando o botão <span className="font-semibold">Entrar com Conta Google</span> ou os botões de <span className="font-semibold">Acesso Rápido (Demo)</span>.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span>Abrir Console do Firebase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowFirebaseActivationModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
