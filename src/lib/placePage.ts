// La página de un lugar en el navegador: lee los datos en vivo y deja escribir reseñas, subir y votar fotos,
// y reportar, con los mismos diálogos que el mapa.
import { loadPlaceLive, renderPlace, placeTitle, wireShare, type SitePlace } from './placeData';
import { acts, initPlaceActions, openReview, openReport, votePhoto, uploadPlacePhoto, readyToPost } from './placeActions';
import { enableGalleries } from './gallery';

export function startPlacePage(root: HTMLElement, placeId: string, opts: { onMissing?: () => void } = {}) {
  let place: SitePlace | null = null;
  const status = (msg: string) => { const el = root.querySelector('[data-photo-status]'); if (el) el.textContent = msg; };

  // Marca los votos que ya dio la persona y esconde "Reportar" en lo suyo.
  function paint() {
    const uid = acts.user?.uid || '';
    root.querySelectorAll<HTMLButtonElement>('[data-vote]').forEach((b) => {
      const on = acts.voted.has(b.dataset.vote!);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    root.querySelectorAll<HTMLElement>('[data-report]').forEach((b) => {
      b.hidden = !!uid && b.dataset.owner === uid;
      if (acts.reported.has(`${b.dataset.report}_${b.dataset.target}`)) b.textContent = 'Reportada';
    });
  }
  async function refresh(first = false) {
    try {
      const live = await loadPlaceLive(placeId);
      if (!live) { if (first) opts.onMissing?.(); return; }
      place = live.place;
      const html = renderPlace(live.place, live.all);
      if (html !== root.innerHTML) root.innerHTML = html;
      document.title = placeTitle(live.place);
      paint();
    } catch { if (first && !place) opts.onMissing?.(); }
  }

  // Si todavía no llegaron los datos en vivo, se usan los que ya trae la página.
  const act = () => place ? { id: place.id, name: place.name, lat: place.lat, lng: place.lng }
    : root.dataset.name ? { id: placeId, name: root.dataset.name, lat: Number(root.dataset.lat), lng: Number(root.dataset.lng) } : null;
  const fileInput = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', className: 'sr-only' });
  fileInput.setAttribute('aria-hidden', 'true'); fileInput.tabIndex = -1;
  document.body.appendChild(fileInput);
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0]; fileInput.value = '';
    const p = act(); if (!f || !p) return;
    status('Subiendo tu foto…');
    try { await uploadPlacePhoto(p, f); await refresh(); status('Listo: tu foto ya está en la galería.'); }
    catch (err: any) { status(err?.message || 'No se pudo subir la foto.'); }
  });

  root.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const p = act();
    if (!p) return;
    if (t.closest('[data-write-review]')) { openReview(p); return; }
    if (t.closest('[data-add-photo]')) { if (await readyToPost()) fileInput.click(); return; }
    const v = t.closest('[data-vote]') as HTMLButtonElement | null;
    if (v) {
      const g = place?.gallery.find((x) => x.id === v.dataset.vote);
      if (!g) return;
      v.disabled = true;
      const ok = await votePhoto({ id: g.id, placeId: p.id, url: g.url, votes: g.votes });
      v.disabled = false;
      if (ok === false) status('No se pudo contar tu voto. Puede que ya hayás votado por esta foto.');
      if (ok !== null) await refresh();
      return;
    }
    const r = t.closest('[data-report]') as HTMLElement | null;
    if (r) openReport(r.dataset.report as 'review' | 'photo', r.dataset.target!, p.id);
  });

  wireShare(root);
  enableGalleries(root);
  initPlaceActions({ onReview: () => refresh(), onUser: () => paint() });
  refresh(true);
}
