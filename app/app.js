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

// A row carries no Ack (product, after step 1): it shows the acked mark once its incident is acked.
function setAction(li) {
  li.querySelector('.act').innerHTML = acked.has(li.dataset.id)
    ? '<span data-testid="acked" class="acked">acked</span>'
    : '<span class="open">Open ›</span>';
}

// Rows are keyed by incident id. Existing rows are never moved or removed (a moved row is a row
// taken from under the pointer); incidents not seen before go on top, in API order, newest first (R1).
function render(incidents) {
  const seen = new Set([...list.children].map((li) => li.dataset.id));
  const anchor = list.firstChild;
  for (const i of incidents) {
    if (seen.has(i.id)) continue;
    const li = document.createElement('li');
    li.setAttribute('data-testid', 'incident-row');
    li.dataset.id = i.id;
    li.className = `row ${i.severity}`;
    li.innerHTML = rowHtml(i);
    setAction(li);
    list.insertBefore(li, anchor);
  }
  empty.hidden = list.children.length > 0;
}

// R2 (changed by product): a row opens its incident panel; Ack lives in the panel and acks the
// incident the panel names, so a row moving under the pointer can never ack the wrong incident.
const panel = document.querySelector('[data-testid="incident-panel"]');
const panelId = panel.querySelector('.panel-id');
const panelWhat = panel.querySelector('.panel-what');
const panelAck = panel.querySelector('[data-testid="panel-ack"]');
const panelState = panel.querySelector('.panel-state');
let open = null; // the incident id the panel names

function showPanel(li) {
  open = li.dataset.id;
  panelId.textContent = open;
  panelWhat.textContent = `${li.querySelector('.sev').textContent} · ${li.querySelector('.what').textContent} · ${li.querySelector('time').textContent}`;
  const done = acked.has(open);
  panelAck.hidden = done;
  panelAck.disabled = false;
  panelAck.textContent = `Ack ${open}`;
  panelState.textContent = done ? 'Acked.' : '';
  panel.hidden = false;
  for (const r of list.querySelectorAll('.row.selected')) r.classList.remove('selected');
  li.classList.add('selected');
}

list.addEventListener('click', (e) => {
  const li = e.target.closest('[data-testid="incident-row"]');
  if (li) showPanel(li);
});

panelAck.addEventListener('click', async () => {
  const id = open;
  panelAck.disabled = true;
  try {
    await ack(id);
    acked.add(id);
    const li = list.querySelector(`[data-testid="incident-row"][data-id="${CSS.escape(id)}"]`);
    if (li) setAction(li);
    if (open === id) { panelAck.hidden = true; panelState.textContent = 'Acked.'; }
  } catch (err) {
    panelAck.disabled = false;
    panelState.textContent = 'Ack failed. Try again.';
    console.error(err);
  }
});

panel.querySelector('.panel-close').addEventListener('click', () => {
  panel.hidden = true;
  open = null;
  for (const r of list.querySelectorAll('.row.selected')) r.classList.remove('selected');
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
