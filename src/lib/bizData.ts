// Datos de los negocios que comparten el formulario (/negocios), el mapa y el admin:
// tipos, servicios, formas de pago, horario por día, precios y teléfonos de El Salvador.
// Cada tipo nuevo cae en una de las 5 categorías de siempre (hotel, restaurante, cafeteria, tienda, otro)
// para que la app y lo que ya existe sigan funcionando.

export interface BizType { id: string; label: string; base: string }
export interface BizGroup { id: string; label: string; unit: string; items: string; types: BizType[] }

export const GROUPS: BizGroup[] = [
  { id: 'comida', label: 'Comida', unit: 'plato', items: 'Platos', types: [
    { id: 'restaurante', label: 'Restaurante', base: 'restaurante' }, { id: 'pupuseria', label: 'Pupusería', base: 'restaurante' },
    { id: 'cafeteria', label: 'Cafetería', base: 'cafeteria' }, { id: 'comedor', label: 'Comedor', base: 'restaurante' },
    { id: 'panaderia', label: 'Panadería', base: 'cafeteria' }, { id: 'bar', label: 'Bar', base: 'restaurante' },
  ] },
  { id: 'hospedaje', label: 'Hospedaje', unit: 'noche', items: 'Habitaciones', types: [
    { id: 'hotel', label: 'Hotel', base: 'hotel' }, { id: 'hostal', label: 'Hostal', base: 'hotel' },
    { id: 'cabana', label: 'Cabaña', base: 'hotel' }, { id: 'glamping', label: 'Glamping', base: 'hotel' },
    { id: 'casa-playa', label: 'Casa de playa', base: 'hotel' },
  ] },
  { id: 'tours', label: 'Tours y actividades', unit: 'persona', items: 'Tours y actividades', types: [
    { id: 'tour', label: 'Tour guiado', base: 'otro' }, { id: 'guia', label: 'Guía', base: 'otro' },
    { id: 'surf', label: 'Surf', base: 'otro' }, { id: 'renta-equipo', label: 'Renta de equipo', base: 'otro' },
  ] },
  { id: 'transporte', label: 'Transporte', unit: 'viaje', items: 'Viajes', types: [
    { id: 'lancha', label: 'Lancha', base: 'otro' }, { id: 'tuk-tuk', label: 'Tuk-tuk', base: 'otro' },
    { id: 'traslados', label: 'Traslados', base: 'otro' },
  ] },
  { id: 'tiendas', label: 'Tiendas', unit: 'producto', items: 'Productos', types: [
    { id: 'artesanias', label: 'Artesanías', base: 'tienda' }, { id: 'recuerdos', label: 'Recuerdos', base: 'tienda' },
    { id: 'mini-super', label: 'Mini súper', base: 'tienda' },
  ] },
  { id: 'servicios', label: 'Servicios', unit: 'servicio', items: 'Servicios', types: [
    { id: 'parqueo', label: 'Parqueo', base: 'otro' }, { id: 'banos', label: 'Baños', base: 'otro' },
  ] },
  { id: 'otro', label: 'Otro', unit: 'servicio', items: 'Lo que ofrecen', types: [{ id: 'otro', label: 'Otro', base: 'otro' }] },
];
const ALL_TYPES = GROUPS.flatMap((g) => g.types.map((t) => ({ ...t, group: g.id })));
export const typeOf = (id?: string) => ALL_TYPES.find((t) => t.id === id);
export const groupOf = (id?: string) => GROUPS.find((g) => g.id === id) || GROUPS[GROUPS.length - 1];
// Negocios de antes (solo categoría): se busca el tipo y grupo que les corresponde.
const LEGACY: Record<string, [string, string]> = { hotel: ['hospedaje', 'hotel'], restaurante: ['comida', 'restaurante'], cafeteria: ['comida', 'cafeteria'], tienda: ['tiendas', 'recuerdos'], otro: ['otro', 'otro'] };
export function bizKind(b: any): { group: string; type: string; label: string } {
  const t = typeOf(b?.type);
  if (t) return { group: t.group, type: t.id, label: t.label };
  const [g, ty] = LEGACY[b?.category] || LEGACY.otro;
  return { group: g, type: ty, label: ({ hotel: 'Hospedaje', restaurante: 'Restaurante', cafeteria: 'Cafetería', tienda: 'Tienda' } as Record<string, string>)[b?.category] || 'Negocio' };
}

