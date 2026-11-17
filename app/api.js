// make.fun's public API: read-only GET requests, open to any origin (CORS).
// Full spec: https://make.fun/api/openapi.json
//
// Every answer is cached in memory and revalidated with its ETag, which the
// API binds to the minute: a revalidation inside the same minute answers 304
// and costs no body; once the minute turns it answers 200 with a fresh tag.
// In-flight requests for the same path are shared, so a view that asks twice
// (or two views that ask for the same bounty) sends one request.

const API = 'https://make.fun/api';

const cache = new Map(); // path -> { etag, body, at }
const inflight = new Map(); // path -> Promise

async function request(path) {
  if (inflight.has(path)) return inflight.get(path);
  const job = (async () => {
    const headers = {};
    const held = cache.get(path);
    if (held && held.etag) headers['If-None-Match'] = held.etag;
    const res = await fetch(API + path, { headers });
    if (res.status === 304 && held) return held.body;
    if (!res.ok) throw new Error(`make.fun API ${res.status} for ${path}`);
    const body = await res.json();
    cache.set(path, { etag: res.headers.get('ETag'), body, at: Date.now() });
    return body;
  })();
  inflight.set(path, job);
  try {
    return await job;
  } finally {
    inflight.delete(path);
  }
}

/** A cached body for a path, or undefined when nothing is held yet. */
export function cached(path) {
  const held = cache.get(path);
  return held ? held.body : undefined;
}

/** The open bounties, board-shaped (activity=times leaves out the activity a board does not show). */
export function getBounties() {
  return request('/competitions?status=open&activity=times');
}

/** One bounty, by its slug. Reuses the board's copy when it is already held. */
export async function getBounty(slug) {
  const key = `/competitions/${encodeURIComponent(slug)}`;
  const board = cached('/competitions?status=open&activity=times');
  const listed = board && board.items ? board.items.find((b) => b.slug === slug) : null;
  // The board row carries everything the page needs except rewards/phases;
  // fetch the full object anyway for those, but the row lets the page paint
  // its header immediately from cache.
  const full = await request(key);
  return { full, listed };
}

/** A bounty's leaderboard: entries, columns and the views it offers. */
export function getLeaderboard(slug, view) {
  const suffix = view ? `?view=${encodeURIComponent(view)}` : '';
  return request(`/competitions/${encodeURIComponent(slug)}/leaderboard${suffix}`);
}

/** An account's public profile. */
export function getProfile(handle) {
  return request(`/profiles/${encodeURIComponent(handle)}`);
}

/** An account's rank, for the profile's context line. */
export function getRanking(handle) {
  return request(`/rankings/${encodeURIComponent(handle)}`);
}

/** An API-relative image path (avatars, share cards) as an absolute URL. */
export function imageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `https://make.fun${path.startsWith('/') ? '' : '/'}${path}`;
}
