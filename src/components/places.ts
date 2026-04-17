import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface ScheduleDay {
  open: string; // "08:00"
  close: string; // "17:00"
  closed: boolean;
}

export interface Place {
  id?: string;
  name: string;
  category: 'playa' | 'montaña' | 'histórico' | 'gastronomía' | 'cultura' | 'aventura' | 'río' | 'lago' | 'other';
  lat: number;
  lng: number;
  description: string;
  municipality: string;
  department: string;
  price: string;
  website?: string;
  createdAt?: any;
  createdBy?: string;
  visitCount?: number;
}

export interface PlaceSchedule {
  monday: ScheduleDay;
  tuesday: ScheduleDay;
  wednesday: ScheduleDay;
  thursday: ScheduleDay;
  friday: ScheduleDay;
  saturday: ScheduleDay;
  sunday: ScheduleDay;
}

export interface PlaceImage {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: any;
  uploadedBy: string;
}

export interface Review {
  id?: string;
  placeId: string;
  userId: string;
  userEmail: string;
  rating: number; // 1-5
  comment: string;
  photos: string[]; // minimum 2 required
  visitDate: string;
  createdAt?: any;
}

// Get all places
export async function getPlaces(): Promise<Place[]> {
  const placesRef = collection(db, 'places');
  const q = query(placesRef, orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));
}

// Get places by category
export async function getPlacesByCategory(category: string): Promise<Place[]> {
  const placesRef = collection(db, 'places');
  const q = query(placesRef, where('category', '==', category), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));
}

// Get top places by visit count
export async function getTopPlaces(limit = 10): Promise<Place[]> {
  const placesRef = collection(db, 'places');
  const q = query(placesRef, orderBy('visitCount', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as Place));
}

// Add new place
export async function addPlace(place: Omit<Place, 'id' | 'createdAt' | 'visitCount'>): Promise<string> {
  const placesRef = collection(db, 'places');
  const docRef = await addDoc(placesRef, {
    ...place,
    visitCount: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

// Update place
export async function updatePlace(id: string, data: Partial<Place>): Promise<void> {
  const placeRef = doc(db, 'places', id);
  await updateDoc(placeRef, data);
}

// Increment visit count
export async function incrementVisitCount(placeId: string): Promise<void> {
  const placeRef = doc(db, 'places', placeId);
  const placesRef = collection(db, 'places');
  const snapshot = await getDocs(placesRef);
  const place = snapshot.docs.find(d => d.id === placeId);
  if (place) {
    await updateDoc(placeRef, { visitCount: (place.data().visitCount || 0) + 1 });
  }
}

// Upload image
export async function uploadImage(file: File, userId: string): Promise<string> {
  const storageRef = ref(storage, `places/${userId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Get place images
export async function getPlaceImages(placeId: string): Promise<PlaceImage[]> {
  const imagesRef = collection(db, 'placeImages');
  const q = query(imagesRef, where('placeId', '==', placeId), orderBy('uploadedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaceImage));
}

// Add image to place
export async function addPlaceImage(placeId: string, url: string, caption: string, userId: string): Promise<void> {
  const imagesRef = collection(db, 'placeImages');
  await addDoc(imagesRef, {
    placeId,
    url,
    caption,
    uploadedAt: serverTimestamp(),
    uploadedBy: userId
  });
}

// Get place reviews
export async function getPlaceReviews(placeId: string): Promise<Review[]> {
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, where('placeId', '==', placeId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}

// Add review
export async function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const reviewsRef = collection(db, 'reviews');
  const docRef = await addDoc(reviewsRef, {
    ...review,
    createdAt: serverTimestamp()
  });
  // Increment visit count
  await incrementVisitCount(review.placeId);
  return docRef.id;
}

// Delete review
export async function deleteReview(reviewId: string): Promise<void> {
  const reviewRef = doc(db, 'reviews', reviewId);
  await deleteDoc(reviewRef);
}

// Get user's reviews
export async function getUserReviews(userId: string): Promise<Review[]> {
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}