// ---------- Servicios ----------
export const AMENITIES: { id: string; label: string; groups?: string[] }[] = [
  { id: 'mascotas', label: 'Pet friendly' },
  { id: 'ninos', label: 'Se aceptan niños' },
  { id: 'adultos', label: 'Solo adultos' },
  { id: 'wifi', label: 'Wifi' },
  { id: 'parqueo', label: 'Parqueo' },
  { id: 'silla', label: 'Acceso en silla de ruedas' },
  { id: 'aire', label: 'Aire acondicionado', groups: ['comida', 'hospedaje', 'transporte', 'tiendas'] },
  { id: 'piscina', label: 'Piscina', groups: ['hospedaje', 'comida'] },
  { id: 'desayuno', label: 'Desayuno incluido', groups: ['hospedaje'] },
  { id: 'llevar', label: 'Para llevar', groups: ['comida'] },
  { id: 'domicilio', label: 'A domicilio', groups: ['comida', 'tiendas'] },
  { id: 'vegetariano', label: 'Opciones vegetarianas', groups: ['comida'] },
  { id: 'equipo', label: 'Equipo incluido', groups: ['tours', 'transporte'] },
  { id: 'reservas', label: 'Se reserva por WhatsApp' },
];
export const amenitiesFor = (group: string) => AMENITIES.filter((a) => !a.groups || a.groups.includes(group));
export const amenityLabel = (id: string) => AMENITIES.find((a) => a.id === id)?.label || id;

export const PAYMENTS: { id: string; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' }, { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'transferencia', label: 'Transferencia' }, { id: 'bitcoin', label: 'Bitcoin' },
];
export const paymentLabel = (id: string) => PAYMENTS.find((p) => p.id === id)?.label || id;

// ---------- Precios ----------
export const PRICE_LEVELS = [
  { n: 1, sign: '$', label: 'Económico' }, { n: 2, sign: '$$', label: 'Moderado' },
  { n: 3, sign: '$$$', label: 'Alto' }, { n: 4, sign: '$$$$', label: 'Muy alto' },
];
const UNIT_TEXT: Record<string, string> = { plato: 'por plato', noche: 'por noche', persona: 'por persona', viaje: 'por viaje', producto: '', servicio: '' };
export function priceSummary(b: any) {
  const lv = PRICE_LEVELS.find((p) => p.n === Number(b?.priceLevel));
  const from = Number(b?.priceFrom) > 0 ? `desde $${Number(b.priceFrom).toFixed(Number(b.priceFrom) % 1 ? 2 : 0)}${UNIT_TEXT[b.priceUnit] ? ` ${UNIT_TEXT[b.priceUnit]}` : ''}` : '';
  return [lv?.sign, from].filter(Boolean).join(' · ');
}

// ---------- Horario por día ----------
export const DAYS = [
  { id: 'lun', label: 'Lunes', short: 'lun' }, { id: 'mar', label: 'Martes', short: 'mar' }, { id: 'mie', label: 'Miércoles', short: 'mié' },
  { id: 'jue', label: 'Jueves', short: 'jue' }, { id: 'vie', label: 'Viernes', short: 'vie' }, { id: 'sab', label: 'Sábado', short: 'sáb' },
  { id: 'dom', label: 'Domingo', short: 'dom' },
];
export type DayHours = { open: boolean; from: string; to: string };
export interface Hours { mode: 'dias' | '24h' | 'reservacion'; days: Record<string, DayHours>; note?: string }
export const emptyHours = (): Hours => ({ mode: 'dias', days: Object.fromEntries(DAYS.map((d) => [d.id, { open: d.id !== 'lun', from: '08:00', to: '18:00' }])), note: '' });

