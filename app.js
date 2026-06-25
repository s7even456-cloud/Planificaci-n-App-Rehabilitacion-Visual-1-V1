/* =====================================================================
   Rehabilitación Visual — lógica de la aplicación
   ---------------------------------------------------------------------
   Flujo:
     Configuración → Ejercicio (estímulo a estímulo, Espacio avanza)
                   → Revisión (marcar acierto/fallo)
                   → Guardado en localStorage → Historial / evolución
   Diseño 100% responsivo: las posiciones se guardan en porcentajes
   (0–100) y se proyectan sobre el tamaño real de la pantalla en cada
   momento, de modo que el ejercicio se adapta a cualquier resolución.
   ===================================================================== */
(() => {
  "use strict";

  const STORAGE_KEY = "rehab_visual_sessions_v1";
  const GRID = 4; // rejilla GRID x GRID para mapa de fallos y refuerzo adaptativo

  // ---- Estado de la sesión en curso ----
  let session = null;

  // =====================================================================
  //  Utilidades
  // =====================================================================
  const $ = (sel) => document.querySelector(sel);

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  function loadSessions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveSessions(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // Índice de celda de la rejilla (0 .. GRID*GRID-1) para una posición %.
  function cellIndex(xPct, yPct) {
    const cx = Math.min(GRID - 1, Math.floor((xPct / 100) * GRID));
    const cy = Math.min(GRID - 1, Math.floor((yPct / 100) * GRID));
    return cy * GRID + cx;
  }

  // =====================================================================
  //  Audio (Web Audio API) — feedback suave de acierto / fallo / avance
  // =====================================================================
  let audioCtx = null;
  function tone(freq, durationMs, type = "sine", gainPeak = 0.18) {
    if (!session || !session.config.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + durationMs / 1000);
    } catch { /* audio no disponible */ }
  }
  const sndAdvance = () => tone(440, 90, "sine", 0.12);
  const sndOk = () => tone(660, 160, "sine", 0.18);
  const sndFail = () => tone(180, 240, "triangle", 0.20);

  // =====================================================================
  //  Generación de posiciones (sin solape, con refuerzo adaptativo)
  // =====================================================================
  // Devuelve un array de {x, y} en porcentaje (centro del estímulo).
  function generatePositions(count, stimSizePct, adaptive) {
    const positions = [];
    const margin = stimSizePct;                 // margen al borde
    const minDist = stimSizePct * 1.6;          // separación mínima entre centros
    const centerKeepout = 12 + stimSizePct;     // no invadir la figura central

    // Pesos por celda según fallos históricos (refuerzo adaptativo).
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
          x = Math.random() * 100;
          y = Math.random() * 100;
        }
        // Mantener dentro de márgenes
        x = Math.max(margin, Math.min(100 - margin, x));
        y = Math.max(margin, Math.min(100 - margin, y));

        // Lejos del centro de fijación
        const dC = Math.hypot(x - 50, y - 50);
        if (dC < centerKeepout) continue;

        // Sin solaparse con estímulos previos
        const collide = positions.some((p) => Math.hypot(p.x - x, p.y - y) < minDist);
        if (collide) continue;

        placed = { x, y };
        break;
      }
      // Si no se encontró hueco respetando todas las reglas, relajar el solape.
      if (!placed) {
        const x = Math.max(margin, Math.min(100 - margin, Math.random() * 100));
        const y = Math.max(margin, Math.min(100 - margin, Math.random() * 100));
        placed = { x, y };
      }
      positions.push(placed);
    }
    return positions;
  }

  // Pesos por celda: 1 + tasaDeFallo * k. Más fallos → más probabilidad.
  function adaptiveWeights() {
    const sessions = loadSessions();
    const total = new Array(GRID * GRID).fill(0);
    const fails = new Array(GRID * GRID).fill(0);
    sessions.forEach((s) => {
      (s.stimuli || []).forEach((st) => {
        const idx = cellIndex(st.x, st.y);
        total[idx]++;
        if (!st.hit) fails[idx]++;
      });
    });
    return total.map((t, i) => 1 + (t ? (fails[i] / t) * 3 : 0));
  }

  function weightedPick(weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  // =====================================================================
  //  Ejercicio
  // =====================================================================
  let camStream = null;

  function startSession(config) {
    const positions = generatePositions(config.count, config.stimSize, config.adaptive);
    session = {
      startedAt: Date.now(),
      config,
      stimuli: positions.map((p) => ({ x: p.x, y: p.y, hit: true, shownAt: null, coveredAt: null })),
      current: 0,
    };

    showScreen("#screen-exercise");
    if (config.camera) enableCamera();
    renderFixation();
    showStimulus(0);
    document.addEventListener("keydown", onExerciseKey);
  }

  function renderFixation() {
    const stage = $("#stage");
    stage.innerHTML = "";
    const fix = document.createElement("div");
    fix.className = "fixation " + session.config.centerType;
    const size = session.config.centerSize; // % de vmin
    fix.style.width = `min(${size}vw, ${size}vh)`;
    fix.style.height = `min(${size}vw, ${size}vh)`;
    fix.id = "fixation";
    stage.appendChild(fix);
  }

  function showStimulus(index) {
    const prev = $("#stimulus");
    if (prev) prev.remove();

    const st = session.stimuli[index];
    st.shownAt = Date.now();

    const el = document.createElement("div");
    el.id = "stimulus";
    el.className = "stimulus " + session.config.stimulusType;
    const size = session.config.stimSize;
    el.style.left = st.x + "%";
    el.style.top = st.y + "%";

    if (session.config.stimulusType === "x-red") {
      el.style.fontSize = `min(${size * 1.6}vw, ${size * 1.6}vh)`;
      el.textContent = "✕";
    } else {
      el.style.width = `min(${size}vw, ${size}vh)`;
      el.style.height = `min(${size}vw, ${size}vh)`;
    }
    $("#stage").appendChild(el);

    $("#hud-progress").textContent = `${index + 1} / ${session.stimuli.length}`;
  }

  function onExerciseKey(e) {
    if (e.code === "Space") {
      e.preventDefault();
      const st = session.stimuli[session.current];
      st.coveredAt = Date.now();
      sndAdvance();
      session.current++;
      if (session.current >= session.stimuli.length) {
        endExercise();
      } else {
        showStimulus(session.current);
      }
    } else if (e.code === "Escape") {
      e.preventDefault();
      if (confirm("¿Salir del ejercicio? Se perderá la sesión actual.")) {
        cleanupExercise();
        showScreen("#screen-config");
      }
    }
  }

  function endExercise() {
    cleanupExercise();
    renderReview();
    showScreen("#screen-review");
  }

  function cleanupExercise() {
    document.removeEventListener("keydown", onExerciseKey);
    disableCamera();
    $("#stage").innerHTML = "";
  }

  // ---- Cámara (vista previa; análisis IA = mejora futura) ----
  async function enableCamera() {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const v = $("#cam-preview");
      v.srcObject = camStream;
      v.classList.remove("hidden");
    } catch {
      console.warn("No se pudo acceder a la cámara.");
    }
  }
  function disableCamera() {
    if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
    const v = $("#cam-preview");
    v.classList.add("hidden");
    v.srcObject = null;
  }

  // =====================================================================
  //  Revisión (acierto / fallo)
  // =====================================================================
  function renderReview() {
    const map = $("#review-map");
    map.innerHTML = '<div class="center-mark"></div>';
    session.stimuli.forEach((st, i) => {
      const dot = document.createElement("div");
      dot.className = "review-dot " + (st.hit ? "ok" : "fail");
      dot.style.left = st.x + "%";
      dot.style.top = st.y + "%";
      dot.textContent = i + 1;
      dot.addEventListener("click", () => {
        st.hit = !st.hit;
        dot.className = "review-dot " + (st.hit ? "ok" : "fail");
        st.hit ? sndOk() : sndFail();
      });
      map.appendChild(dot);
    });
  }

  function saveCurrentSession() {
    const hits = session.stimuli.filter((s) => s.hit).length;
    const record = {
      id: session.startedAt,
      date: new Date(session.startedAt).toISOString(),
      config: session.config,
      total: session.stimuli.length,
      hits,
      accuracy: session.stimuli.length ? hits / session.stimuli.length : 0,
      stimuli: session.stimuli.map((s) => ({ x: s.x, y: s.y, hit: s.hit })),
    };
    const list = loadSessions();
    list.push(record);
    saveSessions(list);
    session = null;
    renderHistory();
    showScreen("#screen-history");
  }

  // =====================================================================
  //  Historial y evolución
  // =====================================================================
  function renderHistory() {
    const list = loadSessions();
    const summary = $("#history-summary");
    const listEl = $("#history-list");

    if (!list.length) {
      summary.innerHTML = '<p class="empty">Aún no hay sesiones guardadas.</p>';
      listEl.innerHTML = "";
      drawChart([]);
      renderHeatmap([]);
      return;
    }

    const totalSessions = list.length;
    const avgAcc = list.reduce((a, s) => a + s.accuracy, 0) / totalSessions;
    const last = list[list.length - 1];
    const best = list.reduce((m, s) => Math.max(m, s.accuracy), 0);

    summary.innerHTML = `
      <div class="stat-card"><div class="num">${totalSessions}</div><div class="lbl">Sesiones</div></div>
      <div class="stat-card"><div class="num">${pct(avgAcc)}</div><div class="lbl">Precisión media</div></div>
      <div class="stat-card"><div class="num">${pct(last.accuracy)}</div><div class="lbl">Última sesión</div></div>
      <div class="stat-card"><div class="num">${pct(best)}</div><div class="lbl">Mejor sesión</div></div>
    `;

    listEl.innerHTML = list.slice().reverse().map((s) => {
      const d = new Date(s.date);
      const cls = s.accuracy >= 0.8 ? "ok" : s.accuracy >= 0.5 ? "" : "fail";
      return `<div class="history-row">
        <span>${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
        <span>${s.hits}/${s.total} estímulos</span>
        <span class="pct ${cls}" style="color:var(--${cls==='ok'?'ok':cls==='fail'?'fail':'ink'})">${pct(s.accuracy)}</span>
      </div>`;
    }).join("");

    drawChart(list.map((s) => s.accuracy));
    renderHeatmap(list);
  }

  const pct = (v) => Math.round(v * 100) + "%";

  // Gráfico de líneas de la precisión por sesión (canvas puro, sin librerías).
  function drawChart(values) {
    const cv = $("#evolution-chart");
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 36;
    ctx.clearRect(0, 0, W, H);

    // ejes
    ctx.strokeStyle = "#d9d5cb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, 10); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 10, H - pad);
    ctx.stroke();
    ctx.fillStyle = "#9a958a";
    ctx.font = "12px system-ui";
    [0, 50, 100].forEach((p) => {
      const y = (H - pad) - (p / 100) * (H - pad - 10);
      ctx.fillText(p + "%", 6, y + 4);
      ctx.strokeStyle = "#efeee9";
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 10, y); ctx.stroke();
    });

    if (!values.length) return;
    const stepX = values.length > 1 ? (W - pad - 20) / (values.length - 1) : 0;
    const toXY = (i, v) => [pad + i * stepX, (H - pad) - v * (H - pad - 10)];

    // línea
    ctx.strokeStyle = "#2f6f5e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    values.forEach((v, i) => {
      const [x, y] = toXY(i, v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // puntos
    ctx.fillStyle = "#2f6f5e";
    values.forEach((v, i) => {
      const [x, y] = toXY(i, v);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  // Mapa de calor de fallos acumulados sobre la rejilla.
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
  //  Lectura de configuración del formulario
  // =====================================================================
  function readConfig() {
    return {
      count: parseInt($("#cfg-count").value, 10),
      stimulusType: $("#cfg-stimulus-type").value,
      stimSize: parseFloat($("#cfg-stim-size").value),
      centerType: $("#cfg-center-type").value,
      centerSize: parseFloat($("#cfg-center-size").value),
      sound: $("#cfg-sound").checked,
      adaptive: $("#cfg-adaptive").checked,
      camera: $("#cfg-camera").checked,
    };
  }

  // =====================================================================
  //  Cableado de eventos de la interfaz
  // =====================================================================
  function bindUI() {
    // Salidas en vivo de los sliders
    const sync = (input, out, fmt = (v) => v) => {
      const o = $(out);
      const upd = () => (o.textContent = fmt(input.value));
      input.addEventListener("input", upd); upd();
    };
    sync($("#cfg-count"), "#out-count");
    sync($("#cfg-stim-size"), "#out-stim-size", (v) => parseFloat(v).toFixed(1));
    sync($("#cfg-center-size"), "#out-center-size", (v) => parseFloat(v).toFixed(1));

    $("#config-form").addEventListener("submit", (e) => {
      e.preventDefault();
      startSession(readConfig());
    });

    $("#btn-history").addEventListener("click", () => { renderHistory(); showScreen("#screen-history"); });
    $("#btn-back-config").addEventListener("click", () => showScreen("#screen-config"));

    $("#btn-all-ok").addEventListener("click", () => { session.stimuli.forEach((s) => s.hit = true); renderReview(); });
    $("#btn-all-fail").addEventListener("click", () => { session.stimuli.forEach((s) => s.hit = false); renderReview(); });
    $("#btn-save-session").addEventListener("click", saveCurrentSession);

    $("#btn-clear").addEventListener("click", () => {
      if (confirm("¿Borrar todo el historial de sesiones?")) { saveSessions([]); renderHistory(); }
    });
    $("#btn-export").addEventListener("click", exportData);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(loadSessions(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rehabilitacion-visual-historial.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Arranque ----
  document.addEventListener("DOMContentLoaded", () => {
    bindUI();
    showScreen("#screen-config");
  });
})();
