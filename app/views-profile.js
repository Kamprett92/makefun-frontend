// An account's public profile: avatar, bio, links, wallet, record stats and
// every solution, each linking back to its bounty.

import { dateUtc, esc, money, num } from './format.js';
import { imageUrl } from './api.js';

function avatarImg(profile) {
  const src = imageUrl(profile.avatar || profile.image);
  if (src) {
    return `<img class="profile-avatar" crossorigin="anonymous" src="${esc(src)}" alt="Avatar of ${esc(profile.handle)}">`;
  }
  const letter = (profile.display_name || profile.handle || '?').slice(0, 1).toUpperCase();
  return `<span class="profile-avatar-fallback" aria-hidden="true">${esc(letter)}</span>`;
}

function solutionItem(solution) {
  const comp = solution.competition || {};
  const placement = solution.placement != null ? `#${num(solution.placement)}` : '—';
  const prize = solution.prize_usd != null ? money(solution.prize_usd) : '—';
  const score = solution.score && solution.score.display ? esc(solution.score.display) : '—';
  return `
    <li>
      <a class="sol-title" href="#/bounty/${encodeURIComponent(comp.slug || '')}">${esc(solution.title || comp.title || 'Untitled')}</a>
      <div class="sol-meta">
        <span>${esc(comp.title || '')}</span>
        <span>Placement: <b>${placement}</b></span>
        <span>Score: <b>${score}</b></span>
        <span>Prize: <b>${prize}</b></span>
        ${solution.entered_at ? `<span>Entered ${dateUtc(solution.entered_at)}</span>` : ''}
      </div>
    </li>`;
}

export function profilePage(profile, ranking) {
  const record = profile.record || {};
  const solutions = profile.solutions || [];
  const links = [];
  if (profile.github_login) links.push(`<span>GitHub @${esc(profile.github_login)}</span>`);
  if (profile.discord && profile.discord.url) links.push(`<a href="${esc(profile.discord.url)}">Discord ${esc(profile.discord.username || '')}</a>`);
  if (profile.x) links.push(`<a href="${esc(typeof profile.x === 'string' ? profile.x : profile.x.url || '')}">X</a>`);
  if (profile.wallet && profile.wallet.explorer_url) {
    links.push(`<a href="${esc(profile.wallet.explorer_url)}">Wallet ${esc((profile.wallet.address || '').slice(0, 8))}…</a>`);
  }
  const rank =
    ranking && ranking.account && ranking.account.rank != null ? ranking.account.rank : null;
  const rankLine =
    rank != null && ranking.total
      ? `Ranked #${num(rank)} of ${num(ranking.total)} accounts`
      : '';
  return `
    <p class="crumbs"><a href="#/">All bounties</a> › Profile</p>
    <div class="profile-head">
      ${avatarImg(profile)}
      <div>
        <h1>${esc(profile.display_name || profile.handle)}</h1>
        <p class="muted">@${esc(profile.handle)} · joined ${profile.joined_at ? dateUtc(profile.joined_at) : '—'}${rankLine ? ` · ${rankLine}` : ''}</p>
        ${profile.bio ? `<p>${esc(profile.bio)}</p>` : ''}
        ${links.length ? `<div class="profile-links">${links.join('')}</div>` : ''}
      </div>
    </div>
    <div class="stats">
      <div class="fact"><span class="label">Entered</span><span class="value">${num(record.competitions_entered)}</span></div>
      <div class="fact"><span class="label">Placed</span><span class="value">${num(record.competitions_placed)}</span></div>
      <div class="fact"><span class="label">Won</span><span class="value">${num(record.competitions_won)}</span></div>
      <div class="fact"><span class="label">Podiums</span><span class="value">${num(record.podium_finishes)}</span></div>
      <div class="fact"><span class="label">Best place</span><span class="value">${record.best_placement != null ? `#${num(record.best_placement)}` : '—'}</span></div>
      <div class="fact"><span class="label">Prize money</span><span class="value">${money(record.prize_usd)}</span></div>
    </div>
    <h2>Solutions (${num(solutions.length)})</h2>
    ${solutions.length ? `<ul class="solutions">${solutions.map(solutionItem).join('')}</ul>` : '<p class="empty">No solutions yet.</p>'}`;
}
