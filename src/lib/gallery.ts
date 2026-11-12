// Visor de fotos sencillo (el mismo diseño que el del mapa): se pasan con flechas, teclado o deslizando.
// Se usa en el admin; el del mapa tiene además votos y reportes.
export interface GalleryItem { url: string; cap?: string }

let dlg: HTMLDialogElement | null = null;
let items: GalleryItem[] = [];
let index = 0;

const svg = (d: string, w = 24) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Fotos');
  dlg.innerHTML = `<div class="lb-top"><span class="lb-count" aria-live="polite"></span>
      <button type="button" class="lb-btn" data-g="close" aria-label="Cerrar">${svg('M6 6l12 12M18 6L6 18', 22)}</button></div>
    <div class="lb-stage">
      <button type="button" class="lb-btn lb-nav lb-prev" data-g="prev" aria-label="Foto anterior">${svg('M15 18l-6-6 6-6')}</button>
      <img class="lb-img" alt="">
      <button type="button" class="lb-btn lb-nav lb-next" data-g="next" aria-label="Foto siguiente">${svg('M9 18l6-6-6-6')}</button>
    </div>
    <div class="lb-foot"><p class="lb-cap"></p></div>`;
  document.body.appendChild(dlg);
  const stage = dlg.querySelector('.lb-stage') as HTMLElement;
  dlg.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const g = (t.closest('[data-g]') as HTMLElement | null)?.dataset.g;
    if (g === 'close' || t === stage) dlg!.close();
    if (g === 'prev') show(index - 1);
    if (g === 'next') show(index + 1);
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
  let x0 = 0, y0 = 0;
  stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
  stage.addEventListener('pointerup', (e) => {
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
  });
}

function show(i: number) {
  if (!dlg || !items.length) return;
  index = Math.max(0, Math.min(items.length - 1, i));
  const it = items[index];
  const img = dlg.querySelector('.lb-img') as HTMLImageElement;
  if (img.getAttribute('src') !== it.url) {
    img.classList.add('is-loading');
    img.onload = () => img.classList.remove('is-loading');
    img.src = it.url;
  }
  img.alt = it.cap || 'Foto';
  (dlg.querySelector('.lb-count') as HTMLElement).textContent = items.length > 1 ? `${index + 1} de ${items.length}` : '';
  (dlg.querySelector('.lb-cap') as HTMLElement).textContent = it.cap || '';
  const prev = dlg.querySelector('.lb-prev') as HTMLButtonElement, next = dlg.querySelector('.lb-next') as HTMLButtonElement;
  prev.disabled = index === 0; next.disabled = index === items.length - 1;
  prev.hidden = next.hidden = items.length < 2;
  [index - 1, index + 1].forEach((k) => { if (items[k]) new Image().src = items[k].url; });
}

export function openGallery(list: GalleryItem[], start = 0) {
  list = list.filter((x) => x.url);
  if (!list.length) return;
  if (!dlg) build();
  items = list;
  if (!dlg!.open) dlg!.showModal();
  show(start);
  (dlg!.querySelector('[data-g="close"]') as HTMLElement).focus({ preventScroll: true });
}

// Cualquier enlace o botón con data-gal dentro de un grupo [data-gal-group] abre el visor con todo el grupo.
// Cada elemento lleva data-src (la foto) y data-cap (texto opcional).
export function enableGalleries(root: HTMLElement | Document = document) {
  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-gal]') as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    const group = el.closest('[data-gal-group]') || el.parentElement!;
    const all = [...group.querySelectorAll('[data-gal]')] as HTMLElement[];
    openGallery(all.map((x) => ({ url: x.dataset.src || (x as HTMLAnchorElement).href || '', cap: x.dataset.cap || '' })), Math.max(0, all.indexOf(el)));
  });
}
