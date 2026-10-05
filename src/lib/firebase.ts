import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Viagem, Despesa, AuditoriaLog, UserRole } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use the databaseId specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Enable offline persistence if available safely
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn('Firestore persistence notice:', err?.message || err);
    });
  } catch (e) {
    console.warn('Firestore persistence init skipped:', e);
  }
}

// User Profile Operations
export async function syncUserProfile(user: User, preferredRole: UserRole = 'funcionario', name?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    nome: name || user.displayName || user.email?.split('@')[0] || 'Usuário',
    email: user.email || '',
    empresa_id: 'empresa_demo_1',
    perfil: preferredRole,
    cargo: preferredRole === 'gestor' ? 'Gestor de Contas' : preferredRole === 'financeiro' ? 'Analista de Compliance' : 'Consultor de Campo',
    avatarUrl: user.photoURL || ''
  };

  // Strip any undefined keys to guarantee Firestore setDoc validity
  const sanitizedDoc: Record<string, any> = {};
  for (const [key, value] of Object.entries(newProfile)) {
    if (value !== undefined) {
      sanitizedDoc[key] = value;
    }
  }

  await setDoc(userDocRef, sanitizedDoc);
  return newProfile;
}

export async function updateUserRoleInDb(uid: string, newRole: UserRole): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, { perfil: newRole }, { merge: true });
}

// Log audit trail to Firestore
export async function addAuditLog(usuarioNome: string, usuarioId: string, acao: string, origem: string = 'Mobile App', despesaId?: string, detalhes?: string) {
  try {
    const auditRef = collection(db, 'auditoria');
    await addDoc(auditRef, {
      usuario: usuarioNome,
      usuario_id: usuarioId,
      acao,
      timestamp: new Date().toISOString(),
      origem,
      despesa_id: despesaId || null,
      detalhes: detalhes || ''
    });
  } catch (err) {
    console.error('Erro ao registrar auditoria:', err);
  }
}