// "08:00" → "8:00 a. m."
export function hour12(t: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); if (!m) return t || '';
  let h = Number(m[1]); const ap = h >= 12 ? 'p. m.' : 'a. m.'; h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
}
const range = (d: DayHours) => `${hour12(d.from)} a ${hour12(d.to)}`;
// Texto corto para la app y el admin: "Martes a domingo, 8:00 a. m. a 6:00 p. m." (agrupa días seguidos con el mismo horario).
export function scheduleText(h?: Hours | null): string {
  if (!h) return '';
  if (h.mode === '24h') return 'Abierto las 24 horas';
  if (h.mode === 'reservacion') return `Solo con reservación${h.note ? `. ${h.note}` : ''}`;
  const parts: string[] = [];
  let i = 0;
  while (i < DAYS.length) {
    const d = h.days[DAYS[i].id];
    if (!d?.open) { i++; continue; }
    let j = i;
    while (j + 1 < DAYS.length && h.days[DAYS[j + 1].id]?.open && h.days[DAYS[j + 1].id].from === d.from && h.days[DAYS[j + 1].id].to === d.to) j++;
    const name = j === i ? DAYS[i].label : j === i + 1 ? `${DAYS[i].label} y ${DAYS[j].label.toLowerCase()}` : `${DAYS[i].label} a ${DAYS[j].label.toLowerCase()}`;
    parts.push(`${name}, ${range(d)}`);
    i = j + 1;
  }
  const txt = parts.length ? parts.join('; ') : 'Cerrado';
  return `${txt.charAt(0).toUpperCase()}${txt.slice(1)}${h.note ? `. ${h.note}` : ''}`;
}
// ¿Está abierto ahora? (hora de El Salvador). Devuelve el texto para mostrar.
export function openNow(h?: Hours | null): { open: boolean; text: string } | null {
  if (!h) return null;
  if (h.mode === '24h') return { open: true, text: 'Abierto las 24 horas' };
  if (h.mode === 'reservacion') return null;
  const now = new Date(Date.now() - 6 * 3600e3);
  const idx = (now.getUTCDay() + 6) % 7; // lunes = 0
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const toMin = (t: string) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const today = h.days[DAYS[idx].id];
  if (today?.open) {
    const f = toMin(today.from), t = toMin(today.to);
    const inside = t > f ? mins >= f && mins < t : mins >= f || mins < t; // cierra después de medianoche
    if (inside) return { open: true, text: `Abierto ahora · cierra a las ${hour12(today.to)}` };
    if (mins < f) return { open: false, text: `Cerrado ahora · abre hoy a las ${hour12(today.from)}` };
  }
  for (let k = 1; k <= 7; k++) {
    const d = h.days[DAYS[(idx + k) % 7].id];
    if (d?.open) return { open: false, text: `Cerrado ahora · abre ${k === 1 ? 'mañana' : `el ${DAYS[(idx + k) % 7].label.toLowerCase()}`} a las ${hour12(d.from)}` };
  }
  return { open: false, text: 'Cerrado' };
}

// ---------- Teléfonos de El Salvador ----------
// 8 dígitos: fijos empiezan con 2, celulares con 6 o 7.
export const phoneDigits = (v: string) => String(v || '').replace(/\D/g, '').replace(/^503(?=\d{8}$)/, '').slice(0, 8);
export const phoneFormat = (v: string) => { const d = phoneDigits(v); return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d; };
export const phoneValid = (v: string) => /^[267]\d{7}$/.test(phoneDigits(v));
export const mobileValid = (v: string) => /^[67]\d{7}$/.test(phoneDigits(v));
export const waUrl = (v: string, text = '') => (phoneValid(v) ? `https://wa.me/503${phoneDigits(v)}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '');

// ---------- Redes ----------
export const igHandle = (v: string) => String(v || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
export const igUrl = (v: string) => (/^[\w.]{1,30}$/.test(igHandle(v)) ? `https://instagram.com/${igHandle(v)}` : '');
export const fbUrl = (v: string) => {
  const s = String(v || '').trim(); if (!s) return '';
  if (/^https?:\/\/(www\.|m\.)?facebook\.com\//i.test(s)) return s;
  return /^[\w.-]{3,80}$/.test(s) ? `https://facebook.com/${s}` : '';
};
