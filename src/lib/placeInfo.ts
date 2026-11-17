// Datos ordenados de los lugares turísticos (los llena el admin por pasos) y cómo se muestran
// en el mapa y en la página de cada lugar. El horario usa lo mismo que los negocios (bizData).
import { withNote } from './bizData';
export { DAYS, emptyHours, scheduleText, openNow, hour12, withNote, type Hours } from './bizData';

export const DEPARTMENTS = ['Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad', 'La Paz', 'La Unión', 'Morazán', 'San Miguel', 'San Salvador', 'San Vicente', 'Santa Ana', 'Sonsonate', 'Usulután'];

export const ACCESS_MODES = [
  { id: 'carro', label: 'En carro' }, { id: 'bus', label: 'En bus' },
  { id: 'caminando', label: 'Caminando' }, { id: 'lancha', label: 'En lancha' },
];
export const ROADS = [
  { id: 'pavimentada', label: 'Calle pavimentada' }, { id: 'tierra', label: 'Calle de tierra' }, { id: '4x4', label: 'Se necesita 4x4' },
];
export const PARKING = [
  { id: 'no', label: 'No hay parqueo' }, { id: 'gratis', label: 'Parqueo gratis' }, { id: 'costo', label: 'Parqueo con costo' },
];
export const DIFFICULTY = [
  { id: 'facil', label: 'Fácil' }, { id: 'media', label: 'Media' }, { id: 'dificil', label: 'Difícil' },
];
export const DURATION = [
  { id: '1h', label: 'Menos de 1 hora' }, { id: '2h', label: '1 a 2 horas' }, { id: '4h', label: '2 a 4 horas' },
  { id: 'medio', label: 'Medio día' }, { id: 'dia', label: 'Todo el día' },
];
export const SEASONS = [
  { id: 'todo', label: 'Todo el año' }, { id: 'seca', label: 'Época seca (nov. a abr.)' }, { id: 'lluviosa', label: 'Época lluviosa (may. a oct.)' },
];
export const BEST_TIMES = [
  { id: 'temprano', label: 'Temprano' }, { id: 'mediodia', label: 'Al mediodía' }, { id: 'tarde', label: 'En la tarde' },
  { id: 'atardecer', label: 'Al atardecer' }, { id: 'noche', label: 'De noche' },
];
export const PLACE_AMENITIES = [
  { id: 'parqueo', label: 'Parqueo' }, { id: 'banos', label: 'Baños' }, { id: 'restaurantes', label: 'Restaurantes' },
  { id: 'tiendas', label: 'Tiendas' }, { id: 'guias', label: 'Guías' }, { id: 'seguridad', label: 'Seguridad o policía turística' },
  { id: 'mascotas', label: 'Pet friendly' }, { id: 'ninos', label: 'Apto para niños' }, { id: 'silla', label: 'Acceso en silla de ruedas' },
  { id: 'acampar', label: 'Área para acampar' }, { id: 'piscina', label: 'Piscina' }, { id: 'wifi', label: 'Wifi' },
];
const lab = (list: { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label || '';
const labs = (list: { id: string; label: string }[], ids?: string[]) => (ids || []).map((i) => lab(list, i)).filter(Boolean);

export interface Entry { type: 'gratis' | 'costo' | ''; local?: number; foreign?: number; note?: string }
const money = (n?: number) => (Number(n) > 0 ? `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}` : '');
// "Gratis" o "$3 nacionales · $5 extranjeros". Sirve también como texto de siempre (campo price).
export function entryText(e?: Entry | null): string {
  if (!e?.type) return '';
  if (e.type === 'gratis') return withNote('Gratis', e.note);
  const parts = [money(e.local) && `${money(e.local)}${money(e.foreign) ? ' nacionales' : ''}`, money(e.foreign) && `${money(e.foreign)} extranjeros`].filter(Boolean);
  return withNote(parts.join(' · ') || 'Con costo', e.note);
}

export interface Access { modes?: string[]; road?: string; parking?: string; parkingCost?: number; notes?: string }
export function accessLines(a?: Access | null): string[] {
  if (!a) return [];
  return [
    labs(ACCESS_MODES, a.modes).map((x, i) => (i ? x.charAt(0).toLowerCase() + x.slice(1) : x)).join(', '),
    lab(ROADS, a.road || ''),
    a.parking === 'costo' && money(a.parkingCost) ? `Parqueo ${money(a.parkingCost)}` : lab(PARKING, a.parking || ''),
    (a.notes || '').trim(),
  ].filter(Boolean) as string[];
}

// Lo que se muestra como "datos de la visita": dificultad, duración, mejor época y hora.
export function visitFacts(p: any): { label: string; value: string }[] {
  return [
    p.difficulty && { label: 'Dificultad', value: lab(DIFFICULTY, p.difficulty) },
    p.duration && { label: 'Duración', value: lab(DURATION, p.duration) },
    (p.seasons || []).length && { label: 'Mejor época', value: labs(SEASONS, p.seasons).join(', ') },
    (p.bestTimes || []).length && { label: 'Mejor hora', value: labs(BEST_TIMES, p.bestTimes).join(', ') },
  ].filter((x): x is { label: string; value: string } => !!x && !!x.value);
}
export const placeAmenityLabels = (ids?: string[]) => labs(PLACE_AMENITIES, ids);
