import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export async function saveProfile(uid, data) {
  if (!db) throw new Error('Firebase não configurado.');
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function uploadUserFile(uid, file, kind = 'document') {
  if (!storage) throw new Error('Firebase Storage não configurado.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileRef = ref(storage, `users/${uid}/${kind}/${Date.now()}-${safeName}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
