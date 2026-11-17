// One bounty's page: summary, facts, the rewards table with the live pot,
// dates and status, then the description and rules as safe markdown.

import { dateUtc, esc, isOpen, markdown, money, num, timeLeft } from './format.js';
import { feeChip, pot } from './views-board.js';

function rewardsTable(bounty) {
  const rewards = bounty.rewards || {};
  const places = Object.keys(rewards)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (!places.length) return '<p class="muted">No rewards table published yet.</p>';
  return `
    <table>
      <thead><tr><th>Place</th><th class="num">Reward</th></tr></thead>
      <tbody>
        ${places
          .map(
            (place) =>
              `<tr><td>${place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : ''} ${place}${place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'}</td><td class="num">${money(rewards[String(place)])}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

function phasesList(bounty) {
  const phases = bounty.phases || [];
  if (!phases.length) return '';
  return `
    <h2>Dates</h2>
    <table>
      <thead><tr><th>Phase</th><th>Starts</th><th>Ends</th></tr></thead>
      <tbody>
        ${phases
          .map(
            (p) =>
              `<tr><td>${esc(p.title || p.key)}</td><td>${p.startsAt ? dateUtc(p.startsAt) : '—'}</td><td>${p.endsAt ? dateUtc(p.endsAt) : '—'}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

export function bountyPage(bounty) {
  const open = isOpen(bounty);
  return `
    <p class="crumbs"><a href="#/">All bounties</a> › ${esc(bounty.category || 'Bounty')}</p>
    <h1>${esc(bounty.title)}</h1>
    <p class="muted">${esc(bounty.summary || '')}</p>
    <div class="facts">
      <div class="fact"><span class="label">Live pot</span><span class="value">${pot(bounty)}</span></div>
      <div class="fact"><span class="label">Entry fee</span><span class="value">${bounty.entryFeeUsd != null ? money(bounty.entryFeeUsd) : 'Free'}</span></div>
      <div class="fact"><span class="label">Time left</span><span class="value" data-deadline="${esc(bounty.deadline)}">${timeLeft(bounty.deadline)}</span></div>
      <div class="fact"><span class="label">Entries</span><span class="value">${num(bounty.submissionCount)}</span></div>
      <div class="fact"><span class="label">Status</span><span class="value">${open ? 'Open' : 'Ended'}</span></div>
    </div>
    <div class="actions">
      <a class="btn" href="#/bounty/${encodeURIComponent(bounty.slug)}/leaderboard">View leaderboard</a>
      <a class="btn btn-ghost" href="https://make.fun/bounty/${encodeURIComponent(bounty.slug)}" target="_blank" rel="noopener">Open on make.fun ↗</a>
    </div>
    <h2>Rewards</h2>
    ${rewardsTable(bounty)}
    <p class="muted small">The live pot is the prize plus every entry fee paid in so far${bounty.entryFeeUsd != null ? ` (${feeChip(bounty)} per entry)` : ''}.</p>
    ${phasesList(bounty)}
    <h2>Description &amp; rules</h2>
    <div class="description">${markdown(bounty.description || bounty.summary || '')}</div>`;
}
