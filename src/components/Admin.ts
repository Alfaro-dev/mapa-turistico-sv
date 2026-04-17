import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, googleProvider, storage } from '../lib/firebase';

export interface TouristPlace {
  id?: string;
  name: string;
  category: 'playa' | 'montaña' | 'histórico' | 'gastronomía' | 'cultura' | 'aventura' | 'río' | 'lago';
  lat: number;
  lng: number;
  description: string;
  municipality: string;
  department: string;
  schedule: string;
  price: string;
  imageUrl: string;
  recommendations: string[];
}

export async function getPlaces(): Promise<TouristPlace[]> {
  const placesRef = collection(db, 'places');
  const q = query(placesRef, orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TouristPlace));
}

export async function addPlace(place: Omit<TouristPlace, 'id'>, imageFile?: File): Promise<string> {
  let imageUrl = place.imageUrl;
  
  if (imageFile) {
    const storageRef = ref(storage, `places/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(snapshot.ref);
  }
  
  const placesRef = collection(db, 'places');
  const docRef = await addDoc(placesRef, { ...place, imageUrl });
  return docRef.id;
}

export async function updatePlace(id: string, place: Partial<TouristPlace>, imageFile?: File): Promise<void> {
  let imageUrl = place.imageUrl;
  
  if (imageFile) {
    const storageRef = ref(storage, `places/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(snapshot.ref);
  }
  
  const placeRef = doc(db, 'places', id);
  await updateDoc(placeRef, { ...place, ...(imageUrl && { imageUrl }) });
}

export async function deletePlace(id: string): Promise<void> {
  const placeRef = doc(db, 'places', id);
  await deleteDoc(placeRef);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}
