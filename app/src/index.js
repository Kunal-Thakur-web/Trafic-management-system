const PLACES = [
  { n:"King's Cross Station",      a:"Camden, London",              lat:51.5308, lon:-0.1238 },
  { n:"Canary Wharf",              a:"Tower Hamlets, London",       lat:51.5054, lon:-0.0235 },
  { n:"Heathrow Airport T2",       a:"Hillingdon, London",          lat:51.4776, lon:-0.4614 },
  { n:"London Bridge Station",     a:"Southwark, London",           lat:51.5079, lon:-0.0877 },
  { n:"Oxford Circus",             a:"Westminster, London",         lat:51.5152, lon:-0.1418 },
  { n:"Waterloo Station",          a:"Lambeth, London",             lat:51.5036, lon:-0.1143 },
  { n:"Victoria Station",          a:"Westminster, London",         lat:51.4952, lon:-0.1441 },
  { n:"Liverpool Street",          a:"City of London",              lat:51.5178, lon:-0.0823 },
  { n:"Paddington Station",        a:"Westminster, London",         lat:51.5154, lon:-0.1755 },
  { n:"Stratford Station",         a:"Newham, London",              lat:51.5416, lon:-0.0030 },
  { n:"Gatwick Airport",           a:"West Sussex",                 lat:51.1537, lon:-0.1821 },
  { n:"Greenwich",                 a:"Royal Borough, London",       lat:51.4769, lon:-0.0005 },
  { n:"Brixton",                   a:"Lambeth, London",             lat:51.4613, lon:-0.1156 },
  { n:"Wembley Stadium",           a:"Brent, London",               lat:51.5560, lon:-0.2796 },
  { n:"Tower of London",           a:"Tower Hamlets, London",       lat:51.5081, lon:-0.0759 },
  { n:"Shoreditch High St",        a:"Hackney, London",             lat:51.5225, lon:-0.0784 },
  { n:"Hammersmith",               a:"Hammersmith & Fulham",        lat:51.4927, lon:-0.2239 },
  { n:"Wimbledon",                 a:"Merton, London",              lat:51.4214, lon:-0.2064 },
  { n:"Croydon",                   a:"South London",                lat:51.3762, lon:-0.0982 },
  { n:"Holborn",                   a:"Camden, London",              lat:51.5174, lon:-0.1200 },
  { n:"Euston Station",            a:"Camden, London",              lat:51.5282, lon:-0.1337 },
  { n:"Elephant & Castle",         a:"Southwark, London",           lat:51.4943, lon:-0.1005 },
  { n:"Clapham Common",            a:"Lambeth, London",             lat:51.4613, lon:-0.1376 },
  { n:"Tottenham Hale",            a:"Haringey, London",            lat:51.5883, lon:-0.0594 },
  { n:"Richmond",                  a:"Richmond upon Thames",        lat:51.4613, lon:-0.3037 },
  { n:"Brent Cross",               a:"Barnet, London",              lat:51.5764, lon:-0.2195 },
  { n:"Lewisham",                  a:"Lewisham, London",            lat:51.4614, lon:-0.0135 },
  { n:"Hackney Central",           a:"Hackney, London",             lat:51.5450, lon:-0.0553 },
  { n:"Shepherds Bush",            a:"Hammersmith & Fulham",        lat:51.5050, lon:-0.2272 },
  { n:"St Pancras International",  a:"Camden, London",              lat:51.5320, lon:-0.1233 },
  { n:"Barbican",                  a:"City of London",              lat:51.5205, lon:-0.0975 },
  { n:"Bank",                      a:"City of London",              lat:51.5133, lon:-0.0886 },
  { n:"Aldgate",                   a:"City of London",              lat:51.5143, lon:-0.0755 },
  { n:"Bermondsey",                a:"Southwark, London",           lat:51.4993, lon:-0.0636 },
  { n:"Vauxhall",                  a:"Lambeth, London",             lat:51.4861, lon:-0.1235 },
  { n:"Nine Elms",                 a:"Lambeth, London",             lat:51.4844, lon:-0.1303 },
  { n:"Battersea Power Station",   a:"Wandsworth, London",          lat:51.4816, lon:-0.1440 },
  { n:"Fulham Broadway",           a:"Hammersmith & Fulham",        lat:51.4800, lon:-0.1950 },
  { n:"Chelsea",                   a:"Royal Borough of Kensington", lat:51.4871, lon:-0.1706 },
  { n:"Notting Hill Gate",         a:"Kensington, London",          lat:51.5091, lon:-0.1974 },
  { n:"Angel",                     a:"Islington, London",           lat:51.5323, lon:-0.1058 },
  { n:"Borough Market",            a:"Southwark, London",           lat:51.5055, lon:-0.0910 },
  { n:"Bethnal Green",             a:"Tower Hamlets, London",       lat:51.5270, lon:-0.0549 },
  { n:"Dalston",                   a:"Hackney, London",             lat:51.5454, lon:-0.0750 },
  { n:"Peckham",                   a:"Southwark, London",           lat:51.4734, lon:-0.0694 },
];


