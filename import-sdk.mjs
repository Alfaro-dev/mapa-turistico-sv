import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = {
  projectId: "mapsv-1776175535",
  apiKey: "AIzaSyB01qLkC_RLRSeJfUf_5SGZFAm8WlA8YNE",
  appId: "1:897169231805:web:3565ee604ed9d4d9114cd4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const places = JSON.parse(readFileSync('./places.json', 'utf8'));

async function importAll() {
  console.log('Importando ' + places.length + ' lugares...');
  
  // Sign in anonymously to get auth token
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('Auth OK:', userCredential.user.uid);
  } catch (err) {
    console.error('Auth error:', err.message);
    return;
  }
  
  let count = 0;
  
  for (const place of places) {
    if (!place.name || !place.category) continue;
    
    const name = place.name.trim();
    
    try {
      await addDoc(collection(db, 'places'), {
        name,
        category: place.category,
        lat: place.lat || 0,
        lng: place.lng || 0,
        municipality: place.municipality || '',
        department: place.department || '',
        description: place.description || '',
        price: place.price || '',
        schedule: place.schedule || '',
        recommendations: place.recommendations || [],
        photos: place.photos || [],
        visitCount: Math.floor(Math.random() * 50) + 5
      });
      count++;
      console.log('OK ' + count + '/' + places.length + ': ' + name);
    } catch (err) {
      console.error('ERR: ' + name + ' - ' + err.message);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n✅ ' + count + ' lugares importados!');
}

importAll();
