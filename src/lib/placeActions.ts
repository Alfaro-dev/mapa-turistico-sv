// Lo que una persona hace con un lugar: escribir una reseña, subir y votar fotos, reportar y aceptar la privacidad.
// Lo usan el mapa y la página de cada lugar, con los diálogos de src/components/PlaceDialogs.astro.
// Cada página le dice qué hacer después (volver a dibujar) con initPlaceActions({ ... }).
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { collection, getDoc, getDocs, addDoc, setDoc, doc, increment, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';
import { db, auth, googleProvider } from './firebase';
import { uploadImage } from './cloudinary';
import { esc, safeUrl, num } from './escape';
import { datePicker } from './datePicker';
import { LEGAL } from './legal';

export interface ActPlace { id: string; name: string; lat: number; lng: number }
export interface ActPhoto { id: string; placeId: string; url: string; votes?: number; userId?: string; userName?: string; userPhoto?: string; [k: string]: any }
interface Hooks {
  onUser?: (user: any) => void;
  onReview?: (place: ActPlace, review: any) => void;
  onPhoto?: (place: ActPlace, photo: ActPhoto) => void;
  onReported?: (type: 'review' | 'photo', id: string) => void;
}

// Estado compartido: quién entró, por qué fotos votó y qué reportó en esta visita.
export const acts = { user: null as any, voted: new Set<string>(), reported: new Set<string>() };
let hooks: Hooks = {};
const $ = (id: string) => document.getElementById(id) as any;

export async function login() {
  try { await signInWithPopup(auth, googleProvider); return true; }
  catch (err: any) {
    if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') console.error(err);
    return false;
  }
}

// ---------- Aceptar privacidad (una vez por versión de la política) ----------
// La ley pide consentimiento expreso, también para guardar datos fuera de El Salvador.
// Queda en users/{uid}.privacy con la versión y la fecha.
let consentFor = '';
export async function ensureConsent(): Promise<boolean> {
  const user = acts.user;
  if (!user) return false;
  if (consentFor === user.uid) return true;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists() && snap.data()?.privacy?.version === LEGAL.updated) { consentFor = user.uid; return true; }
  } catch { /* si no se puede leer, se pregunta */ }
  const dlg = $('consentDialog') as HTMLDialogElement;
  ($('consentForm') as HTMLFormElement).reset();
  $('consentError').hidden = true;
  dlg.showModal();
  return new Promise<boolean>((resolve) => {
    const done = (ok: boolean) => { cleanup(); if (dlg.open) dlg.close(); resolve(ok); };
    const onSubmit = async (e: Event) => {
      e.preventDefault();
      const boxes = [...dlg.querySelectorAll('[data-consent]')] as HTMLInputElement[];
      const missing = boxes.find((b) => !b.checked);
      if (missing) { $('consentError').textContent = 'Para publicar tenés que marcar las tres casillas.'; $('consentError').hidden = false; missing.focus(); return; }
      ($('consentOk') as HTMLButtonElement).disabled = true;
      try {
        await setDoc(doc(db, 'users', user.uid), { privacy: { version: LEGAL.updated, acceptedAt: serverTimestamp(), transfers: true, ageOk: true } }, { merge: true });
        consentFor = user.uid;
        done(true);
      } catch (err) {
        console.error(err);
        $('consentError').textContent = 'No se pudo guardar. Revisá tu conexión y probá otra vez.'; $('consentError').hidden = false;
      } finally { ($('consentOk') as HTMLButtonElement).disabled = false; }
    };
    const onCancel = () => done(false);
    const onClose = () => { cleanup(); resolve(consentFor === acts.user?.uid); };
    const cleanup = () => {
      $('consentForm').removeEventListener('submit', onSubmit);
      $('consentCancel').removeEventListener('click', onCancel);
      $('consentClose').removeEventListener('click', onCancel);
      dlg.removeEventListener('close', onClose);
    };
    $('consentForm').addEventListener('submit', onSubmit);
    $('consentCancel').addEventListener('click', onCancel);
    $('consentClose').addEventListener('click', onCancel);
    dlg.addEventListener('close', onClose);
  });
}
// Para votar, reportar, pedir cupones o subir fotos: cuenta y aceptación.
export const readyToPost = async () => (!!acts.user || await login()) && await ensureConsent();

