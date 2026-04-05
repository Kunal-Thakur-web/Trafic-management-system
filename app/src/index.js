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
//  MOCK ROUTE ENGINE
//  Generates a plausible curved polyline + random stats
// ═══════════════════════════════════════════════════

/** Haversine distance in km */
function haversine(a, b) {
  const R   = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const s   = Math.sin(dLat/2)**2
    + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180)
    * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

/** Interpolate a slightly curved path with intermediate "waypoints" */
function buildMockPath(o, d) {
  const steps = 12;
  const pts   = [];

  for (let i = 0; i <= steps; i++) {
    const t   = i / steps;
    const lat = o.lat + (d.lat - o.lat) * t;
    const lon = o.lon + (d.lon - o.lon) * t;

    // Add organic curve: perpendicular wiggle + noise
    const perp = { lat: -(d.lon - o.lon), lon: d.lat - o.lat };
    const mag  = Math.sqrt(perp.lat**2 + perp.lon**2) || 1;
    const curveAmt = Math.sin(t * Math.PI) * (0.008 + Math.random() * 0.004);
    const noiseAmt = (Math.random() - 0.5) * 0.003;

    pts.push([
      lat + (perp.lat / mag) * curveAmt + noiseAmt,
      lon + (perp.lon / mag) * curveAmt + noiseAmt,
    ]);
  }
  return pts;
}

/** Seeded-ish random mock stats based on coords */
function mockStats(o, d, dateStr, timeStr) {
  const dist       = haversine(o, d);
  const straightKm = Math.round(dist * 10) / 10;

  // Road distance is ~1.3–1.6× straight line
  const roadKm     = Math.round(straightKm * (1.3 + Math.random() * 0.3) * 10) / 10;

  // Rush hour: 7-9am, 5-7pm → higher delay
  const hour    = parseInt((timeStr || '12:00').split(':')[0]);
  const rush    = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const delay   = rush ? Math.round(3 + Math.random() * 8) : Math.round(0 + Math.random() * 4);
  const avgSpeed = rush ? Math.round(18 + Math.random() * 12) : Math.round(28 + Math.random() * 18);
  const travelMin = Math.round((roadKm / avgSpeed) * 60) + delay;

  // Traffic level 0–100
  const trafficPct = rush
    ? Math.round(55 + Math.random() * 35)
    : Math.round(15 + Math.random() * 40);

  // ETA
  const base = new Date(`${dateStr}T${timeStr || '00:00'}`);
  base.setMinutes(base.getMinutes() + travelMin);
  const eta  = base.toTimeString().slice(0,5);

  // CO2 (petrol car ~120g/km average London)
  const co2  = Math.round(110 + Math.random() * 30);

  // Route waypoints (road names)
  const roads = pickRoads(o, d);

  return { roadKm, travelMin, delay, avgSpeed, trafficPct, eta, co2, roads };
}

const ROAD_NAMES = [
  "A1 Rd", "A2 Rd", "A4 Rd", "A10 Rd", "A12 Rd", "A13 Rd", "A20 Rd",
  "A23 Rd", "A40 Rd", "A41 Rd", "Euston Rd", "City Rd", "Old St",
  "Commercial Rd", "Mile End Rd", "Victoria Embankment", "Embankment",
  "Borough High St", "London Bridge", "Upper Thames St", "Lower Thames St",
  "Blackfriars Rd", "Walworth Rd", "Streatham High Rd", "Brixton Rd",
  "Clapham High St", "Vauxhall Bridge Rd", "Grosvenor Rd", "Chelsea Bridge Rd",
  "King's Rd", "Cromwell Rd", "Kensington High St", "Bayswater Rd",
  "Edgware Rd", "Marylebone Rd", "Pentonville Rd", "Caledonian Rd",
  "Holloway Rd", "Seven Sisters Rd", "Tottenham High Rd", "Cambridge Heath Rd",
  "Bethnal Green Rd", "Bow Rd", "Stratford High St", "Romford Rd",
];

function pickRoads(o, d) {
  // Deterministic-ish: use coords to seed order
  const seed   = Math.abs(Math.round((o.lat + d.lon) * 1000)) % ROAD_NAMES.length;
  const count  = 3 + (seed % 3); // 3–5 roads
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(ROAD_NAMES[(seed + i * 7) % ROAD_NAMES.length]);
  }
  return picked;
}

