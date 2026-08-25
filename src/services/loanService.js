import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const LOAN_STATUS = {
  PENDING: 'EM_ANALISE',
  APPROVED: 'APROVADO',
  ACTIVE: 'ATIVO',
  LATE: 'ATRASADO',
  PAID: 'PAGO',
  REJECTED: 'RECUSADO',
};

export function calculateLoanSummary(loan, now = new Date()) {
  const principal = Number(loan.principal || 0);
  const interestRate = Number(loan.interestRate || 0);
  const dailyLateFee = Number(loan.dailyLateFee || 0);
  const dueDate = loan.dueDate?.toDate ? loan.dueDate.toDate() : new Date(loan.dueDate);
  const baseTotal = principal + (principal * interestRate / 100);
  const diffMs = now.setHours(0,0,0,0) - new Date(dueDate).setHours(0,0,0,0);
  const daysLate = Math.max(0, Math.floor(diffMs / 86400000));
  const lateFeeTotal = daysLate * dailyLateFee;
  const updatedTotal = baseTotal + lateFeeTotal;

  return {
    principal,
    interestRate,
    baseTotal,
    dueDate,
    daysLate,
    lateFeeTotal,
    updatedTotal,
    daysRemaining: Math.max(0, Math.ceil((dueDate - new Date()) / 86400000)),
    displayStatus: loan.status === LOAN_STATUS.PAID
      ? LOAN_STATUS.PAID
      : daysLate > 0 && [LOAN_STATUS.APPROVED, LOAN_STATUS.ACTIVE].includes(loan.status)
        ? LOAN_STATUS.LATE
        : loan.status,
  };
}

export async function createLoanRequest(uid, payload) {
  if (!db) throw new Error('Firebase não configurado.');
  const ref = doc(collection(db, 'loans'));
  const createdAt = new Date();
  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + 30);

  await setDoc(ref, {
    borrowerId: uid,
    principal: Number(payload.principal),
    interestRate: Number(payload.interestRate || 0),
    dailyLateFee: Number(payload.dailyLateFee || 0),
    status: LOAN_STATUS.PENDING,
    requestedAt: serverTimestamp(),
    approvedAt: null,
    releasedAt: null,
    dueDate,
    paidAt: null,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getBorrowerLoans(uid) {
  if (!db) return [];
  const q = query(collection(db, 'loans'), where('borrowerId', '==', uid), orderBy('requestedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getLoan(loanId) {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'loans', loanId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
