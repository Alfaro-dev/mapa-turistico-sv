// Datos de lugares que sirven igual al compilar y en el navegador: lectura de Firestore por REST y formato.
// Firestore se lee sin clave: las reglas dejan leer lugares, reseñas y fotos a cualquiera.
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
  cover: string; rating: number; reviewCount: number; reviews: SiteReview[]; photoCount: number; gallery: SitePhoto[];
}
// Foto de la galería: las de turistas (se votan) y después las del lugar.
export interface SitePhoto { id: string; url: string; votes: number; userId: string; userName: string }
export interface SiteReview { id: string; userId: string; userName: string; rating: number; comment: string; visitDate: string; verified: boolean; created: string }

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
export async function list(col: string) {
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


// Arma los lugares con su portada, nota y reseñas recientes.
export function buildPlaces(places: any[], photos: any[], reviews: any[]): SitePlace[] {
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
        gallery: [
          ...ph.map((x) => ({ id: x.id, url: String(x.url), votes: Number(x.votes) || 0, userId: x.userId || '', userName: x.userName || '' })),
          ...(p.photos || []).filter((u: string) => /^https?:\/\//.test(u || '')).map((u: string) => ({ id: '', url: u, votes: 0, userId: '', userName: '' })),
        ].slice(0, 24),
        reviews: rv.filter((x) => x.comment).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 10)
          .map((x) => ({ id: x.id, userId: x.userId || '', userName: x.userName || 'Visitante', rating: Number(x.rating) || 0, comment: String(x.comment), visitDate: x.visitDate || '', verified: !!x.verified, created: x.createdAt || '' })),
      } as SitePlace;
  }).sort((a, b) => b.visitCount - a.visitCount || a.name.localeCompare(b.name, 'es'));
}

export const placeUrl = (id: string) => `/lugar/${encodeURIComponent(id)}`;
// Imagen para compartir: la foto en 1200×630 recortada al centro (Cloudinary); otras URLs tal cual.
export const shareImage = (url: string) => url.includes('res.cloudinary.com/') ? url.replace('/upload/', '/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/') : url;
export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- Lectura en vivo desde el navegador ----------
const fields = (d: any) => ({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, x]) => [k, val(x)])) });
async function byPlace(col: string, id: string) {
  const res = await fetch(`${BASE}:runQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: col }], where: { fieldFilter: { field: { fieldPath: 'placeId' }, op: 'EQUAL', value: { stringValue: id } } } } }),
  });
  if (!res.ok) return [];
  return ((await res.json()) as any[]).filter((r) => r.document).map((r) => fields(r.document));
}
// Trae el lugar con sus reseñas y fotos de hoy, y los demás lugares para "Cerca de aquí".
export async function loadPlaceLive(id: string): Promise<{ place: SitePlace; all: SitePlace[] } | null> {
  const [doc, photos, reviews, places] = await Promise.all([
    fetch(`${BASE}/places/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : null)),
    byPlace('photos', id), byPlace('reviews', id), list('places').catch(() => []),
  ]);
  if (!doc) return null;
  const place = buildPlaces([fields(doc)], photos, reviews)[0];
  if (!place) return null;
  return { place, all: buildPlaces(places, [], []).map((x) => (x.id === id ? place : x)) };
}

// ---------- Cómo se ve la página de un lugar (la misma al compilar y en vivo) ----------
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const cld = (url: string, t: string) => (url.includes('res.cloudinary.com/') ? url.replace('/upload/', `/upload/${t}/`) : url);
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fmtDate = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : ''; };
const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
const fmtKm = (km: number) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

export const placeWhere = (p: SitePlace) => [p.municipality, p.department].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
export const placeShort = (p: SitePlace) => (p.description || `${CATEGORY_NAMES[p.category] || 'Lugar'} en ${placeWhere(p) || 'El Salvador'}.`).replace(/\s+/g, ' ').trim();
export const placeTitle = (p: SitePlace) => `${p.name}${placeWhere(p) ? ` en ${p.municipality || p.department}` : ''} · Goz`;
export function nearby(p: SitePlace, all: SitePlace[]) {
  return all.filter((x) => x.id !== p.id).map((x) => ({ x, km: distanceKm([p.lat, p.lng], [x.lat, x.lng]) })).sort((a, b) => a.km - b.km).slice(0, 4);
}

