// Insignias de Goz. Se calculan a partir de las reseñas y fotos del turista,
// así no hay que guardarlas aparte. Son las mismas que define la app.

export interface BadgeReview { placeId: string; verified?: boolean; createdAt?: any }
export interface BadgePlace { id: string; category: string }
export interface SeasonalBadge {
  id: string; name: string; description?: string; placeId: string;
  start: string; end: string; // fechas AAAA-MM-DD, incluidas
}

export interface BadgeResult {
  id: string; name: string; description: string; icon: string;
  count: number; required: number; earned: boolean; seasonal?: boolean;
}

const ICONS: Record<string, string> = {
  volcan: '<path d="M3 20l6-11 3 4 2-3 7 10z"></path><path d="M10 5l1-2M13 5l1-2"></path>',
  ola: '<path d="M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"></path><circle cx="17" cy="6" r="2.5"></circle>',
  lago: '<path d="M3 16c3-5 15-5 18 0-3 4-15 4-18 0z"></path><path d="M6 9l3-4 3 4M12 9l3-4 3 4"></path>',
  sol: '<circle cx="12" cy="13" r="4"></circle><path d="M12 3v3M4 13H2M22 13h-2M5.6 6.6l1.4 1.4M18.4 6.6L17 8M3 20h18"></path>',
  luna: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"></path>',
  comida: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M16 3c-1.7 0-3 2-3 5s1.3 4 3 4v9"></path>',
  pupusa: '<ellipse cx="12" cy="13" rx="9" ry="6"></ellipse><path d="M7 12c1 1 2 1 3 0M13 14c1 1 2 1 3 0"></path>',
  bandera: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"></path>',
  brujula: '<circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5z"></path>',
  camara: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle>',
  resena: '<path d="M4 5h16v11H9l-5 4z"></path><path d="M8 9h8M8 12h5"></path>',
  verificado: '<path d="M12 3l2.4 1.8 3-.1.9 2.8 2.4 1.8-.9 2.8.9 2.8-2.4 1.8-.9 2.8-3-.1L12 21l-2.4-1.8-3 .1-.9-2.8L3.3 14.7l.9-2.8-.9-2.8L5.7 7.3l.9-2.8 3 .1z"></path><path d="M8.5 12l2.5 2.5 4.5-5"></path>',
  estrella: '<path d="M12 3l2.7 5.6 6.2.9-4.5 4.4 1 6.1L12 17.1 6.6 20l1-6.1L3.1 9.5l6.2-.9z"></path>',
};

export const badgeIcon = (name: string, size = 28) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.estrella}</svg>`;

function hourOf(createdAt: any): number | null {
  const d = createdAt?.toDate?.() ?? (typeof createdAt === 'string' ? new Date(createdAt) : null);
  return d && !isNaN(d.getTime()) ? d.getHours() : null;
}
function dayOf(createdAt: any): string | null {
  const d = createdAt?.toDate?.() ?? (typeof createdAt === 'string' ? new Date(createdAt) : null);
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-CA') : null;
}

export function computeBadges(
  reviews: BadgeReview[],
  photoCount: number,
  places: BadgePlace[],
  seasonal: SeasonalBadge[] = [],
): BadgeResult[] {
  const catOf: Record<string, string> = {};
  places.forEach((p) => { catOf[p.id] = p.category; });
  const distinct = (cat?: string) => new Set(reviews.filter((r) => !cat || catOf[r.placeId] === cat).map((r) => r.placeId)).size;
  const byHour = (test: (h: number) => boolean) => reviews.filter((r) => { const h = hourOf(r.createdAt); return h !== null && test(h); }).length;
  const verified = reviews.filter((r) => r.verified).length;

  const list: Omit<BadgeResult, 'earned'>[] = [
    { id: 'first_checkin', name: 'Primer paso', description: 'Tu primera reseña', icon: 'bandera', count: reviews.length, required: 1 },
    { id: 'volcano_conqueror', name: 'Conquistador de volcanes', description: 'Reseña en 3 volcanes distintos', icon: 'volcan', count: distinct('montaña'), required: 3 },
    { id: 'salt_life', name: 'Vida de sal', description: 'Reseña en 5 playas distintas', icon: 'ola', count: distinct('playa'), required: 5 },
    { id: 'mountain_chill', name: 'Chill de montaña', description: 'Reseña en 3 lagos distintos', icon: 'lago', count: distinct('lago'), required: 3 },
    { id: 'pupusa_lover', name: 'Amante de pupusas', description: 'Reseña en 5 lugares de comida distintos', icon: 'pupusa', count: distinct('gastronomía'), required: 5 },
    { id: 'local_foodie', name: 'Foodie local', description: '10 reseñas de comida', icon: 'comida', count: reviews.filter((r) => catOf[r.placeId] === 'gastronomía').length, required: 10 },
    { id: 'early_bird', name: 'Madrugador', description: '5 reseñas antes de las 7 a. m.', icon: 'sol', count: byHour((h) => h < 7), required: 5 },
    { id: 'night_owl', name: 'Noctámbulo', description: '5 reseñas después de las 10 p. m.', icon: 'luna', count: byHour((h) => h >= 22), required: 5 },
    { id: 'explorer_10', name: 'Explorador', description: '10 lugares visitados', icon: 'brujula', count: distinct(), required: 10 },
    { id: 'explorer_25', name: 'Aventurero', description: '25 lugares visitados', icon: 'brujula', count: distinct(), required: 25 },
    { id: 'explorer_50', name: 'Conquistador', description: '50 lugares visitados', icon: 'brujula', count: distinct(), required: 50 },
    { id: 'photo_pro', name: 'Fotógrafo pro', description: '20 fotos subidas', icon: 'camara', count: photoCount, required: 20 },
    { id: 'reviewer', name: 'Crítico', description: '10 reseñas escritas', icon: 'resena', count: reviews.length, required: 10 },
    { id: 'verified_visits', name: 'Viajero verificado', description: '10 visitas verificadas en el lugar', icon: 'verificado', count: verified, required: 10 },
  ];

  // De temporada: una reseña con visita verificada en ese lugar, entre esas fechas.
  const seasonalResults = seasonal.map((s) => {
    const hit = reviews.some((r) => {
      const day = dayOf(r.createdAt);
      return r.placeId === s.placeId && r.verified && day !== null && day >= s.start && day <= s.end;
    });
    return { id: `s_${s.id}`, name: s.name, description: s.description || '', icon: 'estrella', count: hit ? 1 : 0, required: 1, seasonal: true };
  });

  return [...seasonalResults, ...list].map((b) => ({ ...b, earned: b.count >= b.required }));
}
