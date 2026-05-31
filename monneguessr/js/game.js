const state = {
  apiKey: null,
  playerMode: 'solo',
  gameMode: 'normal',
  mapMode: 'world',
  timerSeconds: 120,
  sfxEnabled: true,
  uiSize: 'normal',
  round: 1,
  totalRounds: 5,
  players: [],
  currentLocation: null,
  usedIndexes: [],
  guessMarkers: [],
  timerInterval: null,
  timeLeft: 120,
  viewer: null,
  resultMap: null,
  guessMap: null,
  guessLatLng: null,
  startImageId: null,
};

// ── SETUP ──
document.querySelectorAll('#player-mode .mode-btn').forEach(btn => {
  btn.onclick = () => { selectMode('player-mode', btn); state.playerMode = btn.dataset.val; };
});
document.querySelectorAll('#game-mode .mode-btn').forEach(btn => {
  btn.onclick = () => { selectMode('game-mode', btn); state.gameMode = btn.dataset.val; };
});
document.querySelectorAll('#map-mode .mode-btn').forEach(btn => {
  btn.onclick = () => { selectMode('map-mode', btn); state.mapMode = btn.dataset.val; };
});

const timerRange = document.getElementById('timer-range');
const timerDisplay = document.getElementById('timer-display');
timerRange.oninput = () => { timerDisplay.textContent = timerRange.value + 's'; state.timerSeconds = parseInt(timerRange.value); };

