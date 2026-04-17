import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

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

export async function loadPlacesFromFirebase(): Promise<TouristPlace[]> {
  try {
    const placesRef = collection(db, 'places');
    const q = query(placesRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TouristPlace));
  } catch (err) {
    console.error('Error loading places from Firebase:', err);
    return [];
  }
}
