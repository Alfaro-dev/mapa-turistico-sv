// Selector de fecha de Goz: en español, la semana empieza en lunes y se respeta un mínimo y un máximo.
// Reemplaza al <input type="date"> del navegador (que en muchos equipos sale en formato mes/día).
// El input original queda oculto y sigue guardando la fecha AAAA-MM-DD: leer y asignar .value funciona igual.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const isoDay = (d: Date) => d.toLocaleDateString('en-CA');
const parseDay = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso: string, n: number) => { const d = parseDay(iso); d.setDate(d.getDate() + n); return isoDay(d); };
const today = () => isoDay(new Date());
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface DatePickerOptions {
  min?: string | 'today';
  max?: string | 'today';
  quick?: { label: string; days: number }[]; // días desde hoy (negativo = antes)
  empty?: string; // texto del botón sin fecha
  placement?: 'top' | 'bottom';
  title?: string; // nombre del calendario para lectores de pantalla
  onChange?: (iso: string) => void;
}

export function dayText(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const d = parseDay(iso);
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ` de ${d.getFullYear()}` : ''}`;
  const t = today();
  if (iso === t) return `Hoy, ${base}`;
  if (iso === addDays(t, -1)) return `Ayer, ${base}`;
  if (iso === addDays(t, 1)) return `Mañana, ${base}`;
  return `${cap(DIAS[d.getDay()])} ${base}`;
}

const ICO_CAL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path></svg>';
const ICO_CHEV = '<svg class="date-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';
const arrow = (d: string) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`;

export function datePicker(input: HTMLInputElement, opts: DatePickerOptions = {}) {
  const id = input.id || `dp${Math.random().toString(36).slice(2, 8)}`;
  input.id = id;
  const lim = (v?: string) => (v === 'today' ? today() : v || '');
  const minDay = () => lim(opts.min ?? input.min) || '1990-01-01';
  const maxDay = () => lim(opts.max ?? input.max) || '2099-12-31';

  // Contenedor: botón + calendario.
  const wrap = document.createElement('div');
  wrap.className = 'dp';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = `${id}Btn`;
  btn.className = 'date-btn';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `${ICO_CAL}<span class="date-txt"></span>${ICO_CHEV}`;
  const pop = document.createElement('div');
  pop.className = `date-pop${opts.placement === 'top' ? ' is-top' : ''}`;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', opts.title || 'Elegí una fecha');
  pop.hidden = true;
  pop.innerHTML = `${opts.quick?.length ? `<div class="dp-quick">${opts.quick.map((q) => `<button type="button" data-q="${q.days}">${q.label}</button>`).join('')}</div>` : ''}
    <div class="dp-head">
      <button type="button" class="dp-nav" data-nav="-1" aria-label="Mes anterior">${arrow('M15 18l-6-6 6-6')}</button>
      <strong class="dp-month" aria-live="polite"></strong>
      <button type="button" class="dp-nav" data-nav="1" aria-label="Mes siguiente">${arrow('M9 18l6-6-6-6')}</button>
    </div>
    <div class="dp-week" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
    <div class="dp-grid"></div>`;
  input.insertAdjacentElement('afterend', wrap);
  wrap.append(input, btn, pop);
  input.type = 'hidden';

  // La etiqueta apunta al botón; el botón dice la etiqueta y la fecha.
  const label = document.querySelector(`label[for="${CSS.escape(id)}"]`) as HTMLLabelElement | null;
  if (label) { label.htmlFor = btn.id; label.id ||= `${id}Label`; btn.setAttribute('aria-labelledby', `${label.id} ${btn.id}`); }
  const txt = btn.querySelector('.date-txt') as HTMLElement;
  txt.id = `${id}Txt`;
  if (label) btn.setAttribute('aria-labelledby', `${label.id} ${txt.id}`);

  // .value sigue funcionando y actualiza el botón.
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
  Object.defineProperty(input, 'value', {
    configurable: true,
    get() { return desc.get!.call(input); },
    set(v: string) { desc.set!.call(input, v); paintBtn(); },
  });

  let view = new Date();
  let focusDay = today();
  function paintBtn() {
    const v = input.value;
    txt.textContent = v ? dayText(v) : (opts.empty || 'Elegí una fecha');
    btn.classList.toggle('is-empty', !v);
  }
  function render() {
    const sel = input.value;
    const y = view.getFullYear(), m = view.getMonth();
    (pop.querySelector('.dp-month') as HTMLElement).textContent = `${MESES[m]} ${y}`;
    (pop.querySelector('[data-nav="-1"]') as HTMLButtonElement).disabled = isoDay(new Date(y, m, 0)) < minDay();
    (pop.querySelector('[data-nav="1"]') as HTMLButtonElement).disabled = isoDay(new Date(y, m + 1, 1)) > maxDay();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const t = today();
    let html = '<span></span>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const iso = isoDay(new Date(y, m, d));
      const off = iso > maxDay() || iso < minDay();
      html += `<button type="button" class="dp-day${iso === t ? ' is-today' : ''}" data-day="${iso}" aria-pressed="${iso === sel}" aria-label="${dayText(iso)}"${off ? ' disabled' : ''} tabindex="${iso === focusDay ? 0 : -1}">${d}</button>`;
    }
    (pop.querySelector('.dp-grid') as HTMLElement).innerHTML = html;
    pop.querySelectorAll('.dp-quick button').forEach((b: any) => {
      const iso = addDays(t, Number(b.dataset.q));
      b.classList.toggle('is-on', iso === sel);
      b.disabled = iso > maxDay() || iso < minDay();
    });
  }
  function clamp(iso: string) { return iso > maxDay() ? maxDay() : iso < minDay() ? minDay() : iso; }
  function show(iso: string) { focusDay = iso; const d = parseDay(iso); view = new Date(d.getFullYear(), d.getMonth(), 1); }
  function open() {
    show(clamp(input.value || today()));
    render();
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    (pop.querySelector('.dp-day[tabindex="0"]') as HTMLElement)?.focus();
  }
  function close(focusBtn = true) {
    if (pop.hidden) return;
    pop.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus();
  }
  function pick(iso: string) {
    input.value = iso;
    btn.removeAttribute('aria-invalid');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    opts.onChange?.(iso);
    close();
  }

  btn.addEventListener('click', () => (pop.hidden ? open() : close()));
  pop.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const nav = t.closest('[data-nav]') as HTMLButtonElement | null;
    if (nav && !nav.disabled) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.nav), 1); render(); return; }
    const q = t.closest('[data-q]') as HTMLButtonElement | null;
    if (q && !q.disabled) { pick(addDays(today(), Number(q.dataset.q))); return; }
    const day = t.closest('.dp-day') as HTMLButtonElement | null;
    if (day && !day.disabled) pick(day.dataset.day!);
  });
  // Teclado: flechas por día y semana, RePág/AvPág por mes, Escape cierra.
  pop.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    const t = e.target as HTMLElement;
    if (!t.classList.contains('dp-day')) return;
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next = '';
    if (e.key in steps) next = addDays(t.dataset.day!, steps[e.key]);
    else if (e.key === 'PageUp' || e.key === 'PageDown') { const d = parseDay(t.dataset.day!); d.setMonth(d.getMonth() + (e.key === 'PageUp' ? -1 : 1)); next = isoDay(d); }
    else return;
    e.preventDefault();
    next = clamp(next);
    show(next); render();
    (pop.querySelector(`[data-day="${next}"]`) as HTMLElement)?.focus();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!pop.hidden && !wrap.contains(e.target as Node)) close(false);
  });

  paintBtn();
  return { button: btn, close: () => close(false), refresh: paintBtn };
}