function selectMode(groupId, btn) {
  document.querySelectorAll('#' + groupId + ' .mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

document.getElementById('start-btn').onclick = () => {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) { alert('Indtast din Mapillary API-nøgle for at spille!'); return; }
  state.apiKey = key;
  initPlayers();
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  startGame();
};

function initPlayers() {
  if (state.playerMode === 'solo') {
    state.players = [{ name: 'Du', score: 0, health: 100, flag: 'dk' }];
    document.getElementById('p2-hud').style.display = 'none';
    document.getElementById('p1-name').textContent = 'Du';
  } else if (state.playerMode === '1v1') {
    state.players = [
      { name: 'Spiller 1', score: 0, health: 100, flag: 'dk' },
      { name: 'Spiller 2', score: 0, health: 100, flag: 'es' },
    ];
    document.getElementById('p2-hud').style.display = 'flex';
  } else {
    state.players = [
      { name: 'Hold 1', score: 0, health: 100, flag: 'dk' },
      { name: 'Hold 2', score: 0, health: 100, flag: 'es' },
    ];
    document.getElementById('p2-hud').style.display = 'flex';
  }
  document.getElementById('tot-round').textContent = state.totalRounds;
}

// ── GAME ──
function startGame() {
  state.round = 1;
  state.usedIndexes = [];
  state.players.forEach(p => { p.score = 0; p.health = 100; });
  loadRound();
}

function loadRound() {
  document.getElementById('cur-round').textContent = state.round;
  state.guessLatLng = null;
  document.getElementById('guess-btn').disabled = true;

  const locations = LOCATIONS[state.mapMode];
  let idx;
  do { idx = Math.floor(Math.random() * locations.length); }
  while (state.usedIndexes.includes(idx) && state.usedIndexes.length < locations.length);
  state.usedIndexes.push(idx);
  state.currentLocation = locations[idx];
  state.startImageId = state.currentLocation.id;

  initViewer();
  initGuessMap();
  startTimer();
  updateHealthBars();
}

function initViewer() {
  const container = document.getElementById('mly-container');
  container.innerHTML = '';

  if (state.viewer) {
    try { state.viewer.remove(); } catch(e) {}
    state.viewer = null;
  }

  try {
    const { Viewer } = mapillary;
    state.viewer = new Viewer({
      accessToken: state.apiKey,
      container: 'mly-container',
      imageId: state.currentLocation.id,
      component: {
        cover: false,
        direction: state.gameMode !== 'nomove' && state.gameMode !== 'nmpz',
        sequence: state.gameMode === 'normal',
        zoom: state.gameMode !== 'nmpz',
      },
    });
  } catch(e) {
    container.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#888;">
      <div style="font-size:48px;">🌍</div>
      <div style="font-size:15px;">Kunne ikke hente billede</div>
      <div style="font-size:13px;color:#555;">Tjek din Mapillary API-nøgle</div>
    </div>`;
  }
}

function initGuessMap() {
  if (state.guessMap) {
    state.guessMap.remove();
    state.guessMap = null;
  }

  const bounds = getMapBounds();
  state.guessMap = L.map('leaflet-map', {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: true,
  }).setView(bounds.center, bounds.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
  }).addTo(state.guessMap);

  state.guessMap.on('click', onMapClick);

  const mapContainer = document.getElementById('map-container');
  mapContainer.addEventListener('mouseenter', () => {
    mapContainer.classList.add('map-large');
    setTimeout(() => state.guessMap && state.guessMap.invalidateSize(), 280);
  });
  mapContainer.addEventListener('mouseleave', () => {
    mapContainer.classList.remove('map-large');
    setTimeout(() => state.guessMap && state.guessMap.invalidateSize(), 280);
  });
}

function getMapBounds() {
  const modes = {
    world:   { center: [20, 0],      zoom: 1 },
    europe:  { center: [54, 15],     zoom: 3 },
    denmark: { center: [56.2, 10.5], zoom: 6 },
  };
  return modes[state.mapMode] || modes.world;
}

let guessMarker = null;
function onMapClick(e) {
  state.guessLatLng = e.latlng;
  if (guessMarker) state.guessMap.removeLayer(guessMarker);
  guessMarker = L.circleMarker(e.latlng, {
    radius: 8, fillColor: '#4f8ef7', color: '#fff',
    weight: 2, opacity: 1, fillOpacity: 1,
  }).addTo(state.guessMap);
  document.getElementById('guess-btn').disabled = false;
  if (state.sfxEnabled) playSound('guess');
}

document.getElementById('guess-btn').onclick = submitGuess;

function submitGuess() {
  clearInterval(state.timerInterval);
  if (!state.guessLatLng) {
    state.guessLatLng = { lat: 0, lng: 0 };
  }
  showResult();
}

function startTimer() {
  state.timeLeft = state.timerSeconds;
  const bar = document.getElementById('timer-bar');
  const text = document.getElementById('timer-text');
  bar.style.width = '100%';
  bar.style.background = '#7ed444';
  text.textContent = state.timeLeft;

  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    const pct = (state.timeLeft / state.timerSeconds) * 100;
    bar.style.width = pct + '%';
    text.textContent = state.timeLeft;
    if (pct < 30) bar.style.background = '#f74f4f';
    else if (pct < 60) bar.style.background = '#f7a54f';
    if (state.timeLeft <= 0) { clearInterval(state.timerInterval); submitGuess(); }
  }, 1000);
}

// ── RESULT ──
function showResult() {
  const loc = state.currentLocation;
  const guess = state.guessLatLng;
  const dist = Math.round(haversine(guess.lat, guess.lng, loc.lat, loc.lng));
  const score = Math.max(0, Math.round(5000 * Math.exp(-dist / 2000)));

  state.players[0].score += score;
  const dmg = Math.round(Math.max(0, 100 - score / 50));
  state.players[0].health = Math.max(0, state.players[0].health - dmg);

  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');

  setTimeout(() => initResultMap(loc, guess, dist, score), 100);

  const scoresHtml = state.players.map((p, i) => `
    <div class="result-player">
      <div class="pts">${i === 0 ? score.toLocaleString('da-DK') : '—'}</div>
      <div class="name">${p.name}</div>
      <div class="dist">${i === 0 ? dist.toLocaleString('da-DK') + ' km fra målet' : ''}</div>
    </div>
  `).join('');
  document.getElementById('result-scores').innerHTML = scoresHtml;

  const btn = document.getElementById('next-round-btn');
  btn.textContent = state.round >= state.totalRounds ? 'Se slutresultat' : 'Næste runde →';
}

function initResultMap(loc, guess, dist, score) {
  if (state.resultMap) { state.resultMap.remove(); state.resultMap = null; }

  state.resultMap = L.map('result-map', {
    zoomControl: true, attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(state.resultMap);

  const correctIcon = L.divIcon({ className: '', html: '<div style="width:14px;height:14px;background:#7ed444;border:2px solid #fff;border-radius:50%;"></div>', iconSize: [14,14], iconAnchor: [7,7] });
  const guessIcon = L.divIcon({ className: '', html: '<div style="width:14px;height:14px;background:#4f8ef7;border:2px solid #fff;border-radius:50%;"></div>', iconSize: [14,14], iconAnchor: [7,7] });

  L.marker([loc.lat, loc.lng], { icon: correctIcon }).bindPopup(`<b>${loc.name}</b>`).addTo(state.resultMap).openPopup();
  if (guess.lat !== 0 || guess.lng !== 0) {
    L.marker([guess.lat, guess.lng], { icon: guessIcon }).bindPopup('Dit gæt').addTo(state.resultMap);
    L.polyline([[loc.lat, loc.lng], [guess.lat, guess.lng]], { color: '#4f8ef7', weight: 2, dashArray: '6,4' }).addTo(state.resultMap);
    const bounds = L.latLngBounds([[loc.lat, loc.lng], [guess.lat, guess.lng]]).pad(0.3);
    state.resultMap.fitBounds(bounds);
  } else {
    state.resultMap.setView([loc.lat, loc.lng], 5);
  }
}

document.getElementById('next-round-btn').onclick = () => {
  if (state.round >= state.totalRounds) {
    showFinal();
  } else {
    state.round++;
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    loadRound();
  }
};

// ── FINAL ──
function showFinal() {
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('final-screen').classList.remove('hidden');
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  document.getElementById('final-scores').innerHTML = sorted.map((p, i) => `
    <div class="final-row">
      <span class="fname">${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}${p.name}</span>
      <span class="fpts">${p.score.toLocaleString('da-DK')} pt</span>
    </div>
  `).join('');
}

document.getElementById('play-again-btn').onclick = () => {
  document.getElementById('final-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  startGame();
};

// ── HEALTH BARS ──
function updateHealthBars() {
  state.players.forEach((p, i) => {
    const el = document.getElementById('p' + (i+1) + '-health');
    if (el) el.style.width = p.health + '%';
  });
}

// ── SETTINGS ──
document.getElementById('settings-btn').onclick = () => {
  document.getElementById('settings-panel').classList.toggle('hidden');
};
document.getElementById('close-settings').onclick = () => {
  document.getElementById('settings-panel').classList.add('hidden');
};
document.getElementById('sfx-toggle').onchange = (e) => {
  state.sfxEnabled = e.target.checked;
};

function setUISize(size) {
  state.uiSize = size;
  document.body.classList.remove('ui-small', 'ui-normal', 'ui-large');
  document.body.classList.add('ui-' + size);
  document.querySelectorAll('.settings-inner .mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.size === size);
  });
}

// ── RESPAWN ──
document.getElementById('respawn-btn').onclick = () => {
  if (state.viewer && state.startImageId) {
    try { state.viewer.moveTo(state.startImageId); } catch(e) {}
  }
};

// ── UTILS ──
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function playSound(type) {
  if (!state.sfxEnabled) return;
}

document.body.classList.add('ui-normal');
