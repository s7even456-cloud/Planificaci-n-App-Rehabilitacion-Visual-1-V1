/* =====================================================================
   Rehabilitación Visual — lógica de la aplicación
   ---------------------------------------------------------------------
   Marcado DIGITAL: el usuario marca cada estímulo con clic (PC) o toque
   (táctil). La app conoce la posición exacta de la marca, así que puntúa
   automáticamente acierto/fallo comparándola con la posición real del
   estímulo (con tolerancia ajustable). Tanto los estímulos como los
   gomets colocados permanecen fijos hasta el final de la prueba.

   Flujo:
     Configuración → Ejercicio → Resultado (dashboard editable)
                   → Guardado en localStorage → Historial
                   → Detalle (dashboard histórico de cualquier sesión)

   Diseño 100% responsivo: las posiciones se guardan en porcentajes y las
   distancias se calculan en píxeles reales en el momento de marcar.
   ===================================================================== */
(() => {
  "use strict";

  const STORAGE_KEY = "rehab_visual_sessions_v2";
  const GRID = 4;          // rejilla para mapa de fallos y refuerzo adaptativo
  const DBLTAP_MS = 450;   // ventana para doble clic / doble toque

  let session = null;      // sesión en curso
  let skipTimer = null;    // temporizador de los botones "No la veo"
  let lastSkipTap = 0;     // instante de la última pulsación (doble activación)
  let lastSkipEl = null;   // botón de la última pulsación (doble activación)

  // Anclas en el PERÍMETRO de la pantalla (esquinas y centros de los bordes),
  // para no solaparse con las cruces/círculos ni con los gomets del interior.
  const SKIP_ANCHORS = [
    { edge: "top",    left: "15%" }, { edge: "top",    left: "50%" }, { edge: "top",    left: "85%" },
    { edge: "bottom", left: "15%" }, { edge: "bottom", left: "50%" }, { edge: "bottom", left: "85%" },
    { edge: "left",   top: "35%"  }, { edge: "left",   top: "65%"  },
    { edge: "right",  top: "35%"  }, { edge: "right",  top: "65%"  },
  ];

  // =====================================================================
  //  Utilidades
  // =====================================================================
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  function loadSessions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveSessions(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  function cellIndex(xPct, yPct) {
    const cx = clamp(Math.floor((xPct / 100) * GRID), 0, GRID - 1);
    const cy = clamp(Math.floor((yPct / 100) * GRID), 0, GRID - 1);
    return cy * GRID + cx;
  }

  // Radio del estímulo en píxeles (el tamaño se define como % de min(vw,vh)).
  function stimRadiusPx(stimSizePct) {
    return (stimSizePct / 100) * Math.min(window.innerWidth, window.innerHeight) / 2;
  }

  // =====================================================================
  //  Audio (feedback inmediato de acierto / fallo)
  // =====================================================================
  let audioCtx = null;
  function tone(freq, durationMs, type = "sine", gainPeak = 0.18) {
    if (!session || !session.config.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      const t = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + durationMs / 1000);
    } catch { /* audio no disponible */ }
  }
  const sndOk = () => tone(660, 150, "sine", 0.18);
  const sndFail = () => tone(180, 240, "triangle", 0.20);

  // =====================================================================
  //  Generación de posiciones (sin solape, con refuerzo adaptativo)
  // =====================================================================
  function generatePositions(count, stimSizePct, adaptive) {
    const positions = [];
    const margin = stimSizePct;
    const minDist = stimSizePct * 1.6;
    const centerKeepout = 12 + stimSizePct;
    const weights = adaptive ? adaptiveWeights() : null;

    for (let i = 0; i < count; i++) {
      let placed = null;
      for (let attempt = 0; attempt < 400; attempt++) {
        let x, y;
        if (weights) {
          const cell = weightedPick(weights);
          const cx = cell % GRID, cy = Math.floor(cell / GRID);
          x = ((cx + Math.random()) / GRID) * 100;
          y = ((cy + Math.random()) / GRID) * 100;
        } else {
          x = Math.random() * 100; y = Math.random() * 100;
        }
        x = clamp(x, margin, 100 - margin);
        y = clamp(y, margin, 100 - margin);
        if (Math.hypot(x - 50, y - 50) < centerKeepout) continue;
        if (positions.some((p) => Math.hypot(p.x - x, p.y - y) < minDist)) continue;
        placed = { x, y }; break;
      }
      if (!placed) {
        placed = {
          x: clamp(Math.random() * 100, margin, 100 - margin),
          y: clamp(Math.random() * 100, margin, 100 - margin),
        };
      }
      positions.push(placed);
    }
    return positions;
  }

  function adaptiveWeights() {
    const sessions = loadSessions();
    const total = new Array(GRID * GRID).fill(0);
    const fails = new Array(GRID * GRID).fill(0);
    sessions.forEach((s) => (s.stimuli || []).forEach((st) => {
      const idx = cellIndex(st.x, st.y);
      total[idx]++; if (!st.hit) fails[idx]++;
    }));
    return total.map((t, i) => 1 + (t ? (fails[i] / t) * 3 : 0));
  }

  function weightedPick(weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
    return weights.length - 1;
  }

  // =====================================================================
  //  Detección de modo (PC vs táctil)
  // =====================================================================
  function resolveMode(cfgMode) {
    if (cfgMode === "pc" || cfgMode === "touch") return cfgMode;
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    return (coarse || hasTouch) ? "touch" : "pc";
  }

  // =====================================================================
  //  Ejercicio
  // =====================================================================
  let camStream = null;

  function startSession(config) {
    const mode = resolveMode(config.mode);
    const positions = generatePositions(config.count, config.stimSize, config.adaptive);
    session = {
      startedAt: Date.now(),
      config, mode,
      stimuli: positions.map((p) => ({
        x: p.x, y: p.y,
        markX: null, markY: null,   // posición de la marca (%)
        dist: null, dx: null, dy: null, // error en radios del estímulo
        rt: null,                   // tiempo de respuesta (ms)
        hit: false, skipped: false,
        shownAt: null,
      })),
      current: 0,
    };

    applyColors(config);
    showScreen("#screen-exercise");
    if (config.camera) enableCamera();

    const ring = $("#cursor-ring");
    if (mode === "pc") {
      ring.classList.remove("hidden");
      ring.style.width = `min(${config.stimSize}vw, ${config.stimSize}vh)`;
      ring.style.height = `min(${config.stimSize}vw, ${config.stimSize}vh)`;
      $("#hud-hint").innerHTML = 'Marca con un clic donde percibas el estímulo · <kbd>Esc</kbd> salir';
    } else {
      ring.classList.add("hidden");
      $("#hud-hint").innerHTML = 'Toca donde percibas el estímulo · <kbd>Esc</kbd> salir';
    }

    renderFixation();
    showStimulus(0);

    const stage = $("#stage");
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onExerciseKey);
  }

  function applyColors(c) {
    const r = document.documentElement.style;
    r.setProperty("--fix-color", c.colorCenter);
    r.setProperty("--stim-color", c.colorStim);
    r.setProperty("--gomet-color", c.colorGomet);
    r.setProperty("--cursor-color", c.colorCursor);
  }

  function renderFixation() {
    const stage = $("#stage");
    // conservar el cursor-ring; eliminar el resto
    stage.querySelectorAll(".fixation, .stimulus, .gomet").forEach((e) => e.remove());
    const fix = document.createElement("div");
    fix.className = "fixation " + session.config.centerShape;
    const s = session.config.centerSize;
    fix.style.width = `min(${s}vw, ${s}vh)`;
    fix.style.height = `min(${s}vw, ${s}vh)`;
    stage.appendChild(fix);
  }

  function showStimulus(index) {
    const st = session.stimuli[index];
    st.shownAt = performance.now();

    const el = document.createElement("div");
    el.className = "stimulus " + session.config.stimShape;
    el.dataset.idx = index;
    el.style.left = st.x + "%";
    el.style.top = st.y + "%";
    const size = session.config.stimSize;
    if (session.config.stimShape === "x") {
      el.style.fontSize = `min(${size * 1.6}vw, ${size * 1.6}vh)`;
      el.textContent = "✕";
    } else {
      el.style.width = `min(${size}vw, ${size}vh)`;
      el.style.height = `min(${size}vw, ${size}vh)`;
    }
    $("#stage").appendChild(el);

    $("#hud-progress").textContent = `${index + 1} / ${session.stimuli.length}`;
    armSkipButtons();
  }

  function onPointerMove(e) {
    if (session.mode !== "pc") return;
    const ring = $("#cursor-ring");
    ring.style.left = e.clientX + "px";
    ring.style.top = e.clientY + "px";
  }

  function onPointerDown(e) {
    // Ignorar si se pulsa el botón "No la veo" (tiene su propio manejador).
    if (e.target.closest(".skip-btn")) return;
    e.preventDefault();
    placeMark(e.clientX, e.clientY);
  }

  // Coloca un gomet en (clientX, clientY), puntúa y avanza.
  function placeMark(clientX, clientY) {
    const idx = session.current;
    const st = session.stimuli[idx];
    const stage = $("#stage");
    const rect = stage.getBoundingClientRect();

    const markXpct = ((clientX - rect.left) / rect.width) * 100;
    const markYpct = ((clientY - rect.top) / rect.height) * 100;

    // Distancia real en píxeles → normalizada en radios del estímulo.
    const stimPx = { x: (st.x / 100) * rect.width, y: (st.y / 100) * rect.height };
    const markPx = { x: clientX - rect.left, y: clientY - rect.top };
    const radius = stimRadiusPx(session.config.stimSize);
    const dxPx = markPx.x - stimPx.x, dyPx = markPx.y - stimPx.y;
    const distPx = Math.hypot(dxPx, dyPx);

    st.markX = markXpct; st.markY = markYpct;
    st.dist = distPx / radius;
    st.dx = dxPx / radius; st.dy = dyPx / radius;
    st.rt = Math.round(performance.now() - st.shownAt);
    st.skipped = false;
    st.hit = st.dist <= session.config.tolerance;

    drawGomet(markXpct, markYpct);
    st.hit ? sndOk() : sndFail();
    advance();
  }

  function drawGomet(xPct, yPct) {
    const stage = $("#stage");
    const g = document.createElement("div");
    g.className = "gomet";
    g.style.left = xPct + "%";
    g.style.top = yPct + "%";
    const s = session.config.stimSize;
    g.style.width = `min(${s}vw, ${s}vh)`;
    g.style.height = `min(${s}vw, ${s}vh)`;
    stage.appendChild(g);
  }

  function advance() {
    clearSkipTimer();
    hideSkipButtons();
    session.current++;
    if (session.current >= session.stimuli.length) endExercise();
    else showStimulus(session.current);
  }

  function onExerciseKey(e) {
    if (e.code === "Escape") {
      e.preventDefault();
      if (confirm("¿Salir del ejercicio? Se perderá la sesión actual.")) {
        cleanupExercise();
        showScreen("#screen-config");
      }
    }
  }

  // ---- Botones "No la veo" (aparecen tras un tiempo, varios en el perímetro, doble pulsación) ----
  function armSkipButtons() {
    clearSkipTimer();
    hideSkipButtons();
    const delay = session.config.skipDelay * 1000;
    skipTimer = setTimeout(showSkipButtons, delay);
  }
  function clearSkipTimer() { if (skipTimer) { clearTimeout(skipTimer); skipTimer = null; } }

  function showSkipButtons() {
    const layer = $("#skip-layer");
    layer.innerHTML = "";
    const inset = "10px";
    SKIP_ANCHORS.forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "skip-btn";
      btn.innerHTML = 'No la veo<small>doble clic</small>';
      // Pegar el botón al borde correspondiente, centrado en el eje libre.
      if (a.edge === "top")    { btn.style.top = inset;  btn.style.left = a.left; btn.style.transform = "translateX(-50%)"; }
      if (a.edge === "bottom") { btn.style.bottom = inset; btn.style.left = a.left; btn.style.transform = "translateX(-50%)"; }
      if (a.edge === "left")   { btn.style.left = inset; btn.style.top = a.top;  btn.style.transform = "translateY(-50%)"; }
      if (a.edge === "right")  { btn.style.right = inset; btn.style.top = a.top;  btn.style.transform = "translateY(-50%)"; }
      btn.addEventListener("pointerup", onSkipActivate);
      layer.appendChild(btn);
    });
    layer.classList.remove("hidden");
    lastSkipTap = 0; lastSkipEl = null;
  }

  function hideSkipButtons() {
    const layer = $("#skip-layer");
    layer.classList.add("hidden");
    layer.innerHTML = "";
  }

  function onSkipActivate(e) {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    // Doble clic / doble toque sobre el MISMO botón para evitar pulsaciones por error.
    if (e.currentTarget === lastSkipEl && now - lastSkipTap < DBLTAP_MS) {
      lastSkipTap = 0; lastSkipEl = null;
      registerSkip();
    } else {
      lastSkipTap = now; lastSkipEl = e.currentTarget;
    }
  }

  function registerSkip() {
    const st = session.stimuli[session.current];
    st.skipped = true; st.hit = false;
    st.markX = null; st.markY = null;
    st.rt = Math.round(performance.now() - st.shownAt);
    sndFail();
    advance();
  }

  function endExercise() {
    cleanupExercise();
    pendingRecord = buildRecord(session);
    renderDashboard($("#result-dashboard"), pendingRecord, true);
    showScreen("#screen-result");
  }

  function cleanupExercise() {
    const stage = $("#stage");
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onExerciseKey);
    clearSkipTimer(); hideSkipButtons();
    disableCamera();
    stage.querySelectorAll(".fixation, .stimulus, .gomet").forEach((e) => e.remove());
    $("#cursor-ring").classList.add("hidden");
  }

  // ---- Cámara (vista previa; análisis IA = mejora futura) ----
  async function enableCamera() {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const v = $("#cam-preview"); v.srcObject = camStream; v.classList.remove("hidden");
    } catch { console.warn("No se pudo acceder a la cámara."); }
  }
  function disableCamera() {
    if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
    const v = $("#cam-preview"); v.classList.add("hidden"); v.srcObject = null;
  }

  // =====================================================================
  //  Construcción del registro y agregados
  // =====================================================================
  function buildRecord(s) {
    return {
      id: s.startedAt,
      date: new Date(s.startedAt).toISOString(),
      mode: s.mode,
      config: s.config,
      stimuli: s.stimuli.map((st) => ({
        x: st.x, y: st.y, markX: st.markX, markY: st.markY,
        dist: st.dist, dx: st.dx, dy: st.dy, rt: st.rt,
        hit: st.hit, skipped: st.skipped,
      })),
    };
  }

  function aggregate(stimuli) {
    const total = stimuli.length;
    const hits = stimuli.filter((s) => s.hit).length;
    const skipped = stimuli.filter((s) => s.skipped).length;
    const answered = stimuli.filter((s) => !s.skipped && s.dist != null);
    const meanErr = answered.length
      ? answered.reduce((a, s) => a + s.dist, 0) / answered.length : null;
    const biasX = answered.length
      ? answered.reduce((a, s) => a + s.dx, 0) / answered.length : 0;
    const biasY = answered.length
      ? answered.reduce((a, s) => a + s.dy, 0) / answered.length : 0;
    const meanRt = answered.length
      ? Math.round(answered.reduce((a, s) => a + (s.rt || 0), 0) / answered.length) : null;
    return {
      total, hits, skipped,
      accuracy: total ? hits / total : 0,
      meanErr, biasX, biasY, meanRt,
    };
  }

  const pct = (v) => Math.round(v * 100) + "%";

  // =====================================================================
  //  Dashboard (resultado actual y detalle histórico)
  // =====================================================================
  function renderDashboard(container, record, editable) {
    const c = record.config;
    container.style.setProperty("--fix-color", c.colorCenter);
    container.style.setProperty("--stim-color", c.colorStim);
    container.style.setProperty("--gomet-color", c.colorGomet);

    const a = aggregate(record.stimuli);

    // --- Tarjetas de estadísticas ---
    const biasTxt = describeBias(a.biasX, a.biasY);
    const stats = `
      <div class="dash-stats">
        <div class="stat-card"><div class="num">${pct(a.accuracy)}</div><div class="lbl">Precisión</div></div>
        <div class="stat-card"><div class="num">${a.hits}/${a.total}</div><div class="lbl">Aciertos</div></div>
        <div class="stat-card"><div class="num">${a.skipped}</div><div class="lbl">No vistos</div></div>
        <div class="stat-card"><div class="num">${a.meanErr != null ? a.meanErr.toFixed(2) + "×" : "—"}</div><div class="lbl">Error medio (radios)</div></div>
        <div class="stat-card"><div class="num">${a.meanRt != null ? (a.meanRt/1000).toFixed(1) + "s" : "—"}</div><div class="lbl">Tiempo medio</div></div>
        <div class="stat-card"><div class="num" style="font-size:1rem">${biasTxt}</div><div class="lbl">Sesgo del error</div></div>
      </div>`;

    // --- Mapa: estímulos, gomets y líneas de error ---
    const lines = record.stimuli.map((s) => {
      if (s.skipped || s.markX == null) return "";
      const cls = s.hit ? "ok" : "fail";
      return `<line class="map-line ${cls}" x1="${s.x}" y1="${s.y}" x2="${s.markX}" y2="${s.markY}" />`;
    }).join("");

    const stimMarks = record.stimuli.map((s, i) => {
      const shape = c.stimShape;
      if (shape === "x") {
        return `<div class="map-stim x" style="left:${s.x}%;top:${s.y}%">✕</div>`;
      }
      return `<div class="map-stim circle" style="left:${s.x}%;top:${s.y}%"></div>`;
    }).join("");

    const gometMarks = record.stimuli.map((s, i) => {
      if (s.skipped || s.markX == null) return "";
      return `<div class="map-gomet" data-idx="${i}" style="left:${s.markX}%;top:${s.markY}%" title="${s.hit ? "Acierto" : "Fallo"} · toca para corregir">${i + 1}</div>`;
    }).join("");

    const map = `
      <div class="dash-map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>
        <div class="map-center ${c.centerShape}"></div>
        ${stimMarks}${gometMarks}
      </div>
      <div class="legend">
        <span><span class="swatch" style="background:${c.colorStim}"></span>Estímulo</span>
        <span><span class="swatch" style="background:${c.colorGomet}"></span>Tu marca</span>
        <span><span class="swatch" style="background:var(--ok)"></span>Acierto</span>
        <span><span class="swatch" style="background:var(--fail)"></span>Fallo</span>
        ${editable ? '<span style="margin-left:auto">Toca una marca para alternar acierto/fallo</span>' : ""}
      </div>`;

    container.innerHTML = stats + map;

    if (editable) {
      container.querySelectorAll(".map-gomet").forEach((el) => {
        el.addEventListener("click", () => {
          const i = +el.dataset.idx;
          const st = record.stimuli[i];
          st.hit = !st.hit;
          st.hit ? sndOk() : sndFail();
          renderDashboard(container, record, true); // re-render con stats actualizadas
        });
      });
    }
  }

  function describeBias(bx, by) {
    const mag = Math.hypot(bx, by);
    if (mag < 0.3) return "centrado";
    const h = bx > 0.2 ? "derecha" : bx < -0.2 ? "izquierda" : "";
    const v = by > 0.2 ? "abajo" : by < -0.2 ? "arriba" : "";
    return [v, h].filter(Boolean).join("-") || "centrado";
  }

  // =====================================================================
  //  Guardar / Historial / Detalle
  // =====================================================================
  let pendingRecord = null;

  function saveCurrentSession() {
    if (!pendingRecord) return;
    const list = loadSessions();
    list.push(pendingRecord);
    saveSessions(list);
    pendingRecord = null;
    session = null;
    renderHistory();
    showScreen("#screen-history");
  }

  function renderHistory() {
    const list = loadSessions();
    const summary = $("#history-summary");
    const listEl = $("#history-list");

    if (!list.length) {
      summary.innerHTML = '<p class="empty">Aún no hay sesiones guardadas.</p>';
      listEl.innerHTML = "";
      drawChart([]); renderHeatmap([]);
      return;
    }

    const aggs = list.map((s) => aggregate(s.stimuli));
    const n = list.length;
    const avgAcc = aggs.reduce((a, g) => a + g.accuracy, 0) / n;
    const last = aggs[n - 1];
    const best = aggs.reduce((m, g) => Math.max(m, g.accuracy), 0);

    summary.innerHTML = `
      <div class="stat-card"><div class="num">${n}</div><div class="lbl">Sesiones</div></div>
      <div class="stat-card"><div class="num">${pct(avgAcc)}</div><div class="lbl">Precisión media</div></div>
      <div class="stat-card"><div class="num">${pct(last.accuracy)}</div><div class="lbl">Última sesión</div></div>
      <div class="stat-card"><div class="num">${pct(best)}</div><div class="lbl">Mejor sesión</div></div>`;

    listEl.innerHTML = list.slice().reverse().map((s) => {
      const g = aggregate(s.stimuli);
      const d = new Date(s.date);
      const col = g.accuracy >= 0.8 ? "var(--ok)" : g.accuracy >= 0.5 ? "var(--ink)" : "var(--fail)";
      return `<div class="history-row" data-id="${s.id}">
        <span>${d.toLocaleDateString()} · ${d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
        <span>${g.hits}/${g.total} aciertos</span>
        <span class="pct" style="color:${col}">${pct(g.accuracy)}</span>
        <span class="go">Ver dashboard ▸</span>
      </div>`;
    }).join("");

    listEl.querySelectorAll(".history-row").forEach((row) => {
      row.addEventListener("click", () => openSessionDetail(+row.dataset.id));
    });

    drawChart(aggs.map((g) => g.accuracy));
    renderHeatmap(list);
  }

  function openSessionDetail(id) {
    const rec = loadSessions().find((s) => s.id === id);
    if (!rec) return;
    const d = new Date(rec.date);
    $("#detail-title").textContent = "Dashboard · " + d.toLocaleDateString() + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("#detail-subtitle").textContent =
      `Modo ${rec.mode === "touch" ? "táctil" : "PC"} · ${rec.stimuli.length} estímulos · ` +
      `forma central: ${rec.config.centerShape === "cross" ? "cruz" : "punto"} · ` +
      `estímulo: ${rec.config.stimShape === "x" ? "equis" : "círculo"}.`;
    renderDashboard($("#detail-dashboard"), rec, false);
    showScreen("#screen-detail");
  }

  // Gráfico de líneas de la precisión por sesión.
  function drawChart(values) {
    const cv = $("#evolution-chart");
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 36;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#d9d5cb"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, 10); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 10, H - pad); ctx.stroke();
    ctx.fillStyle = "#9a958a"; ctx.font = "12px system-ui";
    [0, 50, 100].forEach((p) => {
      const y = (H - pad) - (p / 100) * (H - pad - 10);
      ctx.fillText(p + "%", 6, y + 4);
      ctx.strokeStyle = "#efeee9"; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 10, y); ctx.stroke();
    });
    if (!values.length) return;
    const stepX = values.length > 1 ? (W - pad - 20) / (values.length - 1) : 0;
    const toXY = (i, v) => [pad + i * stepX, (H - pad) - v * (H - pad - 10)];
    ctx.strokeStyle = "#2f6f5e"; ctx.lineWidth = 2.5; ctx.beginPath();
    values.forEach((v, i) => { const [x, y] = toXY(i, v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = "#2f6f5e";
    values.forEach((v, i) => { const [x, y] = toXY(i, v); ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); });
  }

  function renderHeatmap(sessions) {
    const wrap = $("#error-heatmap");
    wrap.style.gridTemplateColumns = `repeat(${GRID}, 1fr)`;
    wrap.style.gridTemplateRows = `repeat(${GRID}, 1fr)`;
    const total = new Array(GRID * GRID).fill(0);
    const fails = new Array(GRID * GRID).fill(0);
    sessions.forEach((s) => (s.stimuli || []).forEach((st) => {
      const idx = cellIndex(st.x, st.y);
      total[idx]++; if (!st.hit) fails[idx]++;
    }));
    const maxFail = Math.max(1, ...fails);
    wrap.innerHTML = "";
    for (let i = 0; i < GRID * GRID; i++) {
      const cell = document.createElement("div");
      cell.className = "heat-cell";
      const intensity = fails[i] / maxFail;
      cell.style.background = `rgba(192, 57, 43, ${0.08 + intensity * 0.72})`;
      cell.title = total[i] ? `${fails[i]} fallos / ${total[i]} estímulos` : "Sin datos";
      wrap.appendChild(cell);
    }
  }

  // =====================================================================
  //  Configuración
  // =====================================================================
  function readConfig() {
    return {
      count: parseInt($("#cfg-count").value, 10),
      stimShape: $("#cfg-stim-shape").value,
      stimSize: parseFloat($("#cfg-stim-size").value),
      centerShape: $("#cfg-center-shape").value,
      centerSize: parseFloat($("#cfg-center-size").value),
      colorCenter: $("#cfg-color-center").value,
      colorStim: $("#cfg-color-stim").value,
      colorGomet: $("#cfg-color-gomet").value,
      colorCursor: $("#cfg-color-cursor").value,
      mode: $("#cfg-mode").value,
      tolerance: parseFloat($("#cfg-tolerance").value),
      skipDelay: parseInt($("#cfg-skip-delay").value, 10),
      sound: $("#cfg-sound").checked,
      adaptive: $("#cfg-adaptive").checked,
      camera: $("#cfg-camera").checked,
    };
  }

  function toleranceLabel(v) {
    if (v <= 0.8) return "Alta";
    if (v <= 1.4) return "Normal";
    if (v <= 2.0) return "Baja";
    return "Muy baja";
  }

  // =====================================================================
  //  Eventos de interfaz
  // =====================================================================
  function bindUI() {
    const sync = (sel, out, fmt = (v) => v) => {
      const input = $(sel), o = $(out);
      const upd = () => (o.textContent = fmt(input.value));
      input.addEventListener("input", upd); upd();
    };
    sync("#cfg-count", "#out-count");
    sync("#cfg-stim-size", "#out-stim-size", (v) => parseFloat(v).toFixed(1));
    sync("#cfg-center-size", "#out-center-size", (v) => parseFloat(v).toFixed(1));
    sync("#cfg-tolerance", "#out-tolerance", toleranceLabel);
    sync("#cfg-skip-delay", "#out-skip-delay");

    $("#config-form").addEventListener("submit", (e) => {
      e.preventDefault();
      startSession(readConfig());
    });

    $("#btn-history").addEventListener("click", () => { renderHistory(); showScreen("#screen-history"); });
    $("#btn-back-config").addEventListener("click", () => showScreen("#screen-config"));
    $("#btn-detail-back").addEventListener("click", () => { renderHistory(); showScreen("#screen-history"); });

    // Resultado: el dashboard se construye sobre pendingRecord (editable).
    $("#btn-save-session").addEventListener("click", saveCurrentSession);
    $("#btn-discard").addEventListener("click", () => {
      if (confirm("¿Descartar esta sesión sin guardarla?")) {
        pendingRecord = null; session = null; showScreen("#screen-config");
      }
    });

    $("#btn-clear").addEventListener("click", () => {
      if (confirm("¿Borrar todo el historial de sesiones?")) { saveSessions([]); renderHistory(); }
    });
    $("#btn-export").addEventListener("click", exportData);
    // Los botones "No la veo" se crean dinámicamente; su manejador se asigna al crearlos.
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(loadSessions(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rehabilitacion-visual-historial.json"; a.click();
    URL.revokeObjectURL(url);
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindUI();
    showScreen("#screen-config");
  });
})();
