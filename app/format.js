// Formatting helpers: everything the views show of API values goes through here.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/** A dollar amount ('762.00', 500 or 0.5) as '$762' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** A whole number with thousands separators. */
export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
}

/** A deadline as a date in UTC. */
export function dateUtc(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}

/** The time until a deadline: '6d 3h left', '42m left', '12s left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

/** True while a bounty still takes entries: decided by its deadline, not its status. */
export function isOpen(bounty) {
  return bounty && bounty.deadline ? new Date(bounty.deadline).getTime() > Date.now() : false;
}

/**
 * Minimal safe markdown for bounty descriptions: the text is escaped first,
 * then only headings, lists, bold, inline code and paragraphs are rendered.
 */
export function markdown(text) {
  const lines = esc(text ?? '').split('\n');
  let html = '';
  let list = null;
  const closeList = () => {
    if (list) {
      html += `</${list}>`;
      list = null;
    }
  };
  const inline = (line) =>
    line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length + 1;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
      continue;
    }
    const item = line.match(/^[-*]\s+(.*)$/) || line.match(/^\d+[.)]\s+(.*)$/);
    if (item) {
      const tag = /^\d/.test(line) ? 'ol' : 'ul';
      if (list !== tag) {
        closeList();
        list = tag;
        html += `<${tag}>`;
      }
      html += `<li>${inline(item[1])}</li>`;
      continue;
    }
    closeList();
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  return html;
}