function getConvexHull(points) {
  points = points.map(p => ({ x: p.lon, y: p.lat }))
                 .sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

  const cross = (o, a, b) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower = [];
  for (let p of points) {
    while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    let p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();

  return lower.concat(upper).map(p => [p.y, p.x]);
}



let maskLayer = null;
let innerHighlight = null;

function drawDimmedArea() {
  const hull = getConvexHull(PLACES);

  const worldBounds = [
    [-90, -180],
    [-90, 180],
    [90, 180],
    [90, -180]
  ];

  // Remove previous layers
  if (maskLayer) maskLayer.remove();
  if (innerHighlight) innerHighlight.remove();

  // OUTSIDE dim (soft)
  maskLayer = L.polygon([worldBounds, hull], {
    stroke: false,
    fillColor: '#020617',
    fillOpacity: 0.22,
    interactive: false
  }).addTo(map);

  // INSIDE subtle lift (this is the "gradient illusion")
  innerHighlight = L.polygon(hull, {
    color: '#3b82f6',
    weight: 1,
    fillColor: '#3b82f6',
    fillOpacity: 0.03,
    interactive: false
  }).addTo(map);
}


let boundaryLayer = null;

function drawBoundary() {
  const hull = getConvexHull(PLACES);

  if (boundaryLayer) {
    boundaryLayer.remove();
  }

  boundaryLayer = L.polygon(hull, {
    color: '#3b82f6',
    weight: 2,
    fillColor: '#3b82f6',
    fillOpacity: 0.08,
    dashArray: '6,6'
  }).addTo(map);

  // Optional: fit map to boundary
  map.fitBounds(boundaryLayer.getBounds(), {
    paddingTopLeft: [400, 60],
    paddingBottomRight: [40, 40]
  });
}




// ═══════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════
let map = null;
let oMarker = null, dMarker = null;
let oCoord = null, dCoord = null;
let routePolyline = null;
let toastTimer = null;

// ═══════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  document.getElementById('dt-date').value = now.toISOString().slice(0,10);
  document.getElementById('dt-time').value = now.toTimeString().slice(0,5);

  document.addEventListener('click', e => {
    if (!e.target.closest('.loc-wrap')) closeSugs();
  });

  document.getElementById('inp-o').addEventListener('input', () => oCoord = null);
  document.getElementById('inp-d').addEventListener('input', () => dCoord = null);
  document.getElementById('inp-o').addEventListener('keydown', handleEnter);
  document.getElementById('inp-d').addEventListener('keydown', handleEnter);

  initMap();
});

// ═══════════════════════════════════════════════════
//  MAP (Leaflet + OpenStreetMap — free, no key)
// ═══════════════════════════════════════════════════
function initMap() {
  map = L.map('map', {
    center: [51.5074, -0.1278],
    zoom: 11,
    zoomControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  drawDimmedArea();
//   drawBoundary();

  toast('Map loaded ✓', 'ok');
}

// ─── Custom pin icons ───
function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50% 50% 50% 0;
      background:${color};border:2.5px solid #fff;
      transform:rotate(-45deg);
      box-shadow:0 0 10px ${color}88;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -20],
  });
}

function placePin(type, lat, lon, label) {
  const color = type === 'o' ? '#10b981' : '#f43f5e';
  const icon  = makeIcon(color);

  if (type === 'o') {
    if (oMarker) oMarker.remove();
    oMarker = L.marker([lat, lon], { icon }).addTo(map).bindPopup(`<b>From:</b> ${label}`);
  } else {
    if (dMarker) dMarker.remove();
    dMarker = L.marker([lat, lon], { icon }).addTo(map).bindPopup(`<b>To:</b> ${label}`);
  }
}

