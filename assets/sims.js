/* Simulationen für die Quantenobjekte (vereinfachte Modelle, ohne externe Bibliotheken) */
(function () {
  "use strict";

  const H = 6.626e-34, ME = 9.109e-31, QE = 1.602e-19;

  // ---------- Hilfsfunktionen ----------
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function gauss() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function sinc2(x) { if (Math.abs(x) < 1e-9) return 1; const s = Math.sin(x) / x; return s * s; }
  function fmt(x, digits) {
    // Zahl in deutscher Schreibweise mit Zehnerpotenz
    if (x === 0) return "0";
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e <= 3) return x.toLocaleString("de-DE", { maximumSignificantDigits: digits || 3 });
    const m = x / Math.pow(10, e);
    return m.toLocaleString("de-DE", { maximumSignificantDigits: digits || 3 }) + " · 10<sup>" + e + "</sup>";
  }
  function sup(n) { return String(n).replace(/[-0-9]/g, (c) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]); }
  function de(x, d) { return x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  // Rahmen einer Simulation
  function frame(host, title, note) {
    host.classList.add("sim");
    host.innerHTML = "";
    const head = el("div", { class: "sim-head" }, `${title}<span>${note || "vereinfachte Simulation"}</span>`);
    const body = el("div", { class: "sim-body" });
    host.append(head, body);
    return body;
  }

  // Canvas mit fester Seitenverhältnis, scharf auf hochauflösenden Displays
  function surface(cv, aspect, draw) {
    cv.style.aspectRatio = String(aspect);
    let w = 0, h = 0;
    function redraw() {
      if (!w) return;
      const ctx = cv.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
    }
    function resize() {
      if (!cv.clientWidth || cv.clientWidth === w) return;
      w = cv.clientWidth; h = w / aspect;
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      redraw();
    }
    new ResizeObserver(resize).observe(cv);
    document.addEventListener("themechange", redraw);
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw);
    return { redraw, size: () => [w, h] };
  }

  function counter(label, id) { return `<div>${label}<b data-c="${id}">0</b></div>`; }
  function setCount(root, id, v) { const b = root.querySelector(`[data-c="${id}"]`); if (b) b.innerHTML = v; }

  // Läuft eine Quelle automatisch? (Start/Stopp-Knopf)
  function runner(btn, step, maxSteps) {
    let t = null, n = 0;
    function stop() { if (t) { clearInterval(t); t = null; btn.textContent = "Start"; } }
    btn.addEventListener("click", () => {
      if (t) return stop();
      btn.textContent = "Stopp"; n = 0;
      t = setInterval(() => { step(); if (++n > maxSteps) stop(); }, 30);
    });
    return { stop };
  }

  // =====================================================================
  // 1) Mach-Zehnder-Interferometer mit Einzelphotonen
  // =====================================================================
  function mzi(host) {
    const body = frame(host, "Mach-Zehnder mit Einzelphotonen");
    body.innerHTML = `
      <canvas class="dark" aria-label="Schirm mit den Auftrefforten der Photonen"></canvas>
      <div class="ctrl">
        <label><input type="checkbox" data-o="st2" checked> Strahlteiler 2 eingesetzt</label>
        <label><input type="checkbox" data-o="block"> Weg B abgedeckt</label>
        <label><input type="checkbox" data-o="det"> Detektoren in A und B</label>
      </div>
      <div class="ctrl">
        <button class="btn" data-n="1">1 Photon</button>
        <button class="btn" data-n="100">100 Photonen</button>
        <button class="btn primary" data-run>Start</button>
        <button class="btn" data-reset>Zurücksetzen</button>
      </div>
      <div class="counts">${counter("gesendet", "sent")}${counter("am Schirm", "screen")}${counter("Detektor A", "a")}${counter("Detektor B", "b")}</div>`;
    const o = {};
    body.querySelectorAll("[data-o]").forEach((c) => (o[c.dataset.o] = c));
    let dots = [], sent = 0, onScreen = 0, detA = 0, detB = 0, last = null;

    function photon() {
      sent++;
      const path = Math.random() < 0.5 ? "A" : "B";
      if (o.block.checked && path === "B") return; // vom Papier absorbiert
      if (o.det.checked) { if (path === "A") detA++; else detB++; }
      const which = o.det.checked || o.block.checked || !o.st2.checked; // Weginformation vorhanden?
      let x, y;
      do { x = gauss() * 0.42; y = gauss() * 0.42; } while (Math.abs(x) > 1.2 || Math.abs(y) > 0.5);
      if (!o.st2.checked) { if (path === "B") return; } // ohne ST2 gelangt nur Weg A zum Schirm
      else if (which) { if (Math.random() < 0.5) return; } // jedes zweite Photon läuft zum Block
      else {
        const r2 = x * x + y * y;
        if (Math.random() > Math.pow(Math.cos(Math.PI * r2 / 0.055), 2)) return; // Ringmuster
      }
      onScreen++;
      last = [x, y];
      dots.push(last);
    }
    const s = surface(body.querySelector("canvas"), 2.4, (ctx, w, h) => {
      ctx.fillStyle = "#0b0d10"; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, sc = h;
      ctx.fillStyle = css("--photon");
      ctx.globalAlpha = 0.85;
      const r = Math.max(1.2, w / 380);
      for (const [x, y] of dots) { ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (last && dots.length < 30) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx + last[0] * sc, cy + last[1] * sc, r * 4, 0, 7); ctx.stroke(); }
    });
    function show() {
      s.redraw();
      setCount(body, "sent", sent); setCount(body, "screen", onScreen);
      setCount(body, "a", o.det.checked ? detA : "–"); setCount(body, "b", o.det.checked ? detB : "–");
    }
    function reset() { dots = []; sent = onScreen = detA = detB = 0; last = null; show(); }
    body.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => { for (let i = 0; i < +b.dataset.n; i++) photon(); show(); }));
    const run = runner(body.querySelector("[data-run]"), () => { for (let i = 0; i < 12; i++) photon(); show(); }, 3000);
    body.querySelector("[data-reset]").addEventListener("click", () => { run.stop(); reset(); });
    Object.values(o).forEach((c) => c.addEventListener("change", reset));
    show();
  }

  // =====================================================================
  // 2) Doppelspalt mit einzelnen Quantenobjekten (optional Polfilter)
  // =====================================================================
  function doubleSlit(host, opts) {
    opts = Object.assign({ sources: ["elektronen"], polarizers: false, slits: true, title: "Doppelspalt mit einzelnen Quantenobjekten" }, opts);
    const names = { kugeln: "klassische Kugeln", elektronen: "Elektronen", photonen: "Photonen" };
    const body = frame(host, opts.title);
    const srcSel = opts.sources.length > 1
      ? `<label>Quelle <select data-src>${opts.sources.map((s) => `<option value="${s}">${names[s]}</option>`).join("")}</select></label>` : "";
    const polCtl = (id, label, def) => `<fieldset><legend>${label}</legend>
        <label><input type="checkbox" data-pon="${id}"${def != null ? " checked" : ""}> eingesetzt</label>
        <select data-pang="${id}">${[-90, -45, 0, 45, 90].map((a) => `<option value="${a}"${a === (def || 0) ? " selected" : ""}>${a > 0 ? "+" : ""}${a}°</option>`).join("")}</select></fieldset>`;
    body.innerHTML = `
      <canvas class="dark" aria-label="Schirm mit Auftrefforten und Häufigkeitsverteilung"></canvas>
      ${opts.polarizers ? `<div class="pol">${polCtl("p1", "P1 hinter Spalt 1")}${polCtl("p2", "P2 hinter Spalt 2")}${polCtl("q", "Q vor dem Schirm")}</div>` : ""}
      <div class="ctrl">${srcSel}
        ${opts.slits ? `<label><input type="checkbox" data-slit="1" checked> Spalt 1 offen</label><label><input type="checkbox" data-slit="2" checked> Spalt 2 offen</label>` : ""}
        <label><input type="checkbox" data-theory> Verteilung einblenden</label>
      </div>
      <div class="ctrl">
        <button class="btn" data-n="1">1 Objekt</button>
        <button class="btn" data-n="100">100</button>
        <button class="btn primary" data-run>Start</button>
        <button class="btn" data-reset>Zurücksetzen</button>
      </div>
      <div class="counts">${counter("nachgewiesen", "n")}</div>`;
    const q = (s) => body.querySelector(s);
    const BINS = 90, S = 0.2, XE = 0.8; // Streifenabstand und erste Nullstelle der Einzelspalt-Einhüllenden
    let dots = [], hist = new Array(BINS).fill(0), last = null;

    function state() {
      const src = q("[data-src]") ? q("[data-src]").value : opts.sources[0];
      const open1 = !opts.slits || q('[data-slit="1"]').checked, open2 = !opts.slits || q('[data-slit="2"]').checked;
      const pol = {};
      if (opts.polarizers) ["p1", "p2", "q"].forEach((k) => {
        pol[k] = q(`[data-pon="${k}"]`).checked ? (+q(`[data-pang="${k}"]`).value) * Math.PI / 180 : null;
      });
      return { src, open1, open2, pol };
    }
    // Polarisation als Vektor, 0° = Polarisationsrichtung des Lasers
    function through(v, ang) { if (ang == null) return v; const p = [Math.cos(ang), Math.sin(ang)], d = v[0] * p[0] + v[1] * p[1]; return [d * p[0], d * p[1]]; }
    function intensity(x, st) {
      if (st.src === "kugeln") {
        const g = (m) => Math.exp(-((x - m) ** 2) / (2 * 0.13 * 0.13));
        return (st.open1 ? g(-0.28) : 0) + (st.open2 ? g(0.28) : 0);
      }
      let a1 = st.open1 ? through([1, 0], st.pol.p1) : [0, 0];
      let a2 = st.open2 ? through([1, 0], st.pol.p2) : [0, 0];
      if (st.pol.q != null) { a1 = through(a1, st.pol.q); a2 = through(a2, st.pol.q); }
      const n1 = a1[0] ** 2 + a1[1] ** 2, n2 = a2[0] ** 2 + a2[1] ** 2, c = a1[0] * a2[0] + a1[1] * a2[1];
      return sinc2(Math.PI * x / XE) * (n1 + n2 + 2 * c * Math.cos(2 * Math.PI * x / S));
    }
    function emit(st) {
      // Verwerfungsverfahren: Auftreffort zufällig nach der Verteilung wählen
      const max = st.src === "kugeln" ? 2 : 4;
      for (let k = 0; k < 400; k++) {
        const x = Math.random() * 2 - 1;
        if (Math.random() * max < intensity(x, st)) {
          let y; do { y = 0.5 + gauss() * 0.2; } while (y < 0.04 || y > 0.96);
          last = [x, y]; dots.push(last);
          hist[Math.min(BINS - 1, Math.floor((x + 1) / 2 * BINS))]++;
          return true;
        }
      }
      return false; // alles abgeschirmt
    }
    const s = surface(q("canvas"), 1.8, (ctx, w, h) => {
      const hs = h * 0.62; // Schirmbereich oben, Histogramm unten
      ctx.fillStyle = "#0b0d10"; ctx.fillRect(0, 0, w, h);
      const r = Math.max(1, w / 420);
      ctx.fillStyle = css("--photon"); ctx.globalAlpha = dots.length > 4000 ? 0.55 : 0.85;
      for (const [x, y] of dots) { ctx.beginPath(); ctx.arc((x + 1) / 2 * w, y * hs, r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (last && dots.length < 40) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc((last[0] + 1) / 2 * w, last[1] * hs, r * 5, 0, 7); ctx.stroke(); }
      ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.beginPath(); ctx.moveTo(0, hs + 0.5); ctx.lineTo(w, hs + 0.5); ctx.stroke();
      const top = hs + 8, base = h - 6, hh = base - top;
      const mx = Math.max(1, ...hist), bw = w / BINS;
      ctx.fillStyle = "rgba(255,255,255,.55)";
      hist.forEach((c, i) => { const bh = c / mx * hh; ctx.fillRect(i * bw + 0.5, base - bh, bw - 1, bh); });
      ctx.font = "12px system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.fillText("Anzahl der Treffer je Streifen", 8, top + 12);
      if (q("[data-theory]").checked) {
        const st = state(), N = 400;
        let integ = 0; const ys = [];
        for (let i = 0; i <= N; i++) { const v = intensity(-1 + 2 * i / N, st); ys.push(v); integ += v; }
        integ *= 2 / N;
        const total = hist.reduce((a, b) => a + b, 0);
        const peak = Math.max(...ys);
        const scale = total > 30 ? (total * (2 / BINS) / (integ || 1)) / mx : 1 / (peak || 1);
        ctx.strokeStyle = css("--board-hl") || "#f4dc7a"; ctx.lineWidth = 2; ctx.beginPath();
        ys.forEach((v, i) => { const X = i / N * w, Y = base - Math.min(1.15, v * scale) * hh; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.stroke();
      }
    });
    function show() { s.redraw(); setCount(body, "n", dots.length); }
    function reset() { dots = []; hist = new Array(BINS).fill(0); last = null; show(); }
    body.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => { const st = state(); for (let i = 0; i < +b.dataset.n; i++) emit(st); show(); }));
    const run = runner(q("[data-run]"), () => { const st = state(); for (let i = 0; i < 15; i++) emit(st); show(); }, 2500);
    q("[data-reset]").addEventListener("click", () => { run.stop(); reset(); });
    body.querySelectorAll("select, input[data-slit], input[data-pon]").forEach((c) => c.addEventListener("change", reset));
    q("[data-theory]").addEventListener("change", show);
    show();
  }

  // =====================================================================
  // 3) Spaltbilder: Einzelspalt (Breite b) und Mehrfachspalt (Anzahl N)
  // =====================================================================
  function slit(host, opts) {
    const multi = opts && opts.mode === "multi";
    const lambda = 532e-9, L = multi ? 6 : 5.85, half = 0.06, p = H / lambda;
    const b0 = 0.06e-3, g = 0.25e-3;
    const body = frame(host, multi ? "Mehrfachspalt: Schirmbild und Querimpuls" : "Einzelspalt: Schirmbild und Querimpuls",
      `λ = 532 nm, L = ${de(L, 2).replace(",00", "")} m, Ausschnitt 12 cm`);
    body.innerHTML = `
      <canvas aria-label="Berechnetes Schirmbild mit Intensitätsverlauf"></canvas>
      <div class="ctrl">
        ${multi
          ? `<label>Spaltanzahl <select data-n>${[1, 2, 3, 4, 10].map((n) => `<option value="${n}"${n === 2 ? " selected" : ""}>${n === 10 ? "Gitter (10)" : n}</option>`).join("")}</select></label>
             <span>b = 0,06 mm, g = 0,25 mm</span>`
          : `<label>Spaltbreite b <input type="range" min="0.06" max="0.5" step="0.005" value="0.4" data-b></label><output data-bo></output>`}
      </div>
      <div class="counts" data-vals></div>`;
    const q = (s) => body.querySelector(s);
    function params() {
      return multi ? { N: +q("[data-n]").value, b: b0 } : { N: 1, b: +q("[data-b]").value * 1e-3 };
    }
    function I(x, P) {
      const s = x / Math.sqrt(x * x + L * L);
      const env = sinc2(Math.PI * P.b * s / lambda);
      if (P.N === 1) return env;
      const ph = Math.PI * g * s / lambda, den = Math.sin(ph);
      const arr = Math.abs(den) < 1e-9 ? 1 : Math.pow(Math.sin(P.N * ph) / (P.N * den), 2);
      return env * arr;
    }
    const s = surface(q("canvas"), 2.6, (ctx, w, h) => {
      const P = params();
      const stripH = h * 0.36, top = h * 0.44, base = h - 22;
      // Schirmbild (Helligkeit wie an der Wand, mit Gamma für das Auge)
      ctx.fillStyle = "#0b0d10"; ctx.fillRect(0, 0, w, stripH);
      const img = ctx.createImageData(Math.round(w), 1);
      for (let i = 0; i < img.width; i++) {
        const x = (i / img.width * 2 - 1) * half, v = Math.pow(I(x, P), 0.45);
        img.data[i * 4] = 30 * v; img.data[i * 4 + 1] = 255 * v; img.data[i * 4 + 2] = 60 * v; img.data[i * 4 + 3] = 255;
      }
      const tmp = document.createElement("canvas"); tmp.width = img.width; tmp.height = 1;
      tmp.getContext("2d").putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tmp, 0, stripH * 0.3, w, stripH * 0.4);
      // Intensitätsverlauf
      ctx.strokeStyle = css("--line"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, base + 0.5); ctx.lineTo(w, base + 0.5); ctx.stroke();
      for (let cm = -6; cm <= 6; cm++) {
        const X = (cm / 100 / half + 1) / 2 * w;
        ctx.beginPath(); ctx.moveTo(X, base); ctx.lineTo(X, base + (cm % 2 ? 4 : 7)); ctx.stroke();
      }
      ctx.fillStyle = css("--muted"); ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center";
      [-6, -4, -2, 0, 2, 4, 6].forEach((cm) => ctx.fillText(cm + " cm", (cm / 100 / half + 1) / 2 * w, base + 18));
      ctx.strokeStyle = css("--accent-2"); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 600; i++) {
        const x = (i / 600 * 2 - 1) * half, X = i / 600 * w, Y = base - I(x, P) * (base - top);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      // erste Minima neben dem Hauptmaximum markieren
      const sMin = multi ? lambda / (P.N * g) : lambda / P.b;
      const a = L * Math.tan(Math.asin(Math.min(0.99, sMin)));
      if (a < half) {
        ctx.strokeStyle = css("--impuls"); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.3;
        [-a, a].forEach((x) => { const X = (x / half + 1) / 2 * w; ctx.beginPath(); ctx.moveTo(X, 4); ctx.lineTo(X, base); ctx.stroke(); });
        ctx.setLineDash([]);
      }
    });
    function show() {
      const P = params();
      let html;
      if (multi) {
        const dx = P.N * g, sd = lambda / dx, dp = p * sd;
        html = counter("Ortsstreuung Δx ≈ N·g", "dx") + counter("sin δ = λ/(N·g)", "sd") + counter("Δpₓ in N·s", "dp") + counter("Δx · Δpₓ in J·s", "pr");
        q("[data-vals]").innerHTML = html;
        setCount(body, "dx", de(dx * 1e3, 2) + " mm"); setCount(body, "sd", fmt(sd));
        body.querySelector('[data-c="dp"]').innerHTML = fmt(dp); body.querySelector('[data-c="pr"]').innerHTML = fmt(dx * dp);
      } else {
        const sa = lambda / P.b, a = L * Math.tan(Math.asin(sa)), dp = p * sa;
        q("[data-bo]").textContent = de(P.b * 1e3, 3) + " mm";
        html = counter("Abstand 2a der ersten Minima", "a") + counter("Δx = b", "dx") + counter("Δpₓ = p · sin α in N·s", "dp") + counter("Δx · Δpₓ in J·s", "pr");
        q("[data-vals]").innerHTML = html;
        setCount(body, "a", de(2 * a * 100, 1) + " cm"); setCount(body, "dx", de(P.b * 1e3, 3) + " mm");
        body.querySelector('[data-c="dp"]').innerHTML = fmt(dp); body.querySelector('[data-c="pr"]').innerHTML = fmt(P.b * dp);
      }
      s.redraw();
    }
    body.querySelectorAll("input, select").forEach((c) => c.addEventListener("input", show));
    show();
  }

  // =====================================================================
  // 4) Zeigerdarstellung am Doppelspalt
  // =====================================================================
  function zeiger(host) {
    const body = frame(host, "Zeiger am Doppelspalt", "Nachweiswahrscheinlichkeit ~ (Länge des Summenzeigers)²");
    body.innerHTML = `
      <canvas aria-label="Doppelspalt mit zwei Wegen zum Detektor und Zeigerdiagramm"></canvas>
      <div class="ctrl"><label>Ort des Detektors <input type="range" min="-1" max="1" step="0.002" value="0" data-x></label>
        <output data-o></output></div>`;
    const q = (s) => body.querySelector(s);
    // Modellmaße in Wellenlängen: Spaltabstand 6 λ, Schirmabstand 40 λ
    const G = 6, LL = 40, XMAX = 14;
    function path(x, sgn) { return Math.hypot(LL, x - sgn * G / 2); }
    function prob(x) { const d = path(x, 1) - path(x, -1); return Math.cos(Math.PI * d) ** 2; }
    const s = surface(q("canvas"), 2.2, (ctx, w, h) => {
      const xd = +q("[data-x]").value * XMAX;
      const lw = w * 0.58, pad = 14;
      const sy = (h - 2 * pad) / (2 * XMAX), sx = (lw - 70) / LL;
      const X0 = 30, Y0 = h / 2, Xs = X0 + LL * sx;
      const fg = css("--fg"), mut = css("--muted"), acc = css("--accent-2"), las = css("--laser"), imp = css("--impuls");
      // Blende und Schirm
      ctx.strokeStyle = fg; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X0, pad); ctx.lineTo(X0, Y0 - (G / 2 + 0.6) * sy);
      ctx.moveTo(X0, Y0 - (G / 2 - 0.6) * sy); ctx.lineTo(X0, Y0 + (G / 2 - 0.6) * sy);
      ctx.moveTo(X0, Y0 + (G / 2 + 0.6) * sy); ctx.lineTo(X0, h - pad); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Xs, pad); ctx.lineTo(Xs, h - pad); ctx.stroke();
      // Wahrscheinlichkeitsverlauf am Schirm
      ctx.strokeStyle = acc; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const x = -XMAX + 2 * XMAX * i / 300, Y = Y0 - x * sy, X = Xs + 4 + prob(x) * 50; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      // die beiden klassisch denkbaren Wege
      const yd = Y0 - xd * sy;
      ctx.lineWidth = 2;
      [[1, las], [-1, imp]].forEach(([sg, col]) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(X0, Y0 - sg * G / 2 * sy); ctx.lineTo(Xs, yd); ctx.stroke(); });
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(Xs, yd, 5, 0, 7); ctx.fill();
      ctx.font = "12px system-ui, sans-serif"; ctx.fillStyle = mut; ctx.textAlign = "left";
      ctx.fillText("Detektor", Xs - 54, yd - 8);
      // Zeigerdiagramm
      const cx = lw + (w - lw) / 2, cy = h / 2, R = Math.min((w - lw) / 4.6, h / 4.6);
      const ph1 = 2 * Math.PI * path(xd, 1), ph2 = 2 * Math.PI * path(xd, -1);
      const v1 = [Math.cos(ph1) * R, -Math.sin(ph1) * R], v2 = [Math.cos(ph2) * R, -Math.sin(ph2) * R];
      ctx.strokeStyle = css("--line"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 2 * R, 0, 7); ctx.stroke();
      function arrow(x1, y1, x2, y2, col, wdt) {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = wdt;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        const a = Math.atan2(y2 - y1, x2 - x1), l = Math.hypot(x2 - x1, y2 - y1);
        if (l < 4) return;
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4)); ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
      }
      arrow(cx, cy, cx + v1[0], cy + v1[1], las, 2.5);
      arrow(cx + v1[0], cy + v1[1], cx + v1[0] + v2[0], cy + v1[1] + v2[1], imp, 2.5);
      arrow(cx, cy, cx + v1[0] + v2[0], cy + v1[1] + v2[1], fg, 3);
      ctx.fillStyle = mut; ctx.textAlign = "center";
      ctx.fillText("Zeiger am Detektor", cx, h - 6);
      const d = path(xd, 1) - path(xd, -1);
      q("[data-o]").innerHTML = `Gangunterschied ${de(Math.abs(d), 2)} λ · Wahrscheinlichkeit ${de(prob(xd) * 100, 0)} % des Maximums`;
    });
    q("[data-x]").addEventListener("input", s.redraw);
  }

  // =====================================================================
  // 5) Elektronenbeugungsröhre: Ringe in Abhängigkeit von der Spannung
  // =====================================================================
  function beugung(host) {
    const body = frame(host, "Elektronenbeugungsröhre", "Grafit: g₁ = 213 pm, g₂ = 123 pm, L = 13,5 cm");
    body.innerHTML = `
      <canvas class="dark" aria-label="Leuchtschirm mit zwei Beugungsringen"></canvas>
      <div class="ctrl"><label>Beschleunigungsspannung U <input type="range" min="2.5" max="5" step="0.1" value="3.5" data-u></label><output data-uo></output>
        <label><input type="checkbox" data-vals> Werte anzeigen</label></div>
      <div class="counts" data-out hidden>${counter("Geschwindigkeit v", "v")}${counter("λ nach de Broglie", "l")}${counter("Durchmesser D₂ (äußerer Ring)", "d2")}</div>`;
    const q = (s) => body.querySelector(s);
    const L = 0.135, g1 = 213e-12, g2 = 123e-12, R = 0.065; // Abstand Folie–Schirm, Kolbenradius
    function vals() {
      const U = +q("[data-u]").value * 1000, v = Math.sqrt(2 * QE * U / ME), lam = H / (ME * v);
      return { U, v, lam, r1: L * lam / g1, r2: L * lam / g2 };
    }
    const s = surface(q("canvas"), 1.5, (ctx, w, h) => {
      const V = vals(), cx = w / 2, cy = h / 2, sc = (h * 0.46) / R;
      ctx.fillStyle = "#0b0d10"; ctx.fillRect(0, 0, w, h);
      // Leuchtschirm
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * sc);
      grd.addColorStop(0, "#1d3a24"); grd.addColorStop(1, "#0f1a12");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, R * sc, 0, 7); ctx.fill();
      // Ringe als weiche Leuchtbänder
      [[V.r1, 0.9], [V.r2, 0.7]].forEach(([r, a]) => {
        for (let k = -6; k <= 6; k++) {
          ctx.strokeStyle = `rgba(120,255,140,${a * Math.exp(-(k * k) / 10) * 0.35})`;
          ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r * sc + k * 1.2, 0, 7); ctx.stroke();
        }
      });
      // Zentrum (abgeklebt) und Skala in cm
      ctx.fillStyle = "#c8f5d0"; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1;
      ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.beginPath(); ctx.moveTo(cx - 0.05 * sc, cy + R * sc * 0.82); ctx.lineTo(cx + 0.05 * sc, cy + R * sc * 0.82); ctx.stroke();
      for (let mm = -50; mm <= 50; mm += 5) {
        const X = cx + mm / 1000 * sc, t = mm % 10 ? 3 : 6;
        ctx.beginPath(); ctx.moveTo(X, cy + R * sc * 0.82 - t); ctx.lineTo(X, cy + R * sc * 0.82 + t); ctx.stroke();
        if (mm % 20 === 0) ctx.fillText(Math.abs(mm / 10) + "", X, cy + R * sc * 0.82 + 18);
      }
      ctx.fillText("cm", cx + 0.05 * sc + 16, cy + R * sc * 0.82 + 4);
    });
    function show() {
      const V = vals();
      q("[data-uo]").textContent = de(V.U / 1000, 1) + " kV";
      q("[data-out]").hidden = !q("[data-vals]").checked;
      body.querySelector('[data-c="v"]').innerHTML = fmt(V.v) + " m/s";
      setCount(body, "l", de(V.lam * 1e12, 1) + " pm");
      setCount(body, "d2", de(2 * V.r2 * 100, 1) + " cm");
      s.redraw();
    }
    body.querySelectorAll("input").forEach((c) => c.addEventListener("input", show));
    show();
  }

  // =====================================================================
  // 6) Wellenpaket aus überlagerten Wellen
  // =====================================================================
  function wellenpaket(host) {
    const body = frame(host, "Wellenpaket", "Überlagerung von Wellen mit verschiedenen Wellenzahlen");
    body.innerHTML = `
      <canvas aria-label="oben Verteilung der Wellenzahlen, unten das Wellenpaket"></canvas>
      <div class="ctrl"><label>Breite σ<sub>k</sub> der Wellenzahlen <input type="range" min="1" max="4" step="0.25" value="1" data-sk></label><output data-sko></output></div>
      <div class="ctrl"><label>Abstand der Komponenten <input type="range" min="0.05" max="1.6" step="0.05" value="1" data-dk></label><output data-dko></output></div>
      <div class="counts">${counter("Breite σ<sub>x</sub> des Pakets", "sx")}${counter("σ<sub>x</sub> · σ<sub>k</sub>", "pr")}</div>`;
    const q = (s) => body.querySelector(s);
    const K0 = 12 * Math.PI, XR = 2; // mittlere Wellenzahl in rad/m, Bereich ±2 m
    const s = surface(q("canvas"), 1.7, (ctx, w, h) => {
      const sk = +q("[data-sk]").value * Math.PI, dk = +q("[data-dk]").value * Math.PI;
      const fg = css("--fg"), mut = css("--muted"), acc = css("--accent-2"), line = css("--line");
      const comps = [];
      for (let k = K0 - 4 * sk; k <= K0 + 4 * sk + 1e-9; k += dk) comps.push([k, Math.exp(-((k - K0) ** 2) / (2 * sk * sk))]);
      // oberes Diagramm: Amplituden der Komponenten
      const h1 = h * 0.36, kmin = K0 - 16 * Math.PI, kmax = K0 + 16 * Math.PI;
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(30, h1); ctx.lineTo(w - 10, h1); ctx.stroke();
      ctx.strokeStyle = acc; ctx.lineWidth = Math.max(1.5, Math.min(5, (w - 40) / ((kmax - kmin) / dk) * 0.5));
      comps.forEach(([k, a]) => { const X = 30 + (k - kmin) / (kmax - kmin) * (w - 40); ctx.beginPath(); ctx.moveTo(X, h1); ctx.lineTo(X, h1 - a * (h1 - 22)); ctx.stroke(); });
      ctx.fillStyle = mut; ctx.font = "12px system-ui, sans-serif"; ctx.textAlign = "left";
      ctx.fillText("Amplitude der Komponenten über der Wellenzahl k", 30, 14);
      // unteres Diagramm: Summe
      const y0 = h1 + (h - h1) / 2 + 6, amp = (h - h1) / 2 - 14;
      ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(30, y0); ctx.lineTo(w - 10, y0); ctx.stroke();
      const norm = comps.reduce((a, c) => a + c[1], 0) || 1;
      ctx.strokeStyle = fg; ctx.lineWidth = 1.6; ctx.beginPath();
      const N = Math.round(w * 1.5);
      for (let i = 0; i <= N; i++) {
        const x = -XR + 2 * XR * i / N;
        let y = 0; for (const [k, a] of comps) y += a * Math.cos(k * x);
        const X = 30 + i / N * (w - 40), Y = y0 - y / norm * amp;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      ctx.fillStyle = mut; ctx.fillText("Wellenpaket über dem Ort x (−2 m bis 2 m)", 30, h1 + 18);
    });
    function show() {
      const sk = +q("[data-sk]").value, dk = +q("[data-dk]").value;
      q("[data-sko]").innerHTML = (sk === 1 ? "" : de(sk, 2).replace(/,?0+$/, "")) + "π rad/m";
      q("[data-dko]").innerHTML = de(dk, 2) + "π rad/m";
      setCount(body, "sx", de(1 / (sk * Math.PI), 3) + " m");
      setCount(body, "pr", "1");
      s.redraw();
    }
    body.querySelectorAll("input").forEach((c) => c.addEventListener("input", show));
    show();
  }

  // =====================================================================
  // 7) Strahlteiler mit zwei Detektoren und Koinzidenzschaltung
  // =====================================================================
  function koinzidenz(host) {
    const body = frame(host, "Einzelne Photonen am Strahlteiler", "idealisierte Detektoren");
    body.innerHTML = `
      <svg class="sk" viewBox="0 0 420 170" style="display:block;width:100%;max-width:440px;margin:0 auto" role="img" aria-label="Quelle, Strahlteiler und zwei Detektoren">
        <rect class="part" x="10" y="68" width="44" height="34" rx="4"/><text x="16" y="124" class="m">Quelle</text>
        <path class="beam thin" d="M54 85 H200"/><path class="beam thin" d="M200 85 H330"/><path class="beam thin" d="M200 85 V20"/>
        <line class="split" x1="186" y1="99" x2="214" y2="71"/><text x="140" y="120" class="m">Strahlteiler</text>
        <circle data-d="1" cx="350" cy="85" r="18" class="part"/><text x="340" y="124">D1</text>
        <circle data-d="2" cx="200" cy="20" r="14" class="part" transform="translate(0 4)"/><text x="226" y="28">D2</text>
        <circle data-dot cx="54" cy="85" r="5" fill="var(--photon)" opacity="0"/>
      </svg>
      <div class="ctrl"><label>Modell <select data-model>
        <option value="photon">Messung mit einzelnen Photonen</option>
        <option value="teilung">Hypothese: Licht teilt sich am Strahlteiler</option></select></label></div>
      <div class="ctrl"><button class="btn" data-one>1 Photon senden</button><button class="btn primary" data-run>Start</button><button class="btn" data-reset>Zurücksetzen</button></div>
      <div class="counts">${counter("gesendet", "n")}${counter("D1", "d1")}${counter("D2", "d2")}${counter("D1 und D2 gleichzeitig", "k")}</div>`;
    const q = (s) => body.querySelector(s);
    let n = 0, d1 = 0, d2 = 0, k = 0, anim = null;
    function flash(which) {
      ["1", "2"].forEach((i) => q(`[data-d="${i}"]`).style.fill = which.includes(i) ? "var(--photon)" : "");
      clearTimeout(anim); anim = setTimeout(() => ["1", "2"].forEach((i) => (q(`[data-d="${i}"]`).style.fill = "")), 180);
    }
    function send() {
      n++;
      if (q("[data-model]").value === "teilung") { d1++; d2++; k++; flash("12"); }
      else if (Math.random() < 0.5) { d1++; flash("1"); } else { d2++; flash("2"); }
      setCount(body, "n", n); setCount(body, "d1", d1); setCount(body, "d2", d2); setCount(body, "k", k);
    }
    function reset() { n = d1 = d2 = k = 0; ["n", "d1", "d2", "k"].forEach((id) => setCount(body, id, 0)); }
    q("[data-one]").addEventListener("click", send);
    let t = null; const btn = q("[data-run]");
    btn.addEventListener("click", () => {
      if (t) { clearInterval(t); t = null; btn.textContent = "Start"; return; }
      btn.textContent = "Stopp"; t = setInterval(send, 220);
    });
    q("[data-reset]").addEventListener("click", reset);
    q("[data-model]").addEventListener("change", reset);
  }

  // =====================================================================
  // 8) de-Broglie-Wellenlänge verschiedener Objekte
  // =====================================================================
  function debroglie(host) {
    const OBJ = [
      ["Elektron", 9.109e-31, 6], ["Neutron", 1.675e-27, 2.5], ["C₆₀-Molekül (Fulleren)", 1.196e-24, 2.5], ["Fußball", 0.43, 1.3],
    ];
    const body = frame(host, "de-Broglie-Wellenlänge", "λ = h / (m · v)");
    body.innerHTML = `
      <div class="ctrl"><label>Objekt <select data-obj>${OBJ.map((o, i) => `<option value="${i}">${o[0]}</option>`).join("")}</select></label>
        <label>Geschwindigkeit <input type="range" min="0" max="7" step="0.01" data-v></label><output data-vo></output></div>
      <canvas aria-label="logarithmische Größenskala mit der Wellenlänge"></canvas>
      <div class="counts">${counter("Impuls p = m · v", "p")}${counter("Wellenlänge λ", "l")}</div>`;
    const q = (s) => body.querySelector(s);
    const REF = [[1e-15, "Atomkern"], [1e-10, "Atom"], [1e-9, "C₆₀"], [5e-7, "Licht"], [1e-4, "Haar"]];
    const E0 = -36, E1 = -3; // Skala 10^-36 m bis 10^-3 m
    function lam() { const o = OBJ[+q("[data-obj]").value], v = Math.pow(10, +q("[data-v]").value); return { o, v, p: o[1] * v, l: H / (o[1] * v) }; }
    const s = surface(q("canvas"), 4.2, (ctx, w, h) => {
      const V = lam(), y = h * 0.55, X = (e) => 12 + (e - E0) / (E1 - E0) * (w - 24);
      ctx.strokeStyle = css("--line"); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(E0), y); ctx.lineTo(X(E1), y); ctx.stroke();
      ctx.fillStyle = css("--muted"); ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center";
      for (let e = E0; e <= E1; e += 3) { ctx.fillRect(X(e) - 0.5, y - 4, 1, 8); ctx.fillText("10" + sup(e), X(e), y + 18); }
      ctx.fillStyle = css("--fg");
      REF.forEach(([v, t]) => { const x = X(Math.log10(v)); ctx.fillRect(x - 1, y - 10, 2, 10); ctx.fillText(t, x, y - 14); });
      const xl = X(Math.max(E0, Math.min(E1, Math.log10(V.l))));
      ctx.fillStyle = css("--accent-2"); ctx.beginPath(); ctx.moveTo(xl, y + 2); ctx.lineTo(xl - 7, y + 26); ctx.lineTo(xl + 7, y + 26); ctx.fill();
      ctx.font = "600 12px system-ui, sans-serif"; ctx.fillText("λ", xl, y + 40);
    });
    function show() {
      const V = lam();
      q("[data-vo]").innerHTML = fmt(V.v) + " m/s";
      body.querySelector('[data-c="p"]').innerHTML = fmt(V.p) + " N·s";
      body.querySelector('[data-c="l"]').innerHTML = fmt(V.l) + " m";
      s.redraw();
    }
    q("[data-obj]").addEventListener("change", () => { q("[data-v]").value = OBJ[+q("[data-obj]").value][2]; show(); });
    q("[data-v]").addEventListener("input", show);
    q("[data-v]").value = OBJ[0][2];
    show();
  }

  // =====================================================================
  // 9) Röntgenbremsspektrum: kurzwelliges Ende und Grenzwellenlänge
  // =====================================================================
  function bremsspektrum(host) {
    const HC = 1239.84; // h·c in eV·nm, also λ_G in pm = 1239,84 / U in kV
    const KA = 154.1, KB = 139.2; // Kupfer-Anode: K_α und K_β in pm
    const LMAX = 200;
    const body = frame(host, "Röntgenröhre mit Kupfer-Anode", "Bremsspektrum nach Kramers, Intensität relativ");
    body.innerHTML = `
      <div class="ctrl">
        <label>Beschleunigungsspannung U <input type="range" min="10" max="50" step="1" value="25" data-u></label>
        <label><input type="checkbox" data-k checked> charakteristische Linien</label>
        <label><input type="checkbox" data-g> Grenzwellenlänge markieren</label>
      </div>
      <canvas aria-label="Intensität der Röntgenstrahlung über der Wellenlänge"></canvas>
      <div class="counts">${counter("Spannung U", "u")}${counter("Energie eines Elektrons e · U", "e")}${counter("Grenzwellenlänge λ<sub>G</sub>", "l")}</div>`;
    const q = (s) => body.querySelector(s);
    function spec(l, lg) {
      let v = l > lg ? (1 / (l * l)) * (l / lg - 1) : 0;
      if (q("[data-k]").checked) {
        const peak = 1 / (4 * lg * lg); // Maximum des Kontinuums
        v += 2.6 * peak * Math.exp(-((l - KA) ** 2) / 4) + 1.0 * peak * Math.exp(-((l - KB) ** 2) / 4);
      }
      return v;
    }
    const s = surface(q("canvas"), 1.8, (ctx, w, h) => {
      const U = +q("[data-u]").value, lg = HC / U;
      const gx = 48, gy = h - 34, gw = w - 64, gh = h - 54;
      const X = (l) => gx + l / LMAX * gw;
      let ymax = 0;
      for (let l = 1; l <= LMAX; l += 0.25) ymax = Math.max(ymax, spec(l, lg));
      const Y = (v) => gy - v / (ymax * 1.08) * gh;
      ctx.strokeStyle = css("--grid"); ctx.lineWidth = 1;
      for (let l = 0; l <= LMAX; l += 10) { ctx.beginPath(); ctx.moveTo(X(l), gy); ctx.lineTo(X(l), gy - gh); ctx.stroke(); }
      ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy - gh - 4); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw + 4, gy); ctx.stroke();
      ctx.fillStyle = css("--muted"); ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (let l = 0; l <= LMAX; l += 20) ctx.fillText(String(l), X(l), gy + 4);
      ctx.fillText("λ in pm", gx + gw - 24, gy + 18);
      ctx.save(); ctx.translate(16, gy - gh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("Intensität", 0, 0); ctx.restore();
      ctx.strokeStyle = css("--accent-2"); ctx.lineWidth = 2; ctx.beginPath();
      for (let l = 0.5, first = true; l <= LMAX; l += 0.25) {
        const x = X(l), y = Y(spec(l, lg));
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (q("[data-k]").checked) {
        ctx.fillStyle = css("--fgeg"); ctx.font = "italic 13px Charter, Cambria, serif"; ctx.textBaseline = "bottom";
        ctx.textAlign = "left"; ctx.fillText("Kα", X(KA) + 5, Y(spec(KA, lg)) + 12);
        ctx.textAlign = "right"; ctx.fillText("Kβ", X(KB) - 5, Y(spec(KB, lg)) + 12);
      }
      if (q("[data-g]").checked) {
        ctx.strokeStyle = css("--fres"); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(X(lg), gy); ctx.lineTo(X(lg), gy - gh); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = css("--fres"); ctx.font = "600 12px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText("λG", X(lg) + 4, gy - gh);
      }
    });
    function show() {
      const U = +q("[data-u]").value;
      setCount(body, "u", U + " kV");
      setCount(body, "e", U + " keV");
      setCount(body, "l", q("[data-g]").checked ? de(HC / U, 1) + " pm" : "–");
      s.redraw();
    }
    body.querySelectorAll("input").forEach((i) => i.addEventListener("input", show));
    show();
  }

  // =====================================================================
  // 10) Röntgenfluoreszenz: gemessene Spektren und Linien der Elemente
  // =====================================================================
  function rfa(host, opts) {
    // Messungen mit Röntgenenergiedetektor (Mo-Anode, 35 kV, 1 mA, 300 s), Zählrate je Kanal
    const PROBEN = {
      kupfer: { e0: 0.1, e1: 14.7, n: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,3,2,5,7,13,16,28,34,28,39,47,44,46,35,59,46,45,36,49,49,45,49,35,48,50,46,37,47,46,40,44,48,37,34,49,52,33,43,48,38,41,43,46,52,46,50,48,41,54,43,50,48,39,43,38,44,43,40,42,49,37,45,53,37,41,43,46,41,41,53,43,53,40,42,57,43,61,46,48,38,36,39,45,42,49,48,50,52,41,42,52,47,66,54,42,86,108,175,285,450,619,819,965,1118,1132,954,737,452,280,167,99,50,63,47,78,124,119,139,171,128,112,74,48,24,16,5,5,1,0,0,1,1,0,0,0,0,1,0,0,2,1,1,1,1,0,0,1,1,0,0,0,0,1,0,0,1,0,1,1,0,0,0,1,0,0,0,1,0,1,0,1,1,1,0,2,0,1,0,0,0,1,0,0,0,0,0,1,2,1,0,2,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0] },
      wolfram: { e0: 0.1, e1: 14.7, n: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,3,0,0,1,1,1,1,1,0,0,0,0,2,1,0,1,0,0,0,1,0,2,1,1,1,2,1,3,0,2,0,1,0,2,0,0,3,1,1,1,4,4,3,3,3,1,1,2,2,1,0,2,3,3,2,2,4,0,2,2,2,8,4,4,2,0,4,3,5,7,6,10,9,5,6,5,2,2,5,5,5,10,15,16,20,17,26,41,28,29,23,24,16,19,18,10,20,39,76,105,198,294,403,453,519,486,380,305,219,139,64,42,23,15,14,8,17,19,36,70,87,172,228,319,344,386,432,450,371,281,216,168,140,90,57,49,26,9,7,4,0,3,3,0,6,1,10,13,13,18,31,26,32,37,34,24,17,20,24,16,6,6,6,5,2,1,1,1,1,1,2,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,1,0,2,2,0,2,2,0,0,0,1,0,0,0,1,0,0] },
      dollar: { e0: 0.1, e1: 14.7, n: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,2,2,2,0,1,0,1,1,1,1,0,0,2,2,1,0,2,1,4,1,1,1,2,0,4,4,1,0,3,1,1,1,1,1,2,2,3,2,1,4,3,2,2,0,4,2,3,2,3,8,2,5,11,14,23,25,41,43,71,79,80,76,58,44,39,31,26,25,39,35,14,17,22,14,10,11,13,11,16,10,17,31,37,69,68,98,108,128,153,222,315,532,761,1106,1299,1451,1458,1351,1048,745,516,329,282,272,281,356,334,369,322,299,229,226,174,114,60,31,22,21,19,13,16,15,8,14,7,4,3,3,2,1,0,0,1,0,0,0,0,0,2,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,3,0,1,1,1,0,0,1,2,1,2,1,2,1,0,0,0,0,0,0,0,1,2,0,1,0,1,0,0,0,0,0,0,1,1,0,0,0,0,1,2,0,0,1,0,1,0,0,0,0,1,0,0] },
      ilmenit: { e0: 0.1, e1: 14.7, n: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,4,7,5,11,15,26,17,23,18,28,31,30,37,29,35,40,42,29,39,40,32,39,29,36,41,44,32,36,38,35,27,38,17,36,28,26,36,50,60,78,93,124,121,144,125,113,94,77,60,69,52,36,57,38,34,39,28,29,34,38,37,41,60,51,71,86,86,106,145,197,336,430,588,765,800,870,718,612,427,275,178,131,138,159,152,164,162,139,131,78,74,63,53,27,35,34,28,24,24,18,23,31,30,31,16,24,29,28,21,31,44,28,50,27,34,24,25,23,22,12,14,15,14,15,16,23,26,19,35,35,25,33,32,23,24,25,13,21,14,12,13,16,14,22,24,20,15,9,8,12,17,12,21,23,22,28,30,28,23,22,25,30,25,28,18,27,21,19,17,15,21,13,26,21,14,24,17,22,22,19,26,21,23,14,33,25,35,42,45,47,47,50,48,43,44,30,30,35,32,22,33,22,35,24,38,35,24,25,24,25,25,21,36,32,33,29] },
      schnecke: { e0: 0.1, e1: 14.7, n: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,9,9,28,34,37,34,36,54,39,46,49,39,47,43,49,45,62,46,58,62,85,80,178,231,319,429,544,581,577,481,468,359,276,201,154,121,100,69,48,31,34,25,27,19,30,24,32,26,24,37,16,35,23,31,22,25,32,31,31,29,29,21,21,32,26,29,25,41,35,44,53,59,68,56,51,66,41,41,33,38,30,38,39,30,39,34,39,50,50,51,46,44,54,42,34,25,23,30,38,48,27,40,26,29,32,34,28,41,38,31,31,49,24,30,16,21,25,23,20,27,9,19,25,25,33,34,32,45,47,52,43,28,31,22,26,23,20,25,18,20,20,17,18,19,19,23,18,19,19,27,18,24,20,32,27,28,47,36,34,26,27,32,26,31,20,16,20,35,17,21,17,24,28,24,30,20,34,29,24,16,28,24,26,31,25,24,33,37,25,21,29,33,25,39,42,37,42,39,52,57,47,57,54,64,56,50,35,40,35,32,45,22,39,38] },
    };
    const NAMEN = { kupfer: "Kupferplättchen", wolfram: "Wolframplättchen", dollar: "1-Dollar-Münze", ilmenit: "Ilmenit (Gestein)", schnecke: "Schneckenhaus" };
    // Linienenergien in keV (K_α, K_β bzw. L_α, L_β bei Wolfram)
    const LINIEN = [
      ["Ca", 20, [["Kα", 3.69], ["Kβ", 4.01]]],
      ["Ti", 22, [["Kα", 4.51], ["Kβ", 4.93]]],
      ["Mn", 25, [["Kα", 5.90], ["Kβ", 6.49]]],
      ["Fe", 26, [["Kα", 6.40], ["Kβ", 7.06]]],
      ["Ni", 28, [["Kα", 7.48], ["Kβ", 8.26]]],
      ["Cu", 29, [["Kα", 8.04], ["Kβ", 8.91]]],
      ["Zn", 30, [["Kα", 8.64], ["Kβ", 9.57]]],
      ["W", 74, [["Lα", 8.40], ["Lβ", 9.67]]],
    ];
    const EMIN = 2, EMAX = 12;
    const body = frame(host, "Röntgenfluoreszenz", "Messdaten aus der Schulsammlung");
    body.innerHTML = `
      <div class="ctrl">
        <label>Probe <select data-p>${Object.keys(PROBEN).map((k) => `<option value="${k}">${NAMEN[k]}</option>`).join("")}</select></label>
      </div>
      <div class="ctrl">Linien einblenden: ${LINIEN.map(([sym, z], i) => `<label><input type="checkbox" data-l="${i}"> ${sym} (Z = ${z})</label>`).join("")}</div>
      <canvas aria-label="Gemessenes Röntgenspektrum: Zählrate über der Energie"></canvas>
      <div class="counts">${counter("Energie an der Zeigerposition", "e")}${counter("Zählrate", "n")}</div>`;
    const q = (s) => body.querySelector(s);
    if (opts.probe && PROBEN[opts.probe]) q("[data-p]").value = opts.probe;
    let cursor = null;
    const geo = {};
    function data() {
      const p = PROBEN[q("[data-p]").value], step = (p.e1 - p.e0) / (p.n.length - 1);
      return p.n.map((v, i) => [p.e0 + i * step, v]);
    }
    const s = surface(q("canvas"), 1.8, (ctx, w, h) => {
      const d = data().filter(([e]) => e >= EMIN && e <= EMAX);
      const gx = 52, gy = h - 34, gw = w - 66, gh = h - 54;
      const nmax = Math.max(...d.map(([, v]) => v)) * 1.12;
      const X = (e) => gx + (e - EMIN) / (EMAX - EMIN) * gw, Y = (v) => gy - v / nmax * gh;
      Object.assign(geo, { gx, gw });
      ctx.strokeStyle = css("--grid"); ctx.lineWidth = 1;
      for (let e = EMIN; e <= EMAX; e += 0.5) { ctx.beginPath(); ctx.moveTo(X(e), gy); ctx.lineTo(X(e), gy - gh); ctx.stroke(); }
      ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy - gh - 4); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw + 4, gy); ctx.stroke();
      ctx.fillStyle = css("--muted"); ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (let e = EMIN; e <= EMAX; e++) ctx.fillText(String(e), X(e), gy + 4);
      ctx.fillText("E in keV", gx + gw - 26, gy + 18);
      ctx.save(); ctx.translate(16, gy - gh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("Zählrate", 0, 0); ctx.restore();
      // eingeblendete Linien
      body.querySelectorAll("[data-l]").forEach((cb) => {
        if (!cb.checked) return;
        const [sym, , lines] = LINIEN[+cb.dataset.l];
        lines.forEach(([name, e], j) => {
          const top = gy - gh * (j ? 0.62 : 0.86);
          ctx.strokeStyle = css("--fgeg"); ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(X(e), gy); ctx.lineTo(X(e), top); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = css("--fgeg"); ctx.font = "12px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          ctx.fillText(sym + " " + name, X(e), top - 2);
        });
      });
      ctx.strokeStyle = css("--accent-2"); ctx.lineWidth = 1.8; ctx.beginPath();
      d.forEach(([e, v], i) => (i ? ctx.lineTo(X(e), Y(v)) : ctx.moveTo(X(e), Y(v))));
      ctx.stroke();
      if (cursor != null) {
        ctx.strokeStyle = css("--fres"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(cursor), gy); ctx.lineTo(X(cursor), gy - gh); ctx.stroke();
      }
    });
    function readout() {
      if (cursor == null) { setCount(body, "e", "–"); setCount(body, "n", "–"); return; }
      const near = data().reduce((a, b) => (Math.abs(b[0] - cursor) < Math.abs(a[0] - cursor) ? b : a));
      setCount(body, "e", de(cursor, 2) + " keV");
      setCount(body, "n", String(near[1]));
    }
    function point(ev) {
      const r = q("canvas").getBoundingClientRect();
      const e = EMIN + (ev.clientX - r.left - geo.gx) / geo.gw * (EMAX - EMIN);
      cursor = e >= EMIN && e <= EMAX ? e : null;
      readout(); s.redraw();
    }
    q("canvas").addEventListener("pointermove", point);
    q("canvas").addEventListener("pointerdown", point);
    body.querySelectorAll("input, select").forEach((i) => i.addEventListener("input", () => s.redraw()));
    readout();
  }

  const ALL = { mzi, doubleSlit, slit, zeiger, beugung, wellenpaket, koinzidenz, debroglie, bremsspektrum, rfa };
  document.querySelectorAll("[data-sim]").forEach((host) => {
    const fn = ALL[host.dataset.sim];
    let opts = {};
    try { opts = host.dataset.opts ? JSON.parse(host.dataset.opts) : {}; } catch (e) { /* ungültige Optionen */ }
    if (fn) fn(host, opts);
  });
  window.Sims = ALL;
})();
