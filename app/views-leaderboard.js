// A bounty's leaderboard: a paginated table (50 rows a page — some boards
// hold thousands of entries, and the page never renders them all), with a
// view switcher when the API offers more than one view.

import { esc, num } from './format.js';
import { imageUrl } from './api.js';

export const PAGE_SIZE = 50;

// Columns whose values arrive in micro units and read as rates, not counts:
// the API reports judge win rates and their intervals as e.g. 944244 for
// 0.944244, so rendering the raw number ("944,244") under a "Judge win rate"
// heading reads as a bug. Divide by 1e6 and show three decimals instead.
const RATE_SOURCES = new Set([
  'performance.judge.win_rate_micro',
  'performance.judge.interval_low_micro',
  'performance.judge.interval_high_micro',
]);

/** Format one cell value the way the leaderboard's column says to. */
function cellValue(entry, column) {
  const shown = entry.display && entry.display[column.key] != null ? entry.display[column.key] : entry.values && entry.values[column.key];
  if (shown == null || shown === '') return '—';
  const n = Number(shown);
  if (!Number.isFinite(n)) return esc(shown);
  if (RATE_SOURCES.has(column.source)) return esc((n / 1e6).toFixed(3));
  const precision = column.precision || 0;
  const scaled = precision > 0 ? n / 10 ** precision : n;
  const text = precision > 0 ? scaled.toFixed(2) : num(scaled);
  return esc(text);
}

function row(entry, columns) {
  const avatar = entry.image
    ? `<img class="avatar" crossorigin="anonymous" src="${esc(imageUrl(entry.image))}" alt="" loading="lazy">`
    : '';
  const handle = entry.handle
    ? `<a href="#/u/${encodeURIComponent(entry.handle)}">${avatar}${esc(entry.handle)}</a>`
    : `${avatar}—`;
  return `
    <tr>
      <td class="num">${num(entry.rank)}</td>
      <td>${handle}</td>
      <td>${entry.title ? esc(entry.title) : '—'}</td>
      ${columns
        .map((c) => `<td class="num">${cellValue(entry, c)}</td>`)
        .join('')}
    </tr>`;
}

export function leaderboardPage(data, slug, view, page) {
  const comp = data.competition || {};
  const columns = (data.columns || []).filter((c) => !c.hidden);
  const entries = data.entries || [];
  const total = entries.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const slice = entries.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const views = data.views || [];
  const viewTabs =
    views.length > 1
      ? `<div class="tabs" role="group" aria-label="Leaderboard view">
          ${views
            .map(
              (v) =>
                `<button type="button" class="tab" data-view="${esc(v)}" aria-pressed="${v === (view || data.view) ? 'true' : 'false'}">${esc(v)}</button>`,
            )
            .join('')}
        </div>`
      : '';
  const pager =
    pages > 1
      ? `<div class="pager">
          <button type="button" class="btn btn-ghost" data-page="${current - 1}" ${current <= 1 ? 'disabled' : ''}>← Previous</button>
          <span class="page-info">Page ${current} of ${num(pages)} · ${num(total)} entries</span>
          <button type="button" class="btn btn-ghost" data-page="${current + 1}" ${current >= pages ? 'disabled' : ''}>Next →</button>
        </div>`
      : `<p class="muted small">${num(total)} entries</p>`;
  return `
    <p class="crumbs"><a href="#/">All bounties</a> › <a href="#/bounty/${encodeURIComponent(slug)}">${esc(comp.title || slug)}</a> › Leaderboard</p>
    <div class="lb-head">
      <h1>${esc(data.title || 'Leaderboard')}</h1>
      ${viewTabs}
    </div>
    ${data.phase ? `<p class="muted">${esc(data.phase.title || '')}${data.phase.ends_at ? ` · ends ${esc(data.phase.ends_at.slice(0, 10))}` : ''}</p>` : ''}
    ${data.metrics_withheld ? '<p class="muted small">Some metrics are withheld until the phase finalizes.</p>' : ''}
    <table>
      <thead><tr><th class="num">#</th><th>Entrant</th><th>Entry</th>${columns.map((c) => `<th class="num">${esc(c.title)}</th>`).join('')}</tr></thead>
      <tbody>${slice.map((e) => row(e, columns)).join('') || '<tr><td colspan="99" class="muted">No entries yet.</td></tr>'}</tbody>
    </table>
    ${pager}`;
}
