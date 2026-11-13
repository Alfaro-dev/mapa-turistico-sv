// Visitas y errores del sitio, sin cookies ni datos personales.
// - Visitas: solo totales por día en stats/AAAA-MM-DD (cuántas páginas, cuántas personas, de dónde llegan, celular o compu).
//   Para contar personas una sola vez al día, el navegador guarda la fecha de la última visita, nada más.
// - Errores: cada error distinto es un documento en errors/ con cuántas veces pasó; el admin los ve y los marca resueltos.
// Se usa Firestore por REST para no cargar Firebase en las páginas que no lo necesitan.
const PROJECT = 'projects/mapsv-1776175535/databases/(default)/documents';
const COMMIT = `https://firestore.googleapis.com/v1/${PROJECT}:commit`;

const day = () => new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10); // hora de El Salvador (UTC-6)
const commit = (writes: unknown[]) => fetch(COMMIT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ writes }), keepalive: true });
const inc = (fieldPath: string) => ({ fieldPath, increment: { integerValue: '1' } });
const str = (v: string) => ({ stringValue: v });

function pageKind(path: string) {
  if (path === '/' || path === '') return 'mapa';
  if (path.startsWith('/lugar/')) return 'lugar';
  if (path.startsWith('/lugares')) return 'lugares';
  if (path.startsWith('/perfil')) return 'perfil';
  if (path.startsWith('/insignias')) return 'insignias';
  if (path.startsWith('/privacidad') || path.startsWith('/terminos')) return 'legal';
  return 'otra';
}
function source() {
  const utm = new URLSearchParams(location.search).get('utm_source')?.toLowerCase() || '';
  let host = '';
  try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch { /* sin referencia */ }
  const h = `${utm} ${host}`;
  if (host === location.hostname) return '';
  if (/google\./.test(h)) return 'google';
  if (/bing\.|duckduckgo|yahoo\.|ecosia|brave/.test(h)) return 'buscador';
  if (/whatsapp|wa\.me/.test(h)) return 'whatsapp';
  if (/facebook|fb\.|messenger/.test(h)) return 'facebook';
  if (/instagram/.test(h)) return 'instagram';
  if (/t\.co|twitter|x\.com|tiktok|threads|linkedin|reddit/.test(h)) return 'redes';
  return h.trim() ? 'otro' : 'directo';
}
const isBot = () => navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent);
const isLocal = () => !/carlosalfaro\.dev$|gozsv\.com$/.test(location.hostname);

export function countVisit() {
  if (isBot() || isLocal() || location.pathname.startsWith('/admin')) return;
  const today = day();
  const fields = ['views', `p_${pageKind(location.pathname)}`];
  let seen = '';
  try { seen = localStorage.getItem('goz-dia') || ''; } catch { /* navegador sin almacenamiento */ }
  if (seen !== today) {
    const src = source();
    fields.push('visitors', `s_${src || 'directo'}`, `d_${matchMedia('(pointer: coarse)').matches ? 'movil' : 'compu'}`);
    try { localStorage.setItem('goz-dia', today); } catch { /* igual se cuenta la vista */ }
  }
  commit([{ update: { name: `${PROJECT}/stats/${today}`, fields: {} }, updateMask: { fieldPaths: [] }, updateTransforms: fields.map(inc) }]).catch(() => {});
}

// ---------- Errores ----------
function browser() {
  const ua = navigator.userAgent;
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Otro';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Otro';
  return `${b} · ${os}`;
}
const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
const IGNORE = /ResizeObserver loop|^Script error\.?$|Load failed|NetworkError|Failed to fetch|AbortError|The user aborted/i;
const sent = new Set<string>();

export async function reportError(message: string, where = '') {
  const msg = String(message || 'Error sin mensaje').slice(0, 300);
  const src = String(where).replace(location.origin, '').replace(/[?#][^:]*/, '').slice(0, 300);
  if (IGNORE.test(msg) || /extension:\/\//.test(src) || isBot() || isLocal()) return;
  const id = `e_${hash(`${msg}|${src.replace(/:\d+(:\d+)?$/, '')}`)}`;
  if (sent.has(id) || sent.size >= 3) return; // como mucho 3 errores distintos por página abierta
  sent.add(id);
  const name = `${PROJECT}/errors/${id}`;
  const page = location.pathname.slice(0, 200), ua = browser();
  try {
    const first = await commit([{
      update: { name, fields: { msg: str(msg), src: str(src), page: str(page), ua: str(ua), app: str('web'), resolved: { booleanValue: false }, count: { integerValue: '1' } } },
      currentDocument: { exists: false },
      updateTransforms: [{ fieldPath: 'first', setToServerValue: 'REQUEST_TIME' }, { fieldPath: 'last', setToServerValue: 'REQUEST_TIME' }],
    }]);
    if (first.ok) return;
    // Ya existe: se suma una vez más y se reabre si estaba resuelto.
    await commit([{
      update: { name, fields: { page: str(page), ua: str(ua), resolved: { booleanValue: false } } },
      updateMask: { fieldPaths: ['page', 'ua', 'resolved'] },
      currentDocument: { exists: true },
      updateTransforms: [inc('count'), { fieldPath: 'last', setToServerValue: 'REQUEST_TIME' }],
    }]);
  } catch { /* sin conexión */ }
}

export function watchErrors() {
  addEventListener('error', (e) => {
    if (!(e instanceof ErrorEvent)) return; // imágenes que no cargan, etc.
    reportError(e.message, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : '');
  });
  addEventListener('unhandledrejection', (e) => {
    const r: any = e.reason;
    reportError(r?.message || String(r), (r?.stack || '').split('\n').find((l: string) => /https?:\/\//.test(l))?.trim().replace(/^at\s+/, '') || '');
  });
}