// ═══════════════════════════════════════════════════
//  AUTOCOMPLETE
// ═══════════════════════════════════════════════════
function suggest(inp, sid) {
  const q  = inp.value.toLowerCase().trim();
  const el = document.getElementById(sid);

  if (!q) { el.classList.remove('open'); el.innerHTML = ''; return; }

  const hits = PLACES.filter(p =>
    p.n.toLowerCase().includes(q) || p.a.toLowerCase().includes(q)
  ).slice(0, 7);

  if (!hits.length) { el.classList.remove('open'); el.innerHTML = ''; return; }

  el.innerHTML = hits.map((p, i) => `
    <div class="sug">
      <span class="sug-ico">📍</span>
      <span class="sug-lbl">
        <strong>${p.n}</strong>
        <small>${p.a}</small>
      </span>
    </div>
  `).join('');

  el.classList.add('open');

  [...el.children].forEach((child, i) => {
    child.onclick = () => pick(sid, hits[i]);
  });
}

function pick(sid, place) {
  const isO   = sid === 'sugs-o';
  const input = document.getElementById(isO ? 'inp-o' : 'inp-d');
  input.value = place.n;

  if (isO) oCoord = place;
  else     dCoord = place;

  closeSugs();
  placePin(isO ? 'o' : 'd', place.lat, place.lon, place.n);
}

function closeSugs() {
  document.querySelectorAll('.sugs').forEach(s => {
    s.classList.remove('open');
    s.innerHTML = '';
  });
}

// ═══════════════════════════════════════════════════
//  INPUT RESOLUTION (typed text → coord)
// ═══════════════════════════════════════════════════
function resolveInput(inputId) {
  const val = document.getElementById(inputId).value.toLowerCase().trim();
  return PLACES.find(p => p.n.toLowerCase() === val)
      || PLACES.find(p => p.n.toLowerCase().includes(val))
      || null;
}

function handleEnter(e) {
  if (e.key !== 'Enter') return;
  const sid   = e.target.id === 'inp-o' ? 'sugs-o' : 'sugs-d';
  const first = document.querySelector(`#${sid} .sug`);
  if (first) first.click();
  else {
    if (e.target.id === 'inp-o') oCoord = resolveInput('inp-o');
    if (e.target.id === 'inp-d') dCoord = resolveInput('inp-d');
  }
}

// ═══════════════════════════════════════════════════
//  HAVERSINE  (used only for straight-line fallback display)
// ═══════════════════════════════════════════════════

