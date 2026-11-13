import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID'
};

export const app = initializeApp(firebaseConfig);

// App Check: solo el sitio de Goz (con reCAPTCHA de Google, invisible) puede usar la base de datos.
// La clave solo funciona en mapa.carlosalfaro.dev; en otros dominios no se activa.
const APP_CHECK_KEY = import.meta.env.PUBLIC_RECAPTCHA_KEY || '6LdAxh4uAAAAAFRZ9-t3fJl3dCC1Q-1n-cOTvZOj';
if (typeof window !== 'undefined' && /(^|\.)carlosalfaro\.dev$|gozsv\.com$/.test(location.hostname)) {
  try {
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(APP_CHECK_KEY), isTokenAutoRefreshEnabled: true });
  } catch (err) { console.error('App Check no se pudo iniciar:', err); }
}
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