// ═══════════════════════════════════════════════════
//  ROUTE DRAWING
// ═══════════════════════════════════════════════════
function drawRoute(pathPoints) {
  if (routePolyline) { routePolyline.remove(); routePolyline = null; }

  // Glow layer (thicker, more transparent)
  L.polyline(pathPoints, {
    color: 'rgba(59,130,246,0.25)',
    weight: 12,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(map);

  // Main line
  routePolyline = L.polyline(pathPoints, {
    color: '#3b82f6',
    weight: 4,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: null,
  }).addTo(map);

  map.fitBounds(routePolyline.getBounds(), { paddingTopLeft: [400, 60], paddingBottomRight: [40, 40] });
}

function removeRouteLayer() {
  if (routePolyline) {
    // Remove glow layer too (it's the layer just before routePolyline)
    map.eachLayer(l => {
      if (l instanceof L.Polyline) l.remove();
    });
    routePolyline = null;
  }
}

// ═══════════════════════════════════════════════════
//  RESULT DISPLAY
// ═══════════════════════════════════════════════════
function showResult(stats) {
  document.getElementById('r-time').textContent  = stats.travelMin;
  document.getElementById('r-dist').textContent  = stats.roadKm;
  document.getElementById('r-delay').textContent = stats.delay;
  document.getElementById('r-speed').textContent = stats.avgSpeed + ' km/h';
  document.getElementById('r-co2').textContent   = stats.co2;
  document.getElementById('r-eta').textContent   = stats.eta;

  // Traffic pointer
  const pct = Math.min(Math.max(stats.trafficPct, 0), 100);
  document.getElementById('tptr').style.left = pct + '%';
  document.getElementById('tlbl').textContent =
    pct < 30 ? 'Light' : pct < 60 ? 'Moderate' : 'Heavy';

  // Badge
  const badge = document.getElementById('r-badge');
  if (pct < 30) {
    badge.textContent = 'OPTIMAL'; badge.style.color = 'var(--emerald)';
  } else if (pct < 60) {
    badge.textContent = 'MODERATE'; badge.style.color = 'var(--amber)';
    badge.style.background = 'rgba(245,158,11,.1)';
    badge.style.borderColor = 'rgba(245,158,11,.25)';
  } else {
    badge.textContent = 'CONGESTED'; badge.style.color = 'var(--rose)';
    badge.style.background = 'rgba(244,63,94,.1)';
    badge.style.borderColor = 'rgba(244,63,94,.25)';
  }

  // Steps / road list
  const stepsEl = document.getElementById('steps');
  stepsEl.innerHTML = `
    <div class="step">
      <div class="sdot o"></div>
      <span>${oCoord.n}</span>
    </div>
    ${stats.roads.map(r => `
      <div class="step">
        <div class="sdot"></div>
        <span>via ${r}</span>
      </div>`).join('')}
    <div class="step">
      <div class="sdot d"></div>
      <span>${dCoord.n}</span>
    </div>
  `;

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

  btn.disabled     = on;
  icon.style.display = on ? 'none' : '';
  spin.style.display = on ? 'block' : 'none';
  txt.textContent  = on ? 'Calculating…' : 'Find Shortest Route';
}

// ═══════════════════════════════════════════════════
//  CLEAR
// ═══════════════════════════════════════════════════
function clearAll() {
  // Remove markers
  if (oMarker) { oMarker.remove(); oMarker = null; }
  if (dMarker) { dMarker.remove(); dMarker = null; }

  // Remove route polylines
  map.eachLayer(l => { if (l instanceof L.Polyline) l.remove(); });
  routePolyline = null;

  // Reset state
  oCoord = null;
  dCoord = null;

  // Clear inputs
  document.getElementById('inp-o').value = '';
  document.getElementById('inp-d').value = '';

  // Hide result + clear btn
  document.getElementById('res-sec').classList.remove('vis');
  document.getElementById('clr-btn').classList.remove('vis');

  // Re-center map
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
//  MAIN ROUTE FUNCTION (mock)
// ═══════════════════════════════════════════════════
async function findRoute() {
  // Resolve inputs if not already picked from suggestions
  if (!oCoord) oCoord = resolveInput('inp-o');
  if (!dCoord) dCoord = resolveInput('inp-d');

  if (!oCoord) { toast('Invalid starting location', 'err'); return; }
  if (!dCoord) { toast('Invalid destination',        'err'); return; }
  if (oCoord.n === dCoord.n) { toast('Origin and destination are the same', 'err'); return; }

  loading(true);
  removeRouteLayer();

  // Simulate async ML model call with a short delay
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

  try {
    const dateStr = document.getElementById('dt-date').value;
    const timeStr = document.getElementById('dt-time').value;

    const pathPoints = buildMockPath(oCoord, dCoord);
    const stats      = mockStats(oCoord, dCoord, dateStr, timeStr);

    // Ensure pins are on map
    placePin('o', oCoord.lat, oCoord.lon, oCoord.n);
    placePin('d', dCoord.lat, dCoord.lon, dCoord.n);

    drawRoute(pathPoints);
    showResult(stats);

    loading(false);
    toast('Route calculated ✓', 'ok');
    document.getElementById('clr-btn').classList.add('vis');

  } catch (err) {
    console.error(err);
    loading(false);
    toast('Routing failed — try again', 'err');
  }
}