/** Haversine distance in km */
function haversine(a, b) {
  const R    = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const s    = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// ═══════════════════════════════════════════════════
//  ROUTE COLOURS  (one per candidate route)
// ═══════════════════════════════════════════════════
const ROUTE_COLORS = [
  { color: '#3b82f6', glow: 'rgba(59,130,246,0.22)',  label: 'Route A', rankLabel: '★ Best Route'  },
  { color: '#f59e0b', glow: 'rgba(245,158,11,0.18)',  label: 'Route B', rankLabel: 'Alternative 1' },
  { color: '#f43f5e', glow: 'rgba(244,63,94,0.18)',   label: 'Route C', rankLabel: 'Alternative 2' },
];

// ═══════════════════════════════════════════════════
//  MAP LAYER STATE
// ═══════════════════════════════════════════════════
// routePolyline is declared above with `let`; allRouteLayers tracks all drawn pairs
let allRouteLayers = [];   // { glow, line } pairs for every drawn route
let activeRouteIdx = 0;    // which route card / polyline is "selected"

// ═══════════════════════════════════════════════════
//  ROUTE DRAWING
// ═══════════════════════════════════════════════════

/** Draw all ranked routes on the map. Index 0 = best = highlighted. */
function drawAllRoutes(ranked) {
  // Remove all previous route polylines
  removeAllRouteLayers();

  // Draw from worst → best so best sits on top
  const reversed = [...ranked].reverse();
  reversed.forEach(r => {
    const ri   = r.rank - 1;  // 0-based index into ROUTE_COLORS
    const col  = ROUTE_COLORS[ri] || ROUTE_COLORS[ROUTE_COLORS.length - 1];
    const pts  = r.coordinates.map(([lon, lat]) => [lat, lon]);
    const isActive = ri === 0;

    const glowLayer = L.polyline(pts, {
      color:   col.glow,
      weight:  isActive ? 14 : 8,
      lineCap: 'round', lineJoin: 'round',
      interactive: false,
    }).addTo(map);

    const lineLayer = L.polyline(pts, {
      color:     col.color,
      weight:    isActive ? 5 : 3,
      opacity:   isActive ? 1 : 0.55,
      dashArray: isActive ? null : '8,6',
      lineCap:   'round', lineJoin: 'round',
    }).addTo(map);

    lineLayer.bindTooltip(
      `${col.label} · ${r.roadKm} km · ${r.travelMin} min · ${r.trafficPct}% congestion`,
      { sticky: true }
    );
    lineLayer.on('click', () => selectRoute(ri, ranked));

    allRouteLayers.push({ glow: glowLayer, line: lineLayer, rank: ri });
  });

  // Fit bounds to the best route
  const best = ranked[0];
  const bestPts = best.coordinates.map(([lon, lat]) => [lat, lon]);
  const bounds  = L.polyline(bestPts).getBounds();
  map.fitBounds(bounds, { paddingTopLeft: [400, 60], paddingBottomRight: [40, 40] });
}

/** Visually highlight route at index `idx`, dim others. Also activates card. */
function selectRoute(idx, ranked) {
  activeRouteIdx = idx;

  allRouteLayers.forEach(({ glow, line, rank }) => {
    const isActive = rank === idx;
    const col = ROUTE_COLORS[rank] || ROUTE_COLORS[ROUTE_COLORS.length - 1];
    glow.setStyle({ weight: isActive ? 14 : 8, color: isActive ? col.glow : 'rgba(100,116,139,0.12)' });
    line.setStyle({
      weight:    isActive ? 5 : 3,
      opacity:   isActive ? 1 : 0.35,
      dashArray: isActive ? null : '8,6',
    });
    if (isActive) line.bringToFront();
  });

  // Sync panel card active state
  document.querySelectorAll('.rcard').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
}

function removeAllRouteLayers() {
  allRouteLayers.forEach(({ glow, line }) => {
    try { glow.remove(); } catch {}
    try { line.remove(); } catch {}
  });
  allRouteLayers = [];
  routePolyline  = null;
}

// kept for compat with clearAll
function removeRouteLayer()  { removeAllRouteLayers(); }
function removeAltLayers()   { /* no-op: merged into removeAllRouteLayers */ }

// ═══════════════════════════════════════════════════
//  RESULT DISPLAY — multi-route cards
// ═══════════════════════════════════════════════════

function congestionColor(pct) {
  if (pct < 30) return 'var(--emerald)';
  if (pct < 60) return 'var(--amber)';
  return 'var(--rose)';
}
function congestionLabel(pct) {
  if (pct < 30) return 'FREE FLOW';
  if (pct < 60) return 'MODERATE';
  return 'CONGESTED';
}
function congestionBg(pct) {
  if (pct < 30) return 'rgba(16,185,129,.08)';
  if (pct < 60) return 'rgba(245,158,11,.08)';
  return 'rgba(244,63,94,.08)';
}
function congestionBorder(pct) {
  if (pct < 30) return 'rgba(16,185,129,.22)';
  if (pct < 60) return 'rgba(245,158,11,.22)';
  return 'rgba(244,63,94,.22)';
}

function buildRouteCard(r, ranked, dateStr, timeStr) {
  const ri   = r.rank - 1;
  const col  = ROUTE_COLORS[ri] || ROUTE_COLORS[ROUTE_COLORS.length - 1];
  const pct  = Math.min(100, Math.max(0, r.trafficPct));
  const cCol = congestionColor(pct);

  // ETA
  let eta = r.eta || '--';
  if (!r.eta && dateStr && timeStr) {
    const etaDt = new Date(`${dateStr}T${timeStr}`);
    etaDt.setMinutes(etaDt.getMinutes() + r.travelMin);
    eta = etaDt.toTimeString().slice(0, 5);
  }

  // Roads list HTML
  const roadsHTML = (r.roads && r.roads.length)
    ? `
      <div class="road-step"><div class="road-sdot o"></div><span>${oCoord.n}</span></div>
      ${r.roads.map(rd => `<div class="road-step"><div class="road-sdot"></div><span>via ${rd}</span></div>`).join('')}
      <div class="road-step"><div class="road-sdot d"></div><span>${dCoord.n}</span></div>
    `
    : `<div class="road-step"><div class="road-sdot o"></div><span>${oCoord.n}</span></div>
       <div class="road-step"><div class="road-sdot d"></div><span>${dCoord.n}</span></div>`;

  return `
<div class="rcard" style="--rc-color:${col.color}" data-idx="${ri}" onclick="selectRoute(${ri}, window._ranked)">
  <div class="rcard-head">
    <div class="rcard-label-row">
      <div class="rcard-dot"></div>
      <span class="rcard-label">${col.label} ${ri === 0 ? '· Best' : ''}</span>
    </div>
    <span class="rcard-badge" style="color:${cCol};background:${congestionBg(pct)};border-color:${congestionBorder(pct)}">
      ${congestionLabel(pct)}
    </span>
  </div>

  <div class="rcard-stats">
    <div class="rcs accent">
      <div class="v">${r.travelMin}</div>
      <div class="u">Min</div>
    </div>
    <div class="rcs">
      <div class="v">${r.roadKm}</div>
      <div class="u">km</div>
    </div>
    <div class="rcs">
      <div class="v">${r.delay}</div>
      <div class="u">Delay</div>
    </div>
    <div class="rcs">
      <div class="v">${r.avgSpeed}</div>
      <div class="u">km/h</div>
    </div>
  </div>

  <div class="rcard-cbar-wrap">
    <div class="rcard-cbar-top">
      <span class="rcard-cbar-lbl">Congestion Rate</span>
      <span class="rcard-cbar-val" style="color:${cCol}">${pct.toFixed(1)}%</span>
    </div>
    <div class="rcard-cbar">
      <div class="rcard-cptr" style="left:${pct}%"></div>
    </div>
  </div>

  <div class="rcard-chips">
    <div class="rcard-chip">
      <div class="ic-val">${eta}</div>
      <div class="ic-lbl">ETA</div>
    </div>
    <div class="rcard-chip">
      <div class="ic-val">${r.co2}</div>
      <div class="ic-lbl">CO₂ g/km</div>
    </div>
    <div class="rcard-chip">
      <div class="ic-val">${r.vehicles ? Math.round(r.vehicles) : '--'}</div>
      <div class="ic-lbl">Veh/hr</div>
    </div>
  </div>

  <div class="rcard-toggle" onclick="event.stopPropagation(); toggleCard(this)">
    <span>Road Summary</span>
    <span class="rcard-toggle-arrow">▾</span>
  </div>
  <div class="rcard-roads">${roadsHTML}</div>
</div>`;
}

function toggleCard(toggleEl) {
  toggleEl.closest('.rcard').classList.toggle('open');
}

function showAllRoutes(ranked, dateStr, timeStr) {
  // Store globally so onclick handlers can reference it
  window._ranked = ranked;

  document.getElementById('route-count-badge').textContent =
    `${ranked.length} route${ranked.length > 1 ? 's' : ''}`;

  const container = document.getElementById('route-cards');
  container.innerHTML = ranked.map(r => buildRouteCard(r, ranked, dateStr, timeStr)).join('');

  // Mark best card active
  const cards = container.querySelectorAll('.rcard');
  if (cards[0]) cards[0].classList.add('active');

  document.getElementById('res-sec').classList.add('vis');
}

// ═══════════════════════════════════════════════════
//  LOADING STATE
// ═══════════════════════════════════════════════════
function loading(on) {
  const btn  = document.getElementById('go-btn');
  const icon = document.getElementById('go-icon');
  const txt  = document.getElementById('go-txt');
  const spin = document.getElementById('go-spin');

  btn.disabled       = on;
  icon.style.display = on ? 'none' : '';
  spin.style.display = on ? 'block' : 'none';
  txt.textContent    = on ? 'Calculating…' : 'Find Shortest Route';
}

// ═══════════════════════════════════════════════════
//  CLEAR
// ═══════════════════════════════════════════════════
function clearAll() {
  if (oMarker) { oMarker.remove(); oMarker = null; }
  if (dMarker) { dMarker.remove(); dMarker = null; }

  removeAllRouteLayers();
  map.eachLayer(l => { if (l instanceof L.Polyline) l.remove(); });

  oCoord = null;
  dCoord = null;
  window._ranked = null;

  document.getElementById('inp-o').value = '';
  document.getElementById('inp-d').value = '';
  document.getElementById('res-sec').classList.remove('vis');
  document.getElementById('route-cards').innerHTML = '';
  document.getElementById('clr-btn').classList.remove('vis');

  map.setView([51.5074, -0.1278], 11);
  toast('Route cleared', 'ok');
}

// ═══════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════
function toast(msg, type) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.className = `show ${type || ''}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2800);
}

// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const API_BASE  = 'http://localhost:5050';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ═══════════════════════════════════════════════════
//  OSRM helpers
// ═══════════════════════════════════════════════════
async function fetchOSRMRoutes(o, d) {
  const url = `${OSRM_BASE}/${o.lon},${o.lat};${d.lon},${d.lat}`
            + `?overview=full&geometries=geojson&steps=true&alternatives=3`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OSRM error ${resp.status}`);
  const data = await resp.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('OSRM: no route found');
  return data.routes;
}

