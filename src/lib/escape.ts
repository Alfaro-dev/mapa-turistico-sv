// Helpers para meter datos de Firestore en HTML sin abrir la puerta a XSS.

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapa texto para usarlo dentro de HTML o de un atributo entre comillas. */
export function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Devuelve la URL solo si es http(s); si no, cadena vacía. Ya viene escapada. */
export function safeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? esc(url.href) : '';
  } catch {
    return '';
  }
}

/** Argumento seguro para un manejador inline: onclick="fn(${jsArg(x)})". */
export function jsArg(value: unknown): string {
  return esc(JSON.stringify(String(value ?? '')));
}

/** Número finito o 0, para coordenadas y contadores. */
export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
