// Datos para las páginas que se generan al publicar el sitio (una por lugar, índice y mapa del sitio).
// Se leen de Firestore por REST, sin clave: las reglas dejan leer lugares, reseñas y fotos a cualquiera.
export const SITE = 'https://mapa.carlosalfaro.dev';
const BASE = 'https://firestore.googleapis.com/v1/projects/mapsv-1776175535/databases/(default)/documents';

export const CATEGORY_NAMES: Record<string, string> = {
  playa: 'Playa', montaña: 'Volcán o montaña', histórico: 'Sitio histórico', gastronomía: 'Comida',
  cultura: 'Cultura', aventura: 'Aventura', río: 'Río o cascada', lago: 'Lago o laguna', mirador: 'Mirador', pueblo: 'Pueblo', other: 'Lugar',
};
// Plural para el índice de lugares.
export const CATEGORY_PLURAL: Record<string, string> = {
  playa: 'Playas', montaña: 'Volcanes y montañas', histórico: 'Sitios históricos', gastronomía: 'Comida',
  cultura: 'Cultura', aventura: 'Aventura', río: 'Ríos y cascadas', lago: 'Lagos y lagunas', mirador: 'Miradores', pueblo: 'Pueblos', other: 'Otros lugares',
};

// Ícono por categoría para los lugares sin foto (los mismos del mapa).
export const CAT_ICON: Record<string, string> = {
  montaña: '<path d="M3 20l6-11 3 4 2-3 7 10z"></path>',
  playa: '<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"></path><circle cx="17" cy="6" r="2.5"></circle>',
  lago: '<path d="M3 16c3-5 15-5 18 0-3 4-15 4-18 0z"></path><path d="M6 9l3-4 3 4M12 9l3-4 3 4"></path>',
  mirador: '<circle cx="7" cy="14" r="3.5"></circle><circle cx="17" cy="14" r="3.5"></circle><path d="M10.5 14h3M5 10.5L7 5h3M19 10.5L17 5h-3"></path>',
  pueblo: '<path d="M3 21h18M5 21V10l5-4 5 4v11M15 21v-7h4v7M9 21v-4h2v4"></path>',
  histórico: '<path d="M3 21h18M5 21V11M9 21V11M15 21V11M19 21V11M3 11l9-6 9 6z"></path>',
  cultura: '<path d="M12 3a9 9 0 100 18c1.1 0 1.5-.8 1.5-1.5 0-.9-.6-1.3-.6-2.1 0-.9.7-1.4 1.6-1.4H17a4 4 0 004-4c0-5-4-9-9-9z"></path><circle cx="7.5" cy="11" r="1"></circle><circle cx="10" cy="7" r="1"></circle><circle cx="15" cy="7.5" r="1"></circle>',
  río: '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 01-12 0c0-3.5 3-7 6-11z"></path>',
  aventura: '<path d="M7 8a5 5 0 0110 0v12H7z"></path><path d="M9 4.5V3h6v1.5M7 13h10"></path>',
  gastronomía: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M16 3c-1.7 0-3 2-3 5s1.3 4 3 4v9"></path>',
  other: '<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"></path><circle cx="12" cy="10" r="2.5"></circle>',
};
export const catIcon = (c: string, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CAT_ICON[c] || CAT_ICON.other}</svg>`;

export interface SitePlace {
  id: string; name: string; category: string; lat: number; lng: number;
  description: string; municipality: string; department: string; schedule: string; price: string; website: string;
  recommendations: string[]; photos: string[]; visitCount: number;
  cover: string; rating: number; reviewCount: number; reviews: SiteReview[]; photoCount: number;
}
export interface SiteReview { userName: string; rating: number; comment: string; visitDate: string; verified: boolean; created: string }

// Convierte el formato de valores de Firestore REST a valores normales.
function val(v: any): any {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]));
  return null;
}
async function list(col: string) {
  const out: any[] = [];
  let token = '';
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`${BASE}/${col}?pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`);
    if (!res.ok) throw new Error(`Firestore ${col}: ${res.status}`);
    const json: any = await res.json();
    (json.documents || []).forEach((d: any) => out.push({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, x]) => [k, val(x)])) }));
    if (!json.nextPageToken) break;
    token = json.nextPageToken;
  }
  return out;
}

const VAGUE = /^(todo el d[ií]a|de d[ií]a|abierto todo el d[ií]a|todos los d[ií]as|abierto|consult[aá].*|var[ií]a.*|n\/a|-)$/i;
export const specific = (v?: string) => !!v && !VAGUE.test(v.trim());
export const priceText = (v: string) => /^gratis$/i.test(v) ? 'Entrada gratis' : /^con costo$/i.test(v) ? 'Entrada con costo' : v;
// Los lugares de prueba no se publican como páginas.
const isDemo = (p: any) => p.demo === true || /^demo-/.test(p.id) || /\(prueba\)/i.test(p.name || '');

let cache: Promise<SitePlace[]> | null = null;
export function loadPlaces(): Promise<SitePlace[]> {
  cache ||= (async () => {
    let places: any[], photos: any[] = [], reviews: any[] = [];
    try {
      [places, photos, reviews] = await Promise.all([list('places'), list('photos').catch(() => []), list('reviews').catch(() => [])]);
    } catch (err) {
      // Sin conexión a Firestore (por ejemplo, al compilar sin internet): se usan los lugares base del repositorio.
      console.warn('[siteData] No se pudo leer Firestore; uso seed/places-sv.json.', (err as Error).message);
      const { readFile } = await import('node:fs/promises');
      places = JSON.parse(await readFile(`${process.cwd()}/seed/places-sv.json`, 'utf8'));
    }
    return places.filter((p) => !isDemo(p) && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))).map((p) => {
      const ph = photos.filter((x) => x.placeId === p.id && x.url && !x.demo).sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const rv = reviews.filter((x) => x.placeId === p.id && !x.demo);
      const rated = rv.filter((x) => Number(x.rating) > 0);
      const cover = (ph[0]?.votes > 0 ? ph[0].url : '') || (p.photos || [])[0] || ph[0]?.url || '';
      return {
        id: p.id, name: p.name || 'Lugar', category: p.category || 'other', lat: Number(p.lat), lng: Number(p.lng),
        description: p.description || '', municipality: p.municipality || '', department: p.department || '',
        schedule: p.schedule || '', price: p.price || '', website: /^https?:\/\//.test(p.website || '') ? p.website : '',
        recommendations: p.recommendations || [], photos: p.photos || [], visitCount: Number(p.visitCount) || 0,
        cover, photoCount: ph.length + (p.photos || []).length,
        rating: rated.length ? rated.reduce((s, x) => s + Number(x.rating), 0) / rated.length : 0,
        reviewCount: rv.length,
        reviews: rv.filter((x) => x.comment).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6)
          .map((x) => ({ userName: x.userName || 'Visitante', rating: Number(x.rating) || 0, comment: String(x.comment), visitDate: x.visitDate || '', verified: !!x.verified, created: x.createdAt || '' })),
      } as SitePlace;
    }).sort((a, b) => b.visitCount - a.visitCount || a.name.localeCompare(b.name, 'es'));
  })();
  return cache;
}

export const placeUrl = (id: string) => `/lugar/${encodeURIComponent(id)}`;
// Imagen para compartir: la foto en 1200×630 recortada al centro (Cloudinary); otras URLs tal cual.
export const shareImage = (url: string) => url.includes('res.cloudinary.com/') ? url.replace('/upload/', '/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/') : url;
export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
