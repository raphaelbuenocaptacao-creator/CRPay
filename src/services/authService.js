import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export async function registerUser({ name, email, password, phone = '' }) {
  if (!auth || !db) throw new Error('Firebase não configurado.');

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await setDoc(doc(db, 'users', credential.user.uid), {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone,
    role: 'borrower',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    profileComplete: false,
  }, { merge: true });

  return credential.user;
}

export async function loginUser(email, password) {
  if (!auth) throw new Error('Firebase não configurado.');
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}
