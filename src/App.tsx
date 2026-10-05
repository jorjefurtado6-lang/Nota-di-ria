import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  orderBy, 
  setDoc,
  getDocs
} from 'firebase/firestore';
import { auth, db, syncUserProfile, updateUserRoleInDb, addAuditLog } from './lib/firebase';
import { UserProfile, UserRole, Viagem, Despesa, AuditoriaLog } from './types';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthView } from './components/AuthView';
import { LandingPage } from './components/LandingPage';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ReceiptConfirmModal } from './components/ReceiptConfirmModal';
import { TripsView } from './components/TripsView';
import { ExpensesView } from './components/ExpensesView';
import { ApprovalsView } from './components/ApprovalsView';
import { ComplianceView } from './components/ComplianceView';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { LegalModal } from './components/LegalModal';
import { AdminPanel } from './components/AdminPanel';
import { DashboardView } from './components/DashboardView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('funcionario');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Firestore Data Collections
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditoriaLog[]>([]);

  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState<'viagens' | 'despesas' | 'dashboard' | 'aprovacoes' | 'compliance' | 'admin'>('viagens');
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [extractedReceiptData, setExtractedReceiptData] = useState<any | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [filterTripId, setFilterTripId] = useState<string | undefined>(undefined);

  // Legal Modal State
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('privacy');

  // Monitor Online / Offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Immediate fallback profile so Navbar and UI controls are never blank or hidden
        const initialFallback: UserProfile = {
          uid: currentUser.uid,
          nome: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Usuário'),
          email: currentUser.email || '',
          empresa_id: 'empresa_demo_1',
          perfil: currentRole || 'funcionario',
          cargo: 'Viajante Corporativo',
          avatarUrl: currentUser.photoURL || ''
        };
        setProfile(initialFallback);

        try {
          const userProfile = await syncUserProfile(currentUser);
          setProfile(userProfile);
          setCurrentRole(userProfile.perfil || 'funcionario');
        } catch (e) {
          console.error('Erro ao sincronizar perfil do usuário:', e);
        }
      } else {
        setProfile(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscriptions for Viagens, Despesas, and Auditoria
  useEffect(() => {
    if (!user) {
      setViagens([]);
      setDespesas([]);
      setAuditLogs([]);
      return;
    }

    // 1. Viagens Subscription
    const viagensRef = collection(db, 'viagens');
    const unsubViagens = onSnapshot(viagensRef, (snapshot) => {
      const items: Viagem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Viagem));

      setViagens(items);

      // Do not auto-seed fake/fictitious data
      if (items.length === 0) {
        console.log('Nenhuma viagem cadastrada. Aguardando ação do usuário.');
      }
    }, (err) => {
      console.error('Erro no snapshot de viagens:', err);
    });

    // 2. Despesas Subscription
    const despesasRef = collection(db, 'despesas');
    const unsubDespesas = onSnapshot(despesasRef, (snapshot) => {
      const items: Despesa[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Despesa));

      setDespesas(items);
    }, (err) => {
      console.error('Erro no snapshot de despesas:', err);
    });

    // 3. Auditoria Subscription
    const auditRef = collection(db, 'auditoria');
    const unsubAudit = onSnapshot(auditRef, (snapshot) => {
      const items: AuditoriaLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditoriaLog));

      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(items);
    }, (err) => {
      console.error('Erro no snapshot de auditoria:', err);
    });

    return () => {
      unsubViagens();
      unsubDespesas();
      unsubAudit();
    };
  }, [user, profile]);

  // Clear Fictitious / Sample Data helper
  const handleClearFictitiousData = async () => {
    try {
      const sampleExpenses = despesas.filter(d => 
        d.hash === 'e8d24bc30bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f9999' ||
        d.hash === 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' ||
        d.empresa?.toLowerCase().includes('posto vila nova') ||
        d.empresa?.toLowerCase().includes('posto shell')
      );
      for (const item of sampleExpenses) {
        if (item.id && !item.id.startsWith('local_')) {
          await deleteDoc(doc(db, 'despesas', item.id));
        }
      }

      setDespesas(prev => prev.filter(d => 
        !d.empresa?.toLowerCase().includes('posto vila nova') &&
        !d.empresa?.toLowerCase().includes('posto shell')
      ));

      if (user) {
        await addAuditLog(profile?.nome || 'Usuário', user.uid, 'Removeu todos os dados fictícios de exemplo da conta', 'Limpeza de Dados');
      }
    } catch (err) {
      console.error('Erro ao remover dados fictícios:', err);
    }
  };

  // Switch Role handler
  const handleRoleChange = async (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (user) {
      try {
        await updateUserRoleInDb(user.uid, newRole);
        setProfile(prev => prev ? { ...prev, perfil: newRole } : null);
      } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
      }
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  // Demo fallback handler for 1-click personas
  const handleDemoSuccess = async (demoUserObj: any, demoRole: UserRole, demoName: string) => {
    setUser(demoUserObj);
    const demoProfile: UserProfile = {
      uid: demoUserObj.uid,
      nome: demoName,
      email: demoUserObj.email || '',
      empresa_id: 'empresa_demo_1',
      perfil: demoRole,
      cargo: demoRole === 'gestor' ? 'Gestora / Aprovadora' : demoRole === 'financeiro' ? 'Analista de Compliance' : 'Consultor de Campo'
    };
    setProfile(demoProfile);
    setCurrentRole(demoRole);
    setLoadingAuth(false);

    try {
      await setDoc(doc(db, 'users', demoUserObj.uid), demoProfile, { merge: true });
    } catch (err) {
      console.warn('Sincronização de usuário demo:', err);
    }
  };

  // OCR Receipt Extracted Callback
  const handleReceiptProcessed = (data: any) => {
    setExtractedReceiptData(data);
    setIsConfirmModalOpen(true);
  };

  // Save Expense to Firestore (with local fallback if offline or demo mode)
  const handleSaveExpense = async (expenseData: Partial<Despesa>) => {
    const uid = user ? user.uid : 'demo_user_id';
    const userName = profile?.nome || 'Carlos Santos';

    const newExpense: Omit<Despesa, 'id'> = {
      viagem_id: expenseData.viagem_id || '',
      usuario_id: uid,
      usuario_nome: userName,
      data: expenseData.data || new Date().toISOString().split('T')[0],
      hora: expenseData.hora || '12:00',
      cnpj: expenseData.cnpj || '00.000.000/0001-00',
      empresa: expenseData.empresa || 'Estabelecimento Comercial',
      categoria: expenseData.categoria || 'Alimentação',
      valor: Number(expenseData.valor || 0),
      status_aprovacao: 'pendente',
      comprovante_url: expenseData.comprovante_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
      hash: expenseData.hash || 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      compliance: expenseData.compliance || 'essencial',
      red_flags: expenseData.red_flags || [],
      itens: expenseData.itens || [],
      pagamento: expenseData.pagamento || 'Cartão Corporativo',
      chave_nfce: expenseData.chave_nfce || '',
      confidence_score: expenseData.confidence_score || 0.98,
      localizacao: expenseData.localizacao || 'São Paulo, SP',
      createdAt: new Date().toISOString()
    };

    try {
      if (user) {
        const docRef = await addDoc(collection(db, 'despesas'), newExpense);
        await addAuditLog(
          userName,
          uid,
          `Lançou despesa de R$ ${newExpense.valor.toFixed(2)} (${newExpense.empresa}) com WORM Hash: ${newExpense.hash.substring(0, 12)}...`,
          'Mobile App',
          docRef.id
        );
      } else {
        // Local state update if demo mode
        const localDoc: Despesa = { id: 'local_' + Date.now(), ...newExpense };
        setDespesas(prev => [localDoc, ...prev]);
      }
    } catch (err) {
      console.warn('Salvando despesa em modo de contingência local:', err);
      const localDoc: Despesa = { id: 'local_' + Date.now(), ...newExpense };
      setDespesas(prev => [localDoc, ...prev]);
    } finally {
      setIsConfirmModalOpen(false);
      setActiveTab('despesas');
    }
  };

  // Create Trip in Firestore
  const handleCreateTrip = async (newTripData: Omit<Viagem, 'id' | 'usuario_id' | 'status'>) => {
    const uid = user ? user.uid : 'demo_user_id';
    const userName = profile?.nome || 'Usuário';

    const trip: Omit<Viagem, 'id'> = {
      ...newTripData,
      usuario_id: uid,
      usuario_nome: userName,
      status: 'em_andamento' as const,
      createdAt: new Date().toISOString()
    };

    try {
      if (user && !user.uid.startsWith('demo_')) {
        const docRef = await addDoc(collection(db, 'viagens'), trip);
        await addAuditLog(
          userName,
          uid,
          `Criou nova viagem de negócios: ${newTripData.projeto} (${newTripData.cliente})`,
          'Mobile App',
          docRef.id
        );
      } else {
        const localTrip: Viagem = { id: 'local_' + Date.now(), ...trip };
        setViagens(prev => [localTrip, ...prev]);
      }
    } catch (err: any) {
      console.warn('Erro ao salvar viagem no Firestore, usando persistência local:', err);
      const localTrip: Viagem = { id: 'local_' + Date.now(), ...trip };
      setViagens(prev => [localTrip, ...prev]);
    }
  };

  // Delete single trip
  const handleDeleteTrip = async (tripId: string) => {
    try {
      if (!tripId.startsWith('local_')) {
        await deleteDoc(doc(db, 'viagens', tripId));
      }
      setViagens(prev => prev.filter(v => v.id !== tripId));
      if (user) {
        await addAuditLog(profile?.nome || 'Usuário', user.uid, `Excluiu viagem ID: ${tripId}`, 'Mobile App');
      }
    } catch (err) {
      console.error('Erro ao excluir viagem:', err);
    }
  };

  // Delete all trips
  const handleDeleteAllTrips = async () => {
    try {
      for (const t of viagens) {
        if (t.id && !t.id.startsWith('local_')) {
          await deleteDoc(doc(db, 'viagens', t.id));
        }
      }
      setViagens([]);
      if (user) {
        await addAuditLog(profile?.nome || 'Usuário', user.uid, 'Excluiu todas as viagens cadastradas', 'Mobile App');
      }
    } catch (err) {
      console.error('Erro ao excluir todas as viagens:', err);
    }
  };

  // Send Trip for Approval
  const handleSendTripForApproval = async (tripId: string) => {
    try {
      if (tripId.startsWith('local_')) {
        setViagens(prev => prev.map(t => t.id === tripId ? { ...t, status: 'enviada' } : t));
      } else {
        const tripRef = doc(db, 'viagens', tripId);
        await updateDoc(tripRef, { status: 'enviada' });
      }
      setViagens(prev => prev.map(t => t.id === tripId ? { ...t, status: 'enviada' } : t));

      if (user) {
        await addAuditLog(
          profile?.nome || 'Usuário',
          user.uid,
          `Enviou prestação de contas da viagem ID: ${tripId} para aprovação do Gestor`,
          'Mobile App'
        );
      }
    } catch (err) {
      console.warn('Erro ao atualizar status da viagem no Firestore, atualizando localmente:', err);
      setViagens(prev => prev.map(t => t.id === tripId ? { ...t, status: 'enviada' } : t));
    }
  };

  // Approve Expense (Gestor / Controller)
  const handleApproveExpense = async (expenseId: string, stage?: 'first' | 'final') => {
    try {
      const nowIso = new Date().toISOString();
      const approverName = profile?.nome || 'Gestor';

      if (stage === 'first') {
        const updateData = {
          status_alcada: 'aguardando_segunda_aprovacao' as const,
          primeira_aprovacao_por: approverName,
          primeira_aprovacao_em: nowIso,
        };

        if (expenseId.startsWith('local_')) {
          setDespesas(prev => prev.map(d => d.id === expenseId ? { ...d, ...updateData } : d));
        } else {
          const expenseRef = doc(db, 'despesas', expenseId);
          await updateDoc(expenseRef, updateData);
        }
        setDespesas(prev => prev.map(d => d.id === expenseId ? { ...d, ...updateData } : d));

        if (user) {
          await addAuditLog(
            approverName,
            user.uid,
            `Realizou 1ª aprovação de alçada da despesa ID: ${expenseId}. Aguardando 2ª aprovação de diretoria/financeiro.`,
            'Painel de Aprovações',
            expenseId
          );
        }
      } else {
        const updateData = {
          status_aprovacao: 'aprovado' as const,
          status_alcada: 'aprovado' as const,
          segunda_aprovacao_por: approverName,
          segunda_aprovacao_em: nowIso,
        };

        if (expenseId.startsWith('local_')) {
          setDespesas(prev => prev.map(d => d.id === expenseId ? { ...d, ...updateData } : d));
        } else {
          const expenseRef = doc(db, 'despesas', expenseId);
          await updateDoc(expenseRef, updateData);
        }
        setDespesas(prev => prev.map(d => d.id === expenseId ? { ...d, ...updateData } : d));

        if (user) {
          await addAuditLog(
            approverName,
            user.uid,
            `Aprovou integralmente despesa ID: ${expenseId}`,
            'Painel de Aprovações',
            expenseId
          );
        }
      }
    } catch (err) {
      console.warn('Erro ao aprovar no Firestore, atualizando localmente:', err);
      setDespesas(prev => prev.map(d => d.id === expenseId ? { ...d, status_aprovacao: 'aprovado' } : d));
    }
  };

  // Reject Expense (Gestor)
  const handleRejectExpense = async (expenseId: string, justificativa: string) => {
    try {
      if (expenseId.startsWith('local_')) {
        setDespesas(prev => prev.map(d => d.id === expenseId ? { 
          ...d, 
          status_aprovacao: 'rejeitado',
          justificativa_rejeicao: justificativa 
        } : d));
      } else {
        const expenseRef = doc(db, 'despesas', expenseId);
        await updateDoc(expenseRef, {
          status_aprovacao: 'rejeitado',
          justificativa_rejeicao: justificativa
        });
      }
      setDespesas(prev => prev.map(d => d.id === expenseId ? { 
        ...d, 
        status_aprovacao: 'rejeitado',
        justificativa_rejeicao: justificativa 
      } : d));

      if (user) {
        await addAuditLog(
          profile?.nome || 'Gestor',
          user.uid,
          `Reprovou despesa ID: ${expenseId}. Justificativa: ${justificativa}`,
          'Painel de Aprovações Gestor',
          expenseId
        );
      }
    } catch (err) {
      console.warn('Erro ao reprovar no Firestore, atualizando localmente:', err);
      setDespesas(prev => prev.map(d => d.id === expenseId ? { 
        ...d, 
        status_aprovacao: 'rejeitado',
        justificativa_rejeicao: justificativa 
      } : d));
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      if (!expenseId.startsWith('local_')) {
        await deleteDoc(doc(db, 'despesas', expenseId));
      }
      setDespesas(prev => prev.filter(d => d.id !== expenseId));
      if (user) {
        await addAuditLog(
          profile?.nome || 'Usuário',
          user.uid,
          `Excluiu despesa ID: ${expenseId}`,
          'Lista de Despesas'
        );
      }
    } catch (err) {
      console.error('Erro ao excluir despesa:', err);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#16324F] flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-[#35E08C] border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="text-[#35E08C] font-bold text-xl tracking-tight">NotaDiária</h1>
        <p className="text-xs text-slate-300 mt-1">Carregando autenticação via Firebase...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onSuccess={() => {}} onDemoSuccess={handleDemoSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Top Navbar */}
      <Navbar
        user={profile}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onSignOut={handleSignOut}
        isOnline={isOnline}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCapture={() => setIsCaptureModalOpen(true)}
        onOpenPaymentGateway={() => setIsPaymentGatewayOpen(true)}
        pendingApprovalsCount={despesas.filter(d => d.status_aprovacao === 'pendente').length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {activeTab === 'viagens' && (
              <TripsView
                viagens={viagens}
                despesas={despesas}
                onCreateTrip={handleCreateTrip}
                onDeleteTrip={handleDeleteTrip}
                onDeleteAllTrips={handleDeleteAllTrips}
                onSendTripForApproval={handleSendTripForApproval}
                onSelectTrip={(tripId) => {
                  setFilterTripId(tripId);
                  setActiveTab('despesas');
                }}
                onOpenCapture={() => setIsCaptureModalOpen(true)}
                onNavigateTab={setActiveTab}
                onSignOut={handleSignOut}
              />
            )}

            {activeTab === 'despesas' && (
              <ExpensesView
                despesas={despesas}
                viagens={viagens}
                onOpenCapture={() => setIsCaptureModalOpen(true)}
                onDeleteExpense={handleDeleteExpense}
                filterTripId={filterTripId}
                onClearTripFilter={() => setFilterTripId(undefined)}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                despesas={despesas}
                viagens={viagens}
                onOpenCapture={() => setIsCaptureModalOpen(true)}
                onSelectTrip={(tripId) => {
                  setFilterTripId(tripId);
                  setActiveTab('despesas');
                }}
              />
            )}

            {activeTab === 'aprovacoes' && (
              <ApprovalsView
                despesas={despesas}
                viagens={viagens}
                onApproveExpense={handleApproveExpense}
                onRejectExpense={handleRejectExpense}
                currentRole={currentRole}
                currentUserId={user?.uid}
                currentUserName={profile?.nome}
              />
            )}

            {activeTab === 'compliance' && (
              <ComplianceView
                despesas={despesas}
                viagens={viagens}
                auditLogs={auditLogs}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanel onClose={() => setActiveTab('viagens')} />
            )}
      </main>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onReceiptProcessed={handleReceiptProcessed}
      />

      {/* Extracted Receipt Review & Confirm Modal */}
      <ReceiptConfirmModal
        isOpen={isConfirmModalOpen}
        extractedData={extractedReceiptData}
        viagens={viagens}
        onClose={() => setIsConfirmModalOpen(false)}
        onSaveExpense={handleSaveExpense}
      />

      {/* Payment Gateway Modal (Stripe, Asaas, Mercado Pago) */}
      <PaymentGatewayModal
        isOpen={isPaymentGatewayOpen}
        onClose={() => setIsPaymentGatewayOpen(false)}
        userEmail={profile?.email}
        userName={profile?.nome}
      />

      {/* Footer */}
      <footer className="bg-[#0E2338] text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-white">NotaDiária</span> — Prestação de Contas sem Digitar
            <span className="block sm:inline sm:ml-2 text-[10px] text-slate-500">
              SaaS B2B com Firebase Firestore & Gemini AI Vision
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <button
              onClick={() => {
                setLegalModalTab('privacy');
                setShowLegalModal(true);
              }}
              className="hover:text-white transition-colors underline underline-offset-2"
            >
              Política de Privacidade
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalModalTab('terms');
                setShowLegalModal(true);
              }}
              className="hover:text-white transition-colors underline underline-offset-2"
            >
              Termos de Uso
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCapture={() => setIsCaptureModalOpen(true)}
        currentRole={currentRole}
        pendingApprovalsCount={despesas.filter(d => d.status_aprovacao === 'pendente').length}
      />

      {/* Legal Documents Modal */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />

    </div>
  );
}
