// Portada en carrusel: las fotos propias del lugar o negocio pasan solas cada 4 segundos.
// Se puede deslizar con el dedo y se detiene si la persona prefiere menos movimiento.
import { esc } from './escape';

export function carouselHtml(urls: string[], alt: string, cls = '') {
  const items = urls.map((u, i) => `<li class="cr-item"><img src="${esc(u)}" alt="${i === 0 ? esc(alt) : ''}" loading="${i === 0 ? 'eager' : 'lazy'}"></li>`).join('');
  const dots = urls.length > 1
    ? `<div class="cr-dots" aria-hidden="true">${urls.map((_, i) => `<span class="${i === 0 ? 'is-on' : ''}"></span>`).join('')}</div>`
    : '';
  return `<div class="cr ${cls}" data-carousel aria-roledescription="carrusel" aria-label="${esc(alt)}"><ul class="cr-track">${items}</ul>${dots}</div>`;
}

const timers = new WeakMap<HTMLElement, number>();
export function enableCarousels(root: ParentNode = document) {
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll<HTMLElement>('[data-carousel]').forEach((el) => {
    if (timers.has(el)) return;
    const track = el.querySelector<HTMLElement>('.cr-track');
    const dots = [...el.querySelectorAll<HTMLElement>('.cr-dots span')];
    const n = el.querySelectorAll('.cr-item').length;
    if (!track || n < 2) return;
    const at = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    track.addEventListener('scroll', () => { const i = at(); dots.forEach((d, k) => d.classList.toggle('is-on', k === i)); }, { passive: true });
    if (still) return;
    const id = window.setInterval(() => {
      if (!el.isConnected) { clearInterval(id); return; }
      if (document.hidden) return;
      const next = (at() + 1) % n;
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    }, 4000);
    timers.set(el, id);
  });
}