// ---------- Reseña ----------
let reviewPlace: ActPlace | null = null;
let reviewRating = 0;
let reviewPhotos: string[] = [];
let uploadingPhotos = 0;
let reviewVerified = false;
let visitPicker: any = null;
const STAR_WORDS = ['Tocá una estrella', 'Malo', 'Regular', 'Bien', 'Muy bueno', '¡Buenísimo!'];
const distanceKm = (a: [number, number], b: [number, number]) => {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

function setStarLabel(n: number, preview = false) {
  $('starLabel').textContent = STAR_WORDS[n];
  $('starLabel').classList.toggle('is-set', !preview && n > 0);
}
function showReviewStep(step?: 'done') {
  const user = acts.user, logged = !!user;
  $('reviewLogin').hidden = logged || step === 'done';
  $('reviewForm').hidden = !logged || step === 'done';
  $('reviewDone').hidden = step !== 'done';
  if (logged) {
    const nm = user.displayName || 'Visitante';
    $('reviewAs').textContent = nm;
    const pic = user.photoURL ? safeUrl(user.photoURL) : '';
    $('reviewAsAvatar').innerHTML = pic ? `<img src="${pic}" alt="" referrerpolicy="no-referrer">` : esc(nm.charAt(0).toUpperCase());
  }
}
function resetReviewForm() {
  reviewRating = 0; reviewPhotos = []; reviewVerified = false;
  document.querySelectorAll('.star-pick').forEach((b) => { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
  setStarLabel(0);
  ($('reviewComment') as HTMLTextAreaElement).value = '';
  $('commentCount').textContent = 'Mínimo 10 letras · 0 de 1000';
  document.querySelectorAll('#reviewForm [aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
  ($('reviewDate') as HTMLInputElement).value = new Date().toLocaleDateString('en-CA');
  visitPicker?.close();
  $('verifyStatus').textContent = 'Opcional. Si estás en el lugar, tu reseña lleva la marca de visita verificada. No guardamos tu ubicación.';
  $('verifyStatus').classList.remove('is-ok');
  $('verifyBtn').classList.remove('is-ok'); $('verifyBtn').disabled = false; $('verifyText').textContent = 'Verificar mi visita';
  $('reviewError').hidden = true;
  $('reviewLoginError').hidden = true;
  renderReviewPhotos();
}
export function openReview(place: ActPlace) {
  reviewPlace = place;
  $('reviewTitle').textContent = `¿Qué tal ${place.name}?`;
  resetReviewForm();
  showReviewStep();
  ($('reviewDialog') as HTMLDialogElement).showModal();
  ($('reviewTitle') as HTMLElement).setAttribute('tabindex', '-1');
  ($('reviewTitle') as HTMLElement).focus({ preventScroll: true });
}
function renderReviewPhotos() {
  $('reviewPhotos').innerHTML =
    reviewPhotos.map((u, i) => `<div class="photo-pick"><img src="${safeUrl(u)}" alt="Foto ${i + 1}"><button type="button" data-remove="${i}" aria-label="Quitar foto ${i + 1}">×</button></div>`).join('') +
    Array.from({ length: uploadingPhotos }, () => '<div class="photo-pick is-loading">Subiendo…</div>').join('');
  const used = reviewPhotos.length + uploadingPhotos;
  $('photoAdd').hidden = used >= 4;
  $('photoAdd').classList.toggle('is-compact', used > 0);
  $('dzTitle').textContent = used ? 'Agregar otra foto' : 'Agregá fotos de tu visita';
  $('dzSub').textContent = used ? `Te ${4 - used === 1 ? 'queda 1' : `quedan ${4 - used}`}` : 'Arrastralas aquí o tocá para elegir · hasta 4';
}
async function addReviewPhotos(picked: File[]) {
  if (!(await ensureConsent())) return;
  const room = Math.max(0, 4 - reviewPhotos.length - uploadingPhotos);
  const files = picked.slice(0, room);
  $('reviewError').hidden = true;
  if (picked.length > room) {
    $('reviewError').textContent = room ? `Podés subir hasta 4 fotos. Se van a subir solo ${room} de las ${picked.length} que elegiste.` : 'Ya tenés 4 fotos. Quitá una para subir otra.';
    $('reviewError').hidden = false;
  }
  for (const f of files) {
    uploadingPhotos++; renderReviewPhotos();
    try { reviewPhotos.push(await uploadImage(f, 'reviews', acts.user.uid)); }
    catch (err: any) { $('reviewError').textContent = err?.message || 'No se pudo subir la foto.'; $('reviewError').hidden = false; }
    finally { uploadingPhotos--; renderReviewPhotos(); }
  }
}

function wireReview() {
  const dialog = $('reviewDialog') as HTMLDialogElement;
  const close = () => dialog.close();
  $('reviewClose').addEventListener('click', close);
  $('reviewDoneBtn').addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  $('reviewGoogle').addEventListener('click', async () => {
    const ok = await login();
    if (!ok && !acts.user) {
      $('reviewLoginError').textContent = 'No se pudo entrar. Si el navegador bloqueó la ventana de Google, permitila e intentá de nuevo.';
      $('reviewLoginError').hidden = false;
    }
  });
  // Cada estrella dice qué significa; al pasar el cursor se ve antes de elegir.
  document.querySelectorAll('.star-pick').forEach((btn) => {
    const n = Number((btn as HTMLElement).dataset.rating);
    btn.addEventListener('mouseenter', () => {
      $('starsGroup').classList.add('is-preview');
      document.querySelectorAll('.star-pick').forEach((b) => b.classList.toggle('is-hint', Number((b as HTMLElement).dataset.rating) <= n));
      setStarLabel(n, true);
    });
    btn.addEventListener('click', () => {
      reviewRating = n;
      document.querySelectorAll('.star-pick').forEach((b) => {
        const v = Number((b as HTMLElement).dataset.rating);
        b.classList.toggle('is-on', v <= reviewRating);
        b.setAttribute('aria-pressed', String(v === reviewRating));
      });
      $('starsGroup').classList.remove('is-preview');
      setStarLabel(reviewRating);
      if ($('reviewError').textContent.includes('estrellas')) $('reviewError').hidden = true;
    });
  });
  $('starsGroup').addEventListener('mouseleave', () => { $('starsGroup').classList.remove('is-preview'); setStarLabel(reviewRating); });

  $('verifyBtn').addEventListener('click', () => {
    if (!reviewPlace) return;
    if (!navigator.geolocation) { $('verifyStatus').textContent = 'Tu navegador no permite ver tu ubicación.'; return; }
    $('verifyText').textContent = 'Buscando…';
    $('verifyStatus').textContent = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distanceKm([pos.coords.latitude, pos.coords.longitude], [reviewPlace!.lat, reviewPlace!.lng]);
        reviewVerified = d <= 0.5;
        $('verifyStatus').textContent = reviewVerified ? '' : `Estás a ${fmtKm(d)} del lugar. Podés publicar igual, sin la marca de visita verificada.`;
        $('verifyText').textContent = reviewVerified ? 'Visita verificada' : 'Probar de nuevo';
        $('verifyBtn').classList.toggle('is-ok', reviewVerified);
        $('verifyBtn').disabled = reviewVerified;
      },
      () => { $('verifyText').textContent = 'Probar de nuevo'; $('verifyStatus').textContent = 'No se pudo ver tu ubicación. Revisá el permiso del navegador.'; },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });

  $('reviewComment').addEventListener('input', (e: Event) => {
    (e.target as HTMLElement).removeAttribute('aria-invalid');
    if (!$('reviewError').hidden && !uploadingPhotos) $('reviewError').hidden = true;
    const n = ($('reviewComment') as HTMLTextAreaElement).value.trim().length;
    $('commentCount').textContent = n < 10 ? `Mínimo 10 letras · ${n} de 1000` : `${n} de 1000`;
  });
  // Fecha de la visita: selector propio, sin días futuros.
  visitPicker = datePicker($('reviewDate') as HTMLInputElement, {
    min: '2000-01-01', max: 'today', placement: 'top', title: 'Elegí el día de tu visita',
    quick: [{ label: 'Hoy', days: 0 }, { label: 'Ayer', days: -1 }, { label: 'Hace una semana', days: -7 }],
    onChange: () => { if ($('reviewError').textContent.includes('fecha')) $('reviewError').hidden = true; },
  });

  $('reviewPhotos').addEventListener('click', (e: Event) => {
    const b = (e.target as HTMLElement).closest('[data-remove]') as HTMLElement | null;
    if (b) { reviewPhotos.splice(Number(b.dataset.remove), 1); renderReviewPhotos(); }
  });
  $('reviewPhotoInput').addEventListener('change', (e: Event) => {
    const input = e.target as HTMLInputElement;
    const picked = Array.from(input.files || []);
    input.value = '';
    addReviewPhotos(picked);
  });
  const dz = $('photoAdd') as HTMLElement;
  ['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e: Event) => { e.preventDefault(); dz.classList.add('is-over'); }));
  ['dragleave', 'dragend'].forEach((t) => dz.addEventListener(t, () => dz.classList.remove('is-over')));
  dz.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault(); dz.classList.remove('is-over');
    addReviewPhotos(Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/')));
  });

  $('reviewForm').addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const err = (msg: string, field?: string) => {
      $('reviewError').textContent = msg; $('reviewError').hidden = false;
      if (field) { const f = $(field) as HTMLElement; f.setAttribute('aria-invalid', 'true'); f.focus(); }
      else $('reviewError').scrollIntoView({ block: 'nearest' });
    };
    $('reviewError').hidden = true;
    document.querySelectorAll('#reviewForm [aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    const user = acts.user, place = reviewPlace;
    if (!user || !place) return;
    if (!(await ensureConsent())) return;
    if (!reviewRating) { err('Elegí de 1 a 5 estrellas.'); (document.querySelector('.star-pick') as HTMLElement)?.focus(); return; }
    const comment = ($('reviewComment') as HTMLTextAreaElement).value.trim();
    if (comment.length < 10) return err(`Contá un poquito más: faltan ${10 - comment.length} letras.`, 'reviewComment');
    const visit = ($('reviewDate') as HTMLInputElement).value;
    const today = new Date().toLocaleDateString('en-CA');
    if (visit && visit > today) return err('La fecha de tu visita no puede ser después de hoy.', 'reviewDateBtn');
    if (visit && visit < '2000-01-01') return err('Revisá la fecha de tu visita.', 'reviewDateBtn');
    if (uploadingPhotos > 0) return err('Esperá a que terminen de subir las fotos.');
    const submit = $('reviewSubmit') as HTMLButtonElement;
    submit.disabled = true; submit.textContent = 'Publicando…';
    try {
      const data: Record<string, any> = {
        placeId: place.id, placeName: place.name, placeLat: place.lat, placeLng: place.lng,
        userId: user.uid,
        // Las reseñas son públicas: se guarda el nombre y la foto de perfil, nunca el correo.
        userName: user.displayName || 'Visitante', userPhoto: user.photoURL || '',
        rating: reviewRating, comment, photos: reviewPhotos, visitDate: visit || '', verified: reviewVerified,
        useful: 0, fun: 0, like: 0, createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'reviews'), data);
      // Las fotos de la reseña también entran a la galería y se pueden votar.
      for (const u of reviewPhotos) { try { await addCommunityPhoto(place, u); } catch (e3) { console.error(e3); } }
      hooks.onReview?.(place, { ...data, id: ref.id, createdAt: { toMillis: () => Date.now() } });
      showReviewStep('done');
    } catch (e2) {
      console.error('No se pudo publicar la reseña:', e2);
      err('No se pudo publicar la reseña. Revisá tu conexión e intentá de nuevo.');
    } finally { submit.disabled = false; submit.textContent = 'Publicar reseña'; }
  });
}

// ---------- Reportar reseñas y fotos ----------
let reportTarget: { type: 'review' | 'photo'; id: string; placeId: string } | null = null;
export async function openReport(type: 'review' | 'photo', id: string, placeId: string) {
  if (!(await readyToPost())) return;
  reportTarget = { type, id, placeId };
  const done = acts.reported.has(`${type}_${id}`);
  $('reportTitle').textContent = type === 'review' ? '¿Qué pasa con esta reseña?' : '¿Qué pasa con esta foto?';
  ($('reportForm') as HTMLFormElement).reset();
  $('reportError').hidden = true;
  document.querySelector('.rp-options')!.classList.remove('is-invalid');
  $('reportForm').hidden = done; $('reportDone').hidden = !done;
  ($('reportSubmit') as HTMLButtonElement).disabled = false;
  ($('reportDialog') as HTMLDialogElement).showModal();
}
function markReported(type: 'review' | 'photo', id: string) {
  acts.reported.add(`${type}_${id}`);
  $('reportForm').hidden = true; $('reportDone').hidden = false;
  ($('reportOk') as HTMLElement).focus();
  document.querySelectorAll(`[data-report="${type}"][data-target="${CSS.escape(id)}"]`).forEach((b) => { b.textContent = 'Reportada'; });
  hooks.onReported?.(type, id);
}
function wireReport() {
  const close = () => ($('reportDialog') as HTMLDialogElement).close();
  $('reportClose').addEventListener('click', close);
  $('reportCancel').addEventListener('click', close);
  $('reportOk').addEventListener('click', close);
  $('reportDialog').addEventListener('click', (e: Event) => { if (e.target === $('reportDialog')) close(); });
  document.querySelectorAll('.rp-options input').forEach((x) => x.addEventListener('change', () => {
    $('reportError').hidden = true; document.querySelector('.rp-options')!.classList.remove('is-invalid');
  }));
  $('reportForm').addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const user = acts.user;
    if (!reportTarget || !user) return;
    const reason = (document.querySelector('.rp-options input:checked') as HTMLInputElement | null)?.value;
    if (!reason) {
      $('reportError').textContent = 'Elegí qué pasa para poder revisarlo.'; $('reportError').hidden = false;
      document.querySelector('.rp-options')!.classList.add('is-invalid');
      (document.querySelector('.rp-options input') as HTMLElement).focus();
      return;
    }
    const btn = $('reportSubmit') as HTMLButtonElement;
    btn.disabled = true; btn.textContent = 'Enviando…';
    const { type, id, placeId } = reportTarget;
    try {
      await setDoc(doc(db, 'reports', `${type}_${id}_${user.uid}`), {
        type, targetId: id, placeId, reason, note: ($('reportNote') as HTMLTextAreaElement).value.trim().slice(0, 300),
        userId: user.uid, userName: user.displayName || 'Visitante', status: 'open', createdAt: serverTimestamp(),
      });
      markReported(type, id);
    } catch (err) {
      // Si ya lo había reportado antes, la regla no deja repetir: igual se da por hecho.
      console.error('No se pudo enviar el reporte:', err);
      if ((err as any)?.code === 'permission-denied') markReported(type, id);
      else { $('reportError').textContent = 'No se pudo enviar. Revisá tu conexión y probá otra vez.'; $('reportError').hidden = false; }
    } finally { btn.disabled = false; btn.textContent = 'Enviar reporte'; }
  });
}

