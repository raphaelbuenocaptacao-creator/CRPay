import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function getAllLoans() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'loans'), orderBy('requestedAt', 'desc')));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllUsers() {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setLoanStatus(loanId, status) {
  if (!db) throw new Error('Firebase não configurado.');
  const patch = { status, updatedAt: serverTimestamp() };
  if (status === 'APROVADO') patch.approvedAt = serverTimestamp();
  if (status === 'ATIVO') patch.releasedAt = serverTimestamp();
  if (status === 'PAGO') patch.paidAt = serverTimestamp();
  await updateDoc(doc(db, 'loans', loanId), patch);
}
