// Datos del turista para el perfil y la pantalla de insignias.
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from './firebase';
import { num } from './escape';
import { computeBadges, type BadgeResult, type SeasonalBadge } from './badges';

export interface UserData {
  places: any[];
  reviews: any[];
  photos: any[];
  seasonal: SeasonalBadge[];
}

export async function loadUserData(uid: string): Promise<UserData> {
  const [rSnap, fSnap, sSnap] = await Promise.all([
    getDocs(query(collection(db, 'reviews'), where('userId', '==', uid))),
    getDocs(query(collection(db, 'photos'), where('userId', '==', uid))),
    getDocs(collection(db, 'seasonalBadges')).catch(() => null),
  ]);
  const reviews = rSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any))
    .sort((a: any, b: any) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  const photos = fSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any))
    .sort((a: any, b: any) => num(b.votes) - num(a.votes));
  // Solo los lugares donde esta persona tiene reseñas o fotos (de 30 en 30), no todo el mapa.
  const ids = [...new Set([...reviews, ...photos].map((x: any) => x.placeId).filter(Boolean))] as string[];
  const groups = Array.from({ length: Math.ceil(ids.length / 30) }, (_, i) => ids.slice(i * 30, i * 30 + 30));
  const pSnaps = await Promise.all(groups.map((g) => getDocs(query(collection(db, 'places'), where(documentId(), 'in', g))).catch(() => null)));
  return {
    places: pSnaps.flatMap((sn) => sn?.docs || []).map((d) => ({ id: d.id, ...d.data(), lat: Number(d.data().lat), lng: Number(d.data().lng) })),
    reviews,
    photos,
    seasonal: (sSnap?.docs || []).map((d) => ({ id: d.id, ...d.data() } as SeasonalBadge)),
  };
}

// Todas las insignias del turista. Las de temporada vencidas solo cuentan si se ganaron.
export function userBadges(data: UserData): BadgeResult[] {
  const today = new Date().toLocaleDateString('en-CA');
  return computeBadges(data.reviews, data.photos.length, data.places, data.seasonal)
    .filter((b) => !b.seasonal || b.earned || (data.seasonal.find((s) => `s_${s.id}` === b.id)?.end ?? '') >= today);
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}${y !== new Date().getFullYear() ? ` de ${y}` : ''}`;
};

// Etiqueta de las de temporada: "De temporada" si ya se ganó, o hasta cuándo se puede ganar.
export function seasonalTag(b: BadgeResult, seasonal: SeasonalBadge[]): string {
  if (!b.seasonal) return '';
  const s = seasonal.find((x) => `s_${x.id}` === b.id);
  return b.earned ? 'De temporada' : s ? `Hasta el ${fmtDay(s.end)}` : '';
}
