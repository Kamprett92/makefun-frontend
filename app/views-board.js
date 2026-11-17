// The bounty board: every open bounty as a card, with sort, category filter
// and search. Filtering and sorting re-render only the list, never the page,
// and countdowns tick in place (see main.js).

import { esc, isOpen, money, num, timeLeft } from './format.js';

/** The reward as it stands now: the prize plus any entry fees paid into it. */
export function pot(bounty) {
  return money(bounty.potUsd ?? bounty.rewardAmount);
}

/** The entry fee chip, when the bounty charges one. */
export function feeChip(bounty) {
  return bounty.entryFeeUsd != null
    ? `<span class="fee">${money(bounty.entryFeeUsd)} entry fee</span>`
    : '<span>No entry fee</span>';
}

function card(bounty) {
  const open = isOpen(bounty);
  return `
    <li class="card">
      <div class="card-top">
        <a class="card-title" href="#/bounty/${encodeURIComponent(bounty.slug)}">${esc(bounty.title)}</a>
        <span class="pot">${pot(bounty)}</span>
      </div>
      <div class="card-meta">
        <span class="chip ${open ? 'open' : 'closed'}">${open ? 'Open' : 'Ended'}</span>
        ${bounty.category ? `<span>${esc(bounty.category)}</span>` : ''}
        ${feeChip(bounty)}
        <span><b data-deadline="${esc(bounty.deadline)}">${timeLeft(bounty.deadline)}</b></span>
        <span><b>${num(bounty.submissionCount)}</b> ${bounty.submissionCount === 1 ? 'entry' : 'entries'}</span>
      </div>
      ${bounty.summary ? `<p class="muted small">${esc(bounty.summary)}</p>` : ''}
    </li>`;
}

const SORTS = {
  // Soonest deadline first, but bounties still taking entries always rank
  // above ended ones — the board's first screen should be live bounties.
  deadline: (a, b) => (isOpen(a) === isOpen(b) ? new Date(a.deadline) - new Date(b.deadline) : isOpen(a) ? -1 : 1),
  reward: (a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount),
  entries: (a, b) => (b.submissionCount || 0) - (a.submissionCount || 0),
};

/** Filter + sort the board rows, then render them into the list element. */
export function renderList(listEl, items, state) {
  const query = state.query.trim().toLowerCase();
  let rows = items.filter((b) => {
    if (state.category && b.category !== state.category) return false;
    if (query) {
      const hay = `${b.title} ${b.summary || ''} ${b.category || ''}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  rows = rows.slice().sort(SORTS[state.sort] || SORTS.deadline);
  listEl.innerHTML = rows.length
    ? rows.map(card).join('')
    : '<li class="empty">No bounties match that filter.</li>';
  return rows.length;
}

export function boardPage(items) {
  const categories = [...new Set(items.map((b) => b.category).filter(Boolean))].sort();
  const open = items.filter(isOpen).length;
  return `
    <h1>Open bounties</h1>
    <p class="muted">${num(items.length)} bounties on the board · ${num(open)} still taking entries · pots grow as entry fees are paid in.</p>
    <div class="toolbar" role="search">
      <input type="search" id="board-search" placeholder="Search bounties…" aria-label="Search bounties">
      <select id="board-sort" aria-label="Sort bounties">
        <option value="deadline">Soonest deadline</option>
        <option value="reward">Largest pot</option>
        <option value="entries">Most entries</option>
      </select>
      <select id="board-category" aria-label="Filter by category">
        <option value="">All categories</option>
        ${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
      </select>
      <span class="count" id="board-count"></span>
    </div>
    <ul class="board" id="board-list"></ul>`;
}