function extractRoadNames(osrmRoute) {
  try {
    const names = [];
    for (const step of osrmRoute.legs[0].steps) {
      const n = (step.name || '').trim();
      if (n && !names.includes(n) && !/^\d+$/.test(n)) names.push(n);
    }
    return names.slice(0, 6);
  } catch { return []; }
}

// ═══════════════════════════════════════════════════
//  MAIN ROUTE FUNCTION
// ═══════════════════════════════════════════════════
async function findRoute() {
  if (!oCoord) oCoord = resolveInput('inp-o');
  if (!dCoord) dCoord = resolveInput('inp-d');

  if (!oCoord) { toast('Invalid starting location', 'err'); return; }
  if (!dCoord) { toast('Invalid destination',        'err'); return; }
  if (oCoord.n === dCoord.n) { toast('Origin and destination are the same', 'err'); return; }

  loading(true);
  removeAllRouteLayers();

  try {
    const dateStr = document.getElementById('dt-date').value;
    const timeStr = document.getElementById('dt-time').value || '12:00';
    const isoStr  = `${dateStr}T${timeStr}`;

    // 1. Fetch real alternative routes from OSRM
    const osrmRoutes = await fetchOSRMRoutes(oCoord, dCoord);

    // 2. Build payload for ML server — send all routes' full geometry
    const routePayload = osrmRoutes.map((r, i) => ({
      index:       i,
      distance_m:  r.distance,
      duration_s:  r.duration,
      coordinates: r.geometry.coordinates,
      roads:       extractRoadNames(r),
    }));

    // 3. ML server scores each route on its actual road coordinates
    const mlResp = await fetch(`${API_BASE}/score_routes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datetime: isoStr, routes: routePayload }),
    }).catch(() => null);

    let ranked;

    if (mlResp && mlResp.ok) {
      ({ ranked } = await mlResp.json());
    } else {
      // ML server offline — build heuristic stats for each OSRM route
      toast('ML server offline — heuristic traffic only', 'err');
      const hour = parseInt(timeStr.split(':')[0]);
      const rush = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      ranked = osrmRoutes.map((r, i) => {
        const trafficPct = Math.min(100, (rush ? 55 : 15) + (i * 12) + Math.round(Math.random() * 15));
        const avgSpeed   = Math.max(8, Math.round(45 - 37 * trafficPct / 100));
        const roadKm     = Math.round(r.distance / 100) / 10;
        const delay      = Math.round((r.duration / 60) * (trafficPct / 100) * 0.4);
        const travelMin  = Math.round(r.duration / 60) + delay;
        return {
          rank: i + 1, osrm_index: i,
          coordinates: r.geometry.coordinates,
          roadKm, travelMin, delay, avgSpeed, trafficPct,
          co2:   Math.round(110 + (trafficPct / 100) * 40),
          roads: extractRoadNames(r),
          vehicles: null, score: travelMin,
        };
      });
      ranked.sort((a, b) => a.score - b.score);
      ranked.forEach((r, i) => r.rank = i + 1);
    }

    // 4. Draw all routes on map, best highlighted
    placePin('o', oCoord.lat, oCoord.lon, oCoord.n);
    placePin('d', dCoord.lat, dCoord.lon, dCoord.n);
    drawAllRoutes(ranked);

    // 5. Render all route cards in the panel
    showAllRoutes(ranked, dateStr, timeStr);

    loading(false);
    document.getElementById('clr-btn').classList.add('vis');
    toast(`${ranked.length} routes compared · Best: ${ranked[0].travelMin} min`, 'ok');

  } catch (err) {
    console.error('[findRoute]', err);
    loading(false);
    toast(`Routing failed — ${err.message}`, 'err');
  }
}