export function renderPlace(p: SitePlace, all: SitePlace[]): string {
  const cat = CATEGORY_NAMES[p.category] || 'Lugar';
  const where = placeWhere(p);
  const mapHref = `/#${encodeURIComponent(p.id)}`;
  const facts = [
    specific(p.schedule) && `<div><dt>Horario</dt><dd>${esc(p.schedule)}</dd></div>`,
    specific(p.price) && `<div><dt>Entrada</dt><dd>${esc(priceText(p.price).replace(/^Entrada /, '').replace(/^./, (c) => c.toUpperCase()))}</dd></div>`,
    p.website && `<div><dt>Sitio web</dt><dd><a href="${esc(p.website)}" target="_blank" rel="noopener nofollow">${esc(p.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></dd></div>`,
  ].filter(Boolean).join('');
  const reviews = p.reviews.map((r) => {
    const meta = `${r.verified ? '<span class="lp-verified">Visita verificada</span>' : ''}${r.verified && r.visitDate ? ' · ' : ''}${r.visitDate ? `Fue el ${fmtDate(r.visitDate)}` : ''}`;
    const who = r.userId ? `<a href="/perfil?u=${encodeURIComponent(r.userId)}">${esc(r.userName)}</a>` : esc(r.userName);
    return `<li class="lp-review"><p class="lp-review-head"><strong>${who}</strong> <span class="lp-stars" aria-label="${r.rating} de 5">${stars(r.rating)}</span></p><p class="lp-review-meta">${meta}</p><p class="lp-text">${esc(r.comment)}</p>${r.id ? `<button type="button" class="lp-link-btn" data-report="review" data-target="${esc(r.id)}" data-owner="${esc(r.userId)}">Reportar</button>` : ''}</li>`;
  }).join('');
  const heart = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.5 0 5.6 3.4 4.3 6.7C19.5 16.4 12 21 12 21z"></path></svg>';
  const gallery = p.gallery.map((g, i) => `<li class="lp-ph">
    <button type="button" class="lp-ph-open" data-gal data-src="${esc(cld(g.url, 'q_auto,f_auto,w_1600'))}" data-cap="${esc(g.userName ? `Foto de ${g.userName}` : p.name)}" aria-label="Ver foto ${i + 1}"><img src="${esc(cld(g.url, 'c_fill,g_auto,w_400,h_300,q_auto,f_auto'))}" alt="" loading="lazy" width="400" height="300" /></button>
    ${g.id ? `<span class="lp-ph-bar"><button type="button" class="lp-vote" data-vote="${esc(g.id)}" aria-pressed="false" aria-label="Votar por esta foto, ${g.votes} ${g.votes === 1 ? 'voto' : 'votos'}">${heart}<span>${g.votes}</span></button><button type="button" class="lp-link-btn" data-report="photo" data-target="${esc(g.id)}" data-owner="${esc(g.userId)}">Reportar</button></span>` : ''}
  </li>`).join('');
  const near = nearby(p, all).map(({ x, km }) => `<li><a href="${placeUrl(x.id)}" class="lp-near-card">${x.cover
    ? `<img src="${esc(cld(x.cover, 'c_fill,g_auto,w_320,h_220,q_auto,f_auto'))}" alt="" loading="lazy" width="320" height="220" />`
    : `<span class="lp-near-empty" aria-hidden="true">${catIcon(x.category, 30)}</span>`}<span class="lp-near-name">${esc(x.name)}</span><span class="lp-near-meta">${CATEGORY_NAMES[x.category] || 'Lugar'} · a ${fmtKm(km)}</span></a></li>`).join('');

  return `<nav class="lp-crumbs" aria-label="Estás en"><a href="/lugares">Lugares</a><span aria-hidden="true">›</span><a href="/lugares#${esc(p.category)}">${CATEGORY_PLURAL[p.category] || 'Lugares'}</a><span aria-hidden="true">›</span><span aria-current="page">${esc(p.name)}</span></nav>
<article class="lp-main">
${p.cover
    ? `<figure class="lp-cover"><img src="${esc(cld(p.cover, 'c_fill,g_auto,w_1400,h_700,q_auto,f_auto'))}" alt="Foto de ${esc(p.name)}" width="1400" height="700" fetchpriority="high" /></figure>`
    : `<div class="lp-cover-empty" aria-hidden="true">${catIcon(p.category, 44)}</div>`}
<header class="lp-head">
<p class="lp-cat">${cat}${where ? ` · ${esc(where)}` : ''}</p>
<h1 class="lp-h1">${esc(p.name)}</h1>
${p.reviewCount > 0 && p.rating > 0
    ? `<p class="lp-rating"><span class="lp-stars" aria-hidden="true">${stars(p.rating)}</span> <strong>${p.rating.toFixed(1)}</strong> de 5 · ${p.reviewCount} ${p.reviewCount === 1 ? 'reseña' : 'reseñas'}</p>`
    : '<p class="lp-rating lp-muted">Todavía sin reseñas. ¿Y vos, ya fuiste?</p>'}
<div class="lp-actions"><a class="lp-btn lp-btn-primary" href="${mapHref}">Ver en el mapa</a><a class="lp-btn" href="https://www.google.com/maps/dir/?api=1&amp;destination=${p.lat},${p.lng}" target="_blank" rel="noopener">Cómo llegar</a><button type="button" class="lp-btn" data-share-page data-title="${esc(p.name)}">Compartir</button></div>
<p class="lp-muted lp-share-msg" data-share-msg role="status"></p>
</header>
${facts ? `<dl class="lp-facts">${facts}</dl>` : ''}
${p.description ? `<section class="lp-sec"><h2 class="lp-h2">Cómo es</h2><p class="lp-text">${esc(p.description)}</p></section>` : ''}
${p.recommendations.length ? `<section class="lp-sec"><h2 class="lp-h2">Qué hacer</h2><ul class="lp-chips">${p.recommendations.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>` : ''}
<section class="lp-sec"><div class="lp-sec-head"><h2 class="lp-h2">Fotos de quienes fueron</h2><button type="button" class="lp-btn lp-btn-outline lp-btn-sm" data-add-photo>Subir foto</button></div>
${gallery ? `<p class="lp-muted lp-help">Votá por tu favorita: la más votada queda de portada.</p><ul class="lp-gallery" data-gal-group>${gallery}</ul>` : '<p class="lp-muted">Nadie ha subido fotos de aquí todavía. ¿Tenés una?</p>'}
<p class="lp-muted lp-help" data-photo-status role="status"></p></section>
<section class="lp-sec"><div class="lp-sec-head"><h2 class="lp-h2">Lo que dicen quienes ya fueron</h2><button type="button" class="lp-btn lp-btn-primary lp-btn-sm" data-write-review>Escribir reseña</button></div>
${reviews ? `<ul class="lp-reviews">${reviews}</ul>` : '<p class="lp-muted">Nadie ha contado su visita todavía. Sé la primera persona.</p>'}
${p.reviewCount > p.reviews.length ? `<a class="lp-btn lp-btn-outline" href="${mapHref}">Ver las ${p.reviewCount} reseñas en el mapa</a>` : ''}</section>
${near ? `<section class="lp-sec"><h2 class="lp-h2">Cerca de aquí</h2><ul class="lp-near">${near}</ul></section>` : ''}
</article>`;
}

// Compartir desde la página: el menú del teléfono si existe; si no, copia el enlace.
export function wireShare(root: HTMLElement) {
  root.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('[data-share-page]') as HTMLElement | null;
    if (!btn) return;
    const url = `${location.origin}${location.pathname}?ref=compartir`;
    const title = btn.dataset.title || document.title;
    try {
      if (navigator.share) { await navigator.share({ title, text: `${title} en Goz`, url }); return; }
      await navigator.clipboard.writeText(url);
      const msg = root.querySelector('[data-share-msg]');
      if (msg) msg.textContent = 'Enlace copiado. Pegalo donde querás compartirlo.';
    } catch { /* la persona canceló */ }
  });
}
