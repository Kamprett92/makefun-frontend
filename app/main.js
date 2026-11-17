// Router + shell for the make.fun frontend.
//
//   #/                            the bounty board
//   #/bounty/<slug>               one bounty
//   #/bounty/<slug>/leaderboard   that bounty's leaderboard
//   #/u/<handle>                  an account's public profile
//
// Views load lazily by literal dynamic import(), so the first load is only
// the shell, the API cache and the formatters. window.__shotReady is false
// while a route loads and true once its data has rendered, so a screenshot
// script knows when to capture. Countdowns tick in place every 30 seconds:
// the numbers change, the page is never rebuilt for them.

import { cached, getBounties, getBounty, getLeaderboard, getProfile, getRanking } from './api.js';
import { timeLeft } from './format.js';

const app = document.getElementById('app');
let routeToken = 0;
let ticker = null;

/** Refresh every live countdown on screen, without touching anything else. */
function tickCountdowns() {
  const now = Date.now();
  document.querySelectorAll('[data-deadline]').forEach((el) => {
    const left = new Date(el.getAttribute('data-deadline')).getTime() - now;
    if (left <= 0 && el.textContent !== 'ended') el.textContent = 'ended';
    else if (left > 0) el.textContent = timeLeft(el.getAttribute('data-deadline'));
  });
}

function startTicker() {
  if (ticker) return;
  ticker = setInterval(tickCountdowns, 30000);
}

function showLoading(message) {
  app.innerHTML = `<p class="loading">${message}</p><div class="skeleton"></div>`;
}

function showError(message) {
  app.innerHTML = `<div class="error"><strong>Something went wrong.</strong> ${message} <a href="#/">Back to the board</a>.</div>`;
}

/** Wire the board's search / sort / filter controls to re-render only its list. */
function wireBoard(items) {
  const list = document.getElementById('board-list');
  const count = document.getElementById('board-count');
  const search = document.getElementById('board-search');
  const sort = document.getElementById('board-sort');
  const category = document.getElementById('board-category');
  const state = { query: '', sort: 'deadline', category: '' };
  const apply = async () => {
    const { renderList } = await import('./views-board.js');
    const shown = renderList(list, items, state);
    count.textContent = `${shown} of ${items.length}`;
  };
  search.addEventListener('input', () => {
    state.query = search.value;
    apply();
  });
  sort.addEventListener('change', () => {
    state.sort = sort.value;
    apply();
  });
  category.addEventListener('change', () => {
    state.category = category.value;
    apply();
  });
  apply();
}

async function renderBoard(token) {
  const { boardPage } = await import('./views-board.js');
  const data = await getBounties();
  if (token !== routeToken) return;
  document.title = 'make.fun bounties';
  app.innerHTML = boardPage(data.items || []);
  wireBoard(data.items || []);
}

async function renderBounty(token, slug) {
  const { bountyPage } = await import('./views-bounty.js');
  // Paint the header from the board's cached row first when it is held, so
  // the page shows something before the full object arrives.
  const held = cached('/competitions?status=open&activity=times');
  const listed = held && held.items ? held.items.find((b) => b.slug === slug) : null;
  if (listed) {
    document.title = `${listed.title} | make.fun bounties`;
    app.innerHTML = bountyPage(listed);
  }
  const { full } = await getBounty(slug);
  if (token !== routeToken) return;
  document.title = `${full.title} | make.fun bounties`;
  app.innerHTML = bountyPage(full);
}

async function renderLeaderboard(token, slug, query) {
  const { leaderboardPage, PAGE_SIZE } = await import('./views-leaderboard.js');
  const params = new URLSearchParams(query);
  const view = params.get('view') || undefined;
  const page = Number(params.get('page')) || 1;
  const data = await getLeaderboard(slug, view);
  if (token !== routeToken) return;
  document.title = `Leaderboard · ${data.competition ? data.competition.title : slug} | make.fun bounties`;
  app.innerHTML = leaderboardPage(data, slug, view, page);
  const go = (next) => {
    const nextParams = new URLSearchParams(query);
    if (next.view) nextParams.set('view', next.view);
    if (next.page) nextParams.set('page', String(next.page));
    location.hash = `#/bounty/${slug}/leaderboard?${nextParams.toString()}`;
  };
  app.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => go({ page: Number(button.getAttribute('data-page')) }));
  });
  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => go({ view: button.getAttribute('data-view'), page: 1 }));
  });
  void PAGE_SIZE;
}

async function renderProfile(token, handle) {
  const { profilePage } = await import('./views-profile.js');
  const [profile, ranking] = await Promise.all([
    getProfile(handle),
    getRanking(handle).catch(() => null),
  ]);
  if (token !== routeToken) return;
  document.title = `${profile.display_name || profile.handle} | make.fun bounties`;
  app.innerHTML = profilePage(profile, ranking);
}

async function render() {
  const token = ++routeToken;
  window.__shotReady = false;
  startTicker();
  const hash = location.hash || '#/';
  const path = hash.replace(/^#/, '');
  const [route, query = ''] = path.split('?');
  try {
    const bountyMatch = route.match(/^\/bounty\/([^/]+)\/leaderboard$/);
    const profileMatch = route.match(/^\/u\/([^/]+)$/);
    const singleMatch = route.match(/^\/bounty\/([^/]+)$/);
    if (bountyMatch) {
      showLoading('Loading leaderboard…');
      await renderLeaderboard(token, decodeURIComponent(bountyMatch[1]), query);
    } else if (profileMatch) {
      showLoading('Loading profile…');
      await renderProfile(token, decodeURIComponent(profileMatch[1]));
    } else if (singleMatch) {
      showLoading('Loading bounty…');
      await renderBounty(token, decodeURIComponent(singleMatch[1]));
    } else {
      showLoading('Loading bounties…');
      await renderBoard(token);
    }
  } catch (error) {
    if (token !== routeToken) return;
    showError('The make.fun API did not answer. Please try again in a moment.');
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
