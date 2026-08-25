import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste dispositivo.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(normalizePosition(position)),
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}

export function watchConsentedLocation(onPosition, onError) {
  if (!navigator.geolocation) {
    onError?.(new Error('Geolocalização não suportada neste dispositivo.'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => onPosition(normalizePosition(position)),
    onError,
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 10000,
    },
  );
}

export function stopLocationWatch(watchId) {
  if (watchId !== null && watchId !== undefined && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

export async function saveConsentedLocation(uid, location) {
  if (!db || !uid) return;

  const consentRef = doc(db, 'users', uid, 'privacy', 'location');
  await setDoc(consentRef, {
    enabled: true,
    lastUpdatedAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(doc(db, 'users', uid), {
    lastLocation: {
      ...location,
      updatedAt: serverTimestamp(),
    },
  }, { merge: true });

  await addDoc(collection(db, 'users', uid, 'locationHistory'), {
    ...location,
    createdAt: serverTimestamp(),
  });
}

export async function setLocationSharingEnabled(uid, enabled) {
  if (!db || !uid) return;
  await setDoc(doc(db, 'users', uid, 'privacy', 'location'), {
    enabled,
    changedAt: serverTimestamp(),
  }, { merge: true });
}

function normalizePosition(position) {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    heading: position.coords.heading,
    speed: position.coords.speed,
    capturedAt: new Date(position.timestamp).toISOString(),
  };
}
