// Tarjeta de insignia, la misma en el perfil y en /insignias.
// El contenido crece y el pie (barra de progreso o "Ganada") queda siempre abajo,
// así todas las tarjetas de una fila se ven parejas.
import { esc } from './escape';
import { badgeIcon, type BadgeResult } from './badges';

export function badgeCard(b: BadgeResult, tag = ''): string {
  const pct = Math.min(100, Math.round((b.count / b.required) * 100));
  const foot = b.earned
    ? '<span class="bd-earned">Ganada</span>'
    : `<span class="bd-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${b.required}" aria-valuenow="${Math.min(b.count, b.required)}" aria-label="Avance de ${esc(b.name)}"><span style="width:${pct}%"></span></span>
       <span class="bd-count">${Math.min(b.count, b.required)} de ${b.required}</span>`;
  return `<li class="bd${b.earned ? ' is-earned' : ''}${b.seasonal ? ' is-seasonal' : ''}">
    <span class="bd-icon">${badgeIcon(b.icon)}</span>
    <span class="bd-body">
      <span class="bd-name">${esc(b.name)}</span>
      <span class="bd-desc">${esc(b.description)}</span>
      ${tag ? `<span class="bd-tag">${esc(tag)}</span>` : ''}
    </span>
    <span class="bd-foot">${foot}</span>
  </li>`;
}