// ---------- Fotos y votos ----------
// Un voto por persona: el documento photoVotes/{foto}_{usuario} y el +1 van juntos,
// y las reglas de Firestore no dejan sumar sin ese documento.
// Devuelve true si se contó; false si no se pudo (por ejemplo, ya había votado).
export async function votePhoto(ph: ActPhoto): Promise<boolean | null> {
  if (!(await readyToPost())) return null;
  if (acts.voted.has(ph.id)) return false;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'photoVotes', `${ph.id}_${acts.user.uid}`), { photoId: ph.id, placeId: ph.placeId, userId: acts.user.uid, createdAt: serverTimestamp() });
    batch.update(doc(db, 'photos', ph.id), { votes: increment(1) });
    await batch.commit();
    acts.voted.add(ph.id);
    ph.votes = num(ph.votes) + 1;
    return true;
  } catch (err) {
    console.error('No se pudo votar:', err);
    acts.voted.add(ph.id);
    return false;
  }
}
export async function addCommunityPhoto(place: ActPlace, url: string): Promise<ActPhoto> {
  const user = acts.user;
  const data = {
    placeId: place.id, placeName: place.name, url, caption: '',
    userId: user.uid, userName: user.displayName || 'Visitante', userPhoto: user.photoURL || '',
    votes: 0, useful: 0, fun: 0, like: 0, rating: 0, createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'photos'), data);
  const photo = { ...data, id: ref.id, createdAt: { toMillis: () => Date.now() } } as ActPhoto;
  hooks.onPhoto?.(place, photo);
  return photo;
}
// Sube una foto suelta a la galería del lugar (sin reseña).
export async function uploadPlacePhoto(place: ActPlace, file: File) {
  if (!acts.user) return null;
  return addCommunityPhoto(place, await uploadImage(file, 'reviews', acts.user.uid));
}

// ---------- Arranque ----------
let wired = false;
export function initPlaceActions(h: Hooks = {}) {
  hooks = h;
  if (wired) return;
  wired = true;
  wireReview();
  wireReport();
  onAuthStateChanged(auth, async (user) => {
    acts.user = user;
    acts.voted = new Set();
    if (user) {
      try {
        const vs = await getDocs(query(collection(db, 'photoVotes'), where('userId', '==', user.uid)));
        vs.docs.forEach((d) => acts.voted.add(d.data().photoId));
      } catch { /* sin votos */ }
    }
    if (($('reviewDialog') as HTMLDialogElement)?.open && reviewPlace) showReviewStep();
    hooks.onUser?.(user);
  });
}
