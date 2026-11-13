import { ack, fetchIncidents } from './api.js';

const REFRESH_MS = 2000; // R4
const board = document.querySelector('[data-testid="board"]');
const list = document.querySelector('[data-testid="incident-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const empty = document.querySelector('[data-testid="empty"]');
const acked = new Set(); // incident ids acked in this tab

// R5: viewer's zone and locale order (en-GB/de-DE → day first, en-US → month first).
const fmt = new Intl.DateTimeFormat(navigator.languages?.[0] ?? navigator.language, {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function rowHtml(i) {
  return `<span class="id">${esc(i.id)}</span>
    <span class="sev">${esc(i.severity)}</span>
    <span class="what">${esc(i.service)} · ${esc(i.region)} · ${esc(i.summary)}</span>
    <time datetime="${esc(i.openedAt)}">${esc(fmt.format(new Date(i.openedAt)))}</time>
    <span class="act"></span>`;
}

function setAction(li) {
  const id = li.dataset.id;
  const act = li.querySelector('.act');
  act.innerHTML = acked.has(id)
    ? '<span data-testid="acked" class="acked">acked</span>'
    : `<button type="button" data-testid="ack" aria-label="Ack ${esc(id)}">Ack</button>`;
}

// Rows are keyed by incident id: existing rows stay in place (and keep their state);
// new ones are inserted above them in API order, newest first (R1).
function render(incidents) {
  const have = new Map([...list.children].map((li) => [li.dataset.id, li]));
  let prev = null;
  for (const i of incidents) {
    let li = have.get(i.id);
    if (!li) {
      li = document.createElement('li');
      li.setAttribute('data-testid', 'incident-row');
      li.dataset.id = i.id;
      li.className = `row ${i.severity}`;
      li.innerHTML = rowHtml(i);
      setAction(li);
    }
    have.delete(i.id);
    const at = prev ? prev.nextSibling : list.firstChild;
    if (li !== at) list.insertBefore(li, at);
    prev = li;
  }
  for (const gone of have.values()) gone.remove();
  empty.hidden = incidents.length > 0;
}

// R2: the click acks the row it sits in, by that row's id, never by position.
list.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-testid="ack"]');
  if (!btn) return;
  const li = btn.closest('[data-testid="incident-row"]');
  btn.disabled = true;
  try {
    await ack(li.dataset.id);
    acked.add(li.dataset.id);
    setAction(li);
  } catch (err) {
    btn.disabled = false;
    console.error(err);
  }
});

async function tick() {
  try {
    const page = await fetchIncidents();
    render(page.incidents);
    loader.hidden = true; // R3: gone once incidents are on screen
    board.setAttribute('aria-busy', 'false');
  } catch (err) {
    console.error(err);
  } finally {
    setTimeout(tick, REFRESH_MS); // R4: one request at a time
  }
}
tick();
