/* Simulationen für Jahrgang 8 „Kräfte und Kraftwandler“ (vereinfachte Modelle, ohne externe Bibliotheken) */
(function () {
  "use strict";

  const G = 9.81; // Ortsfaktor in N/kg

  // ---------- Hilfsfunktionen ----------
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function de(x, d) { return x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function frame(host, title, note) {
    host.classList.add("sim");
    host.innerHTML = "";
    const head = el("div", { class: "sim-head" }, `${title}<span>${note || "vereinfachte Simulation"}</span>`);
    const body = el("div", { class: "sim-body" });
    host.append(head, body);
    return body;
  }
  // Canvas mit festem Seitenverhältnis, scharf auf hochauflösenden Displays
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
  function counter(label, id) { return `<div>${label}<b data-c="${id}">–</b></div>`; }
  function setCount(root, id, v) { const b = root.querySelector(`[data-c="${id}"]`); if (b) b.innerHTML = v; }

  // Kraftpfeil von (x1, y1) nach (x2, y2) mit Beschriftung an der Spitze
  function arrow(ctx, x1, y1, x2, y2, col, label, opts) {
    const o = opts || {};
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, hd = Math.min(12, len * 0.45);
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = o.width || 3; ctx.lineCap = "round";
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hd * 0.8, y2 - uy * hd * 0.8); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hd - uy * hd * 0.45, y2 - uy * hd + ux * hd * 0.45);
    ctx.lineTo(x2 - ux * hd + uy * hd * 0.45, y2 - uy * hd - ux * hd * 0.45);
    ctx.closePath(); ctx.fill();
    if (label) {
      const off = o.labelOff == null ? 16 : o.labelOff;
      let lx = x2 + ux * off + (o.side || 0) * -uy * 14, ly = y2 + uy * off + (o.side || 0) * ux * 14;
      if (o.dx != null) { lx = x2 + o.dx; ly = y2 + o.dy; } // feste Verschiebung gegenüber der Spitze
      flabel(ctx, label, lx, ly);
    }
    ctx.restore();
  }
  // Beschriftung wie „F_Zug“ oder „F_Last + F_Rolle“: kursives F mit Vektorpfeil und Index
  function flabel(ctx, txt, x, y) {
    const F = "italic 16px Charter, Cambria, serif", SUB = "12px system-ui, sans-serif", TXT = "14px system-ui, sans-serif";
    const segs = txt.split(" ").map((p) => { const m = p.match(/^(−?)F_(.+)$/); return m ? { minus: m[1], sub: m[2] } : { plain: p }; });
    const width = (sg) => {
      if (sg.plain != null) { ctx.font = TXT; return ctx.measureText(sg.plain).width; }
      ctx.font = TXT; let wd = ctx.measureText(sg.minus).width;
      ctx.font = F; wd += ctx.measureText("F").width + 1;
      ctx.font = SUB; return wd + ctx.measureText(sg.sub).width;
    };
    const total = segs.reduce((a, sg) => a + width(sg), 0) + 5 * (segs.length - 1);
    let cx = x - total / 2;
    ctx.save(); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.lineWidth = 1.2;
    segs.forEach((sg) => {
      if (sg.plain != null) { ctx.font = TXT; ctx.fillText(sg.plain, cx, y); cx += ctx.measureText(sg.plain).width + 5; return; }
      ctx.font = TXT; ctx.fillText(sg.minus, cx, y); cx += ctx.measureText(sg.minus).width;
      ctx.font = F; ctx.fillText("F", cx, y); const fw = ctx.measureText("F").width;
      ctx.beginPath(); ctx.moveTo(cx, y - 11); ctx.lineTo(cx + fw + 2, y - 11);
      ctx.moveTo(cx + fw + 2, y - 11); ctx.lineTo(cx + fw - 1, y - 13.5); ctx.moveTo(cx + fw + 2, y - 11); ctx.lineTo(cx + fw - 1, y - 8.5); ctx.stroke();
      cx += fw + 1;
      ctx.font = SUB; ctx.fillText(sg.sub, cx, y + 5); cx += ctx.measureText(sg.sub).width + 5;
    });
    ctx.restore();
  }
  function hatchLine(ctx, x1, y1, x2, y2, side) {
    // feste Wand / Decke mit Schraffur auf der Seite „side“ (Normalenrichtung)
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const nx = -uy * side, ny = ux * side;
    ctx.save(); ctx.strokeStyle = css("--fg"); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.lineWidth = 1;
    for (let t = 4; t < len; t += 8) {
      const px = x1 + ux * t, py = y1 + uy * t;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * 7 - ux * 5, py + ny * 7 - uy * 5); ctx.stroke();
    }
    ctx.restore();
  }
  // Kraftmesser (Federkraftmesser) als Röhre mit Anzeige
  function kraftmesser(ctx, x, yTop, len, value, label, left) {
    ctx.save();
    ctx.fillStyle = css("--soft"); ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(x - 7, yTop, 14, len, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) { const y = yTop + len * i / 6; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x - 2, y); ctx.stroke(); }
    const tx = left ? x - 12 : x + 12;
    ctx.fillStyle = css("--accent"); ctx.font = "600 13px system-ui, sans-serif"; ctx.textAlign = left ? "right" : "left"; ctx.textBaseline = "middle";
    ctx.fillText(de(value, 2) + " N", tx, yTop + len / 2 - 8);
    ctx.fillStyle = css("--muted"); ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(label, tx, yTop + len / 2 + 9);
    ctx.restore();
  }

  // =====================================================================
  // 1) Kräfteaddition: zwei Kraftpfeile ziehen, Kräfteparallelogramm
  // =====================================================================
  function kraefte(host, opts) {
    const body = frame(host, "Kräfteaddition", "Pfeilspitzen ziehen · Maßstab 1 Kästchen ≙ 1 N");
    body.innerHTML = `
      <canvas aria-label="Zwei Kraftpfeile mit Kräfteparallelogramm und resultierender Kraft" style="touch-action:none;cursor:crosshair"></canvas>
      <div class="ctrl">
        <label><input type="checkbox" data-par checked> Kräfteparallelogramm</label>
        <label><input type="checkbox" data-geg> Gegenkraft</label>
        <button class="btn" data-p="gleich">gleiche Richtung</button>
        <button class="btn" data-p="entgegen">entgegengesetzt</button>
        <button class="btn" data-p="hunde">Hundeschlitten</button>
      </div>
      <div class="counts">${counter("F₁", "f1")}${counter("F₂", "f2")}${counter("Winkel zwischen F₁ und F₂", "w")}${counter("F₁ + F₂ (Beträge)", "sum")}${counter("resultierende Kraft F<sub>Res</sub>", "res")}</div>`;
    const q = (s) => body.querySelector(s);
    const PRESETS = {
      gleich: [[2, 0], [3, 0]],
      entgegen: [[2.5, 0], [-3.5, 0]],
      hunde: [[3, 1.5], [3, -1.5]],
    };
    let F = (PRESETS[opts.preset] || PRESETS.hunde).map((v) => v.slice());
    let drag = -1;
    const XMIN = -5, XMAX = 7, YMAX = 3.6;
    let geo = null; // Umrechnung N → Pixel
    const s = surface(q("canvas"), 1.7, (ctx, w, h) => {
      const k = Math.min(w / (XMAX - XMIN), h / (2 * YMAX));
      const ox = -XMIN * k, oy = h / 2;
      geo = { k, ox, oy };
      const P = (v) => [ox + v[0] * k, oy - v[1] * k];
      // Karoraster
      ctx.strokeStyle = css("--grid"); ctx.lineWidth = 1;
      for (let x = ox % (k / 2); x < w; x += k / 2) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = oy % (k / 2); y < h; y += k / 2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = css("--line");
      for (let x = ox % k; x < w; x += k) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = oy % k; y < h; y += k) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const R = [F[0][0] + F[1][0], F[0][1] + F[1][1]];
      const [x0, y0] = P([0, 0]), p1 = P(F[0]), p2 = P(F[1]), pr = P(R);
      if (q("[data-par]").checked) {
        ctx.save(); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.4; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(pr[0], pr[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); ctx.restore();
        arrow(ctx, x0, y0, pr[0], pr[1], css("--fres"), "F_Res", { width: 3.5, labelOff: 24 });
      }
      if (q("[data-geg]").checked) arrow(ctx, x0, y0, x0 - (pr[0] - x0), y0 - (pr[1] - y0), css("--fgeg"), "−F_Res", { labelOff: 26 });
      arrow(ctx, x0, y0, p1[0], p1[1], css("--f1"), "F_1", { labelOff: 26 });
      arrow(ctx, x0, y0, p2[0], p2[1], css("--f1"), "F_2", { labelOff: 26 });
      // Angriffspunkt
      ctx.fillStyle = css("--fg"); ctx.beginPath(); ctx.arc(x0, y0, 4.5, 0, 7); ctx.fill();
      // Griffe an den Pfeilspitzen
      [p1, p2].forEach((p, i) => {
        ctx.strokeStyle = css("--f1"); ctx.lineWidth = drag === i ? 2.5 : 1.2;
        ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, 7); ctx.stroke();
      });
    });
    function show() {
      const a = Math.hypot(...F[0]), b = Math.hypot(...F[1]);
      const R = Math.hypot(F[0][0] + F[1][0], F[0][1] + F[1][1]);
      let ang = 0;
      if (a > 0 && b > 0) ang = Math.acos(Math.max(-1, Math.min(1, (F[0][0] * F[1][0] + F[0][1] * F[1][1]) / (a * b)))) * 180 / Math.PI;
      setCount(body, "f1", de(a, 1) + " N");
      setCount(body, "f2", de(b, 1) + " N");
      setCount(body, "w", de(ang, 0) + "°");
      setCount(body, "sum", de(a + b, 1) + " N");
      setCount(body, "res", de(R, 1) + " N");
      s.redraw();
    }
    const cv = q("canvas");
    function toN(e) {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      return [(x - geo.ox) / geo.k, (geo.oy - y) / geo.k, x, y];
    }
    cv.addEventListener("pointerdown", (e) => {
      if (!geo) return;
      const [, , x, y] = toN(e);
      let best = -1, bd = 26;
      F.forEach((v, i) => { const d = Math.hypot(geo.ox + v[0] * geo.k - x, geo.oy - v[1] * geo.k - y); if (d < bd) { bd = d; best = i; } });
      if (best < 0) return;
      drag = best; cv.setPointerCapture(e.pointerId); e.preventDefault(); s.redraw();
    });
    cv.addEventListener("pointermove", (e) => {
      if (drag < 0) return;
      const [nx, ny] = toN(e);
      F[drag] = [Math.round(Math.max(XMIN, Math.min(XMAX, nx)) * 2) / 2, Math.round(Math.max(-YMAX, Math.min(YMAX, ny)) * 2) / 2];
      show();
    });
    const end = () => { drag = -1; s.redraw(); };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    body.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => { F = PRESETS[b.dataset.p].map((v) => v.slice()); show(); }));
    q("[data-par]").addEventListener("change", show);
    q("[data-geg]").addEventListener("change", show);
    show();
  }

  // =====================================================================
  // 2) Hängende Straßenlampe: Kräftegleichgewicht
  // =====================================================================
  function lampe(host) {
    const body = frame(host, "Hängende Straßenlampe", "Pfeillängen im selben Maßstab · Seilgewicht vernachlässigt");
    body.innerHTML = `
      <canvas aria-label="Straßenlampe an zwei Seilen mit Kraftpfeilen"></canvas>
      <div class="ctrl">
        <label>Gewichtskraft F<sub>G</sub> <input type="range" min="50" max="300" step="10" value="150" data-g></label><output data-go></output>
        <label>Winkel der Seile zur Waagerechten <input type="range" min="10" max="80" step="1" value="30" data-a></label><output data-ao></output>
      </div>
      <div class="ctrl"><label><input type="checkbox" data-par checked> Kräfteparallelogramm</label></div>
      <div class="counts">${counter("linke Kraft F<sub>l</sub>", "l")}${counter("rechte Kraft F<sub>r</sub>", "r")}${counter("resultierende Kraft F<sub>Res</sub>", "res")}${counter("Gewichtskraft F<sub>G</sub>", "g")}</div>`;
    const q = (s) => body.querySelector(s);
    const val = () => ({ fg: +q("[data-g]").value, a: +q("[data-a]").value * Math.PI / 180 });
    const s = surface(q("canvas"), 1.75, (ctx, w, h) => {
      const { fg, a } = val();
      const fs = fg / (2 * Math.sin(a));
      const k = Math.min((w * 0.34) / fs, (h * 0.36) / fg); // px pro N, passt sich an den längsten Pfeil an
      const cx = w / 2, cy = h * 0.5;
      // Seile bis zu den Wänden bzw. bis zum oberen Rand
      const dx = Math.cos(a), dy = Math.sin(a);
      const tWall = (cx - 26) / dx, tTop = (cy - 14) / dy, t = Math.min(tWall, tTop);
      const ax = cx - dx * t, bx = cx + dx * t, ay = cy - dy * t;
      ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx, cy); ctx.lineTo(bx, ay); ctx.stroke();
      // Befestigung: Hauswände (senkrecht schraffiert)
      hatchLine(ctx, ax, ay - 28, ax, ay + 28, 1);
      hatchLine(ctx, bx, ay + 28, bx, ay - 28, 1);
      // Lampe
      ctx.fillStyle = css("--soft"); ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.rect(cx - 13, cy - 4, 26, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = css("--board-hl"); ctx.beginPath(); ctx.arc(cx, cy + 9, 5, 0, 7); ctx.fill();
      // Kräfte im Schwerpunkt S
      const L = fs * k, Gp = fg * k;
      const pl = [cx - dx * L, cy - dy * L], pr = [cx + dx * L, cy - dy * L];
      if (q("[data-par]").checked) {
        ctx.save(); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.3; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(pl[0], pl[1]); ctx.lineTo(cx, cy - Gp); ctx.lineTo(pr[0], pr[1]); ctx.stroke(); ctx.restore();
        arrow(ctx, cx, cy, cx, cy - Gp, css("--fres"), "F_Res", { width: 3.5, side: 2, labelOff: 0 });
      }
      arrow(ctx, cx, cy, pl[0], pl[1], css("--f1"), "F_l", { labelOff: 4, side: -1.3 });
      arrow(ctx, cx, cy, pr[0], pr[1], css("--f1"), "F_r", { labelOff: 4, side: 1.3 });
      arrow(ctx, cx, cy, cx, cy + Gp, css("--fgeg"), "F_G", { side: 1.6, labelOff: 0 });
      ctx.fillStyle = css("--fg"); ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 7); ctx.fill();
      ctx.font = "13px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.fillText("S", cx + 16, cy + 30);
    });
    function show() {
      const { fg, a } = val();
      const fs = fg / (2 * Math.sin(a));
      q("[data-go]").textContent = fg + " N";
      q("[data-ao]").textContent = q("[data-a]").value + "°";
      setCount(body, "l", de(fs, 0) + " N");
      setCount(body, "r", de(fs, 0) + " N");
      setCount(body, "res", de(fg, 0) + " N");
      setCount(body, "g", de(fg, 0) + " N");
      s.redraw();
    }
    body.querySelectorAll("input").forEach((i) => i.addEventListener("input", show));
    show();
  }

  // =====================================================================
  // 3) Schraubenfeder: Massestücke anhängen, Diagramm, Federkonstante
  // =====================================================================
  function feder(host, opts) {
    // Messreihen wie im Unterricht (Feder 1: Klassenmessung, Feder 2 und 3: Arbeitsblatt)
    const FEDERN = [
      { name: "Feder 1 (unsere Messung)", ds: [0, 2, 3, 4.5, 6], D: 0.327 },
      { name: "Feder 2", ds: [0, 0.8, 1.5, 2.2, 2.9], D: 0.676 },
      { name: "Feder 3", ds: [0, 2.8, 5.6, 8.1, 10.9], D: 0.18 },
      { name: "unbekannte Feder", ds: null, D: 0 },
    ];
    const F1 = 0.05 * G; // ein Massestück 50 g
    const NMAX = 6;
    const body = frame(host, "Schraubenfeder", "Massestück 50 g · g = 9,81 N/kg");
    body.innerHTML = `
      <div class="ctrl">
        <label>Feder <select data-f>${FEDERN.map((f, i) => `<option value="${i}">${f.name}</option>`).join("")}</select></label>
        <button class="btn" data-minus>− Massestück</button>
        <button class="btn primary" data-plus>+ Massestück</button>
        <label><input type="checkbox" data-fit> Gerade und Steigungsdreieck</label>
      </div>
      <canvas aria-label="Feder mit Massestücken und F-Δs-Diagramm"></canvas>
      <div class="counts">${counter("Anzahl Massestücke n", "n")}${counter("Gewichtskraft F", "f")}${counter("Verlängerung Δs", "s")}${counter("Federkonstante D = ΔF / Δs", "d")}</div>`;
    const q = (s) => body.querySelector(s);
    let fi = Math.max(0, Math.min(3, opts.feder || 0)), n = 0, unknown = null;
    let pts = {}; // gemessene Punkte n → Δs
    function dsOf(i, m) {
      const f = FEDERN[i];
      if (f.ds && m < f.ds.length) return f.ds[m];
      const D = f.ds ? f.D : unknown;
      if (m === 0) return 0;
      // kleine Messabweichung, auf mm gerundet
      const noise = f.ds ? 0 : (Math.sin(m * 12.9898 + D * 78.233) * 43758.5453 % 1) * 0.15;
      return Math.round((m * F1 / D + noise) * 10) / 10;
    }
    function newUnknown() { unknown = Math.round((0.25 + Math.random() * 0.6) * 100) / 100; }
    // höchstens so viele Massestücke, dass die Verlängerung auf den Maßstab (12 cm) passt
    function nmax() { let m = NMAX; while (m > 0 && dsOf(fi, m) > 12) m--; return m; }
    newUnknown();
    function fitD() {
      // wie im Unterricht: Gerade durch den Ursprung und den letzten Messpunkt (größtes Steigungsdreieck)
      const m = Math.max(...Object.keys(pts).map(Number));
      return m > 0 && pts[m] > 0 ? m * F1 / pts[m] : 0;
    }
    const s = surface(q("canvas"), 1.6, (ctx, w, h) => {
      const ds = dsOf(fi, n);
      // --- links: Stativ mit Feder und Maßstab (bis 12 cm Verlängerung)
      const lx = Math.max(46, w * 0.12), top = 18, mh = Math.max(5, h * 0.026), L0 = h * 0.17;
      const cmPx = Math.min((h - top - L0 - 8 - NMAX * mh - 12) / 12, w * 0.024);
      hatchLine(ctx, lx - 40, top, lx + 40, top, -1);
      const Ls = L0 + ds * cmPx; // Ruhelänge plus Verlängerung
      const coils = 14, amp = 9;
      ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(lx, top);
      ctx.lineTo(lx, top + 8);
      for (let i = 0; i <= coils; i++) ctx.lineTo(lx + (i % 2 ? amp : -amp) * (i === 0 || i === coils ? 0 : 1), top + 8 + (Ls - 16) * i / coils);
      ctx.lineTo(lx, top + Ls); ctx.stroke();
      // Aufhängung und Massestücke
      let y = top + Ls;
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y + 8); ctx.stroke(); y += 8;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = css("--soft"); ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.rect(lx - 14, y, 28, mh); ctx.fill(); ctx.stroke(); y += mh;
      }
      if (n > 0) arrow(ctx, lx - 26, y - n * mh / 2, lx - 26, y - n * mh / 2 + Math.min(h - y + n * mh / 2 - 6, n * F1 * h * 0.07), css("--fgeg"), "F_G", { side: 1.6, labelOff: -8 });
      // Maßstab (Nullpunkt = Federende ohne Massestücke)
      const rx = lx + 30, r0 = top + L0;
      ctx.strokeStyle = css("--muted"); ctx.fillStyle = css("--muted"); ctx.lineWidth = 1; ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.beginPath(); ctx.moveTo(rx, r0); ctx.lineTo(rx, r0 + 12 * cmPx); ctx.stroke();
      for (let c = 0; c <= 12; c++) {
        const yy = r0 + c * cmPx; ctx.beginPath(); ctx.moveTo(rx, yy); ctx.lineTo(rx + (c % 2 ? 4 : 8), yy); ctx.stroke();
        if (c % 2 === 0) ctx.fillText(String(c), rx + 11, yy);
      }
      ctx.strokeStyle = css("--accent-2"); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(lx + 10, top + Ls); ctx.lineTo(rx + 8, top + Ls); ctx.stroke(); ctx.setLineDash([]);
      // --- rechts: Diagramm F über Δs
      const gx = w * 0.42, gy = h - 34, gw = w * 0.54, gh = h - 62;
      const SX = 12, SY = NMAX * F1 * 1.05; // cm, N
      const X = (v) => gx + v / SX * gw, Y = (v) => gy - v / SY * gh;
      ctx.strokeStyle = css("--grid"); ctx.lineWidth = 1;
      for (let v = 0; v <= SX; v++) { ctx.beginPath(); ctx.moveTo(X(v), gy); ctx.lineTo(X(v), gy - gh); ctx.stroke(); }
      for (let v = 0; v <= SY; v += 0.25) { ctx.beginPath(); ctx.moveTo(gx, Y(v)); ctx.lineTo(gx + gw, Y(v)); ctx.stroke(); }
      ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy - gh - 6); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw + 6, gy); ctx.stroke();
      ctx.fillStyle = css("--muted"); ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (let v = 0; v <= SX; v += 2) ctx.fillText(String(v), X(v), gy + 4);
      ctx.fillText("Δs in cm", gx + gw - 26, gy + 18);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (let v = 0; v <= SY; v += 0.5) ctx.fillText(de(v, 1), gx - 5, Y(v));
      ctx.textAlign = "left"; ctx.fillText("F in N", gx + 6, gy - gh - 2);
      const D = fitD(), keys = Object.keys(pts).map(Number);
      if (q("[data-fit]").checked && D > 0 && keys.length > 1) {
        const sEnd = Math.min(SX, SY / D);
        ctx.strokeStyle = css("--accent-2"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(sEnd), Y(D * sEnd)); ctx.stroke();
        // Steigungsdreieck bis zum größten Messpunkt
        const nm = Math.max(...keys), sm = pts[nm], fm = nm * F1;
        ctx.strokeStyle = css("--fres"); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(sm), Y(0)); ctx.lineTo(X(sm), Y(fm)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = css("--fres"); ctx.font = "600 12px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText("Δs = " + de(sm, 1) + " cm", X(sm / 2), Y(0) - 3);
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText("ΔF = " + de(fm, 2) + " N", X(sm) + 5, Y(fm / 2));
      }
      ctx.fillStyle = css("--f1"); ctx.font = "15px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      keys.forEach((m) => ctx.fillText("×", X(pts[m]), Y(m * F1)));
    });
    function show() {
      const ds = dsOf(fi, n);
      pts[n] = ds;
      setCount(body, "n", String(n));
      setCount(body, "f", de(n * F1, 2) + " N");
      setCount(body, "s", de(ds, 1) + " cm");
      const D = fitD();
      setCount(body, "d", q("[data-fit]").checked && Object.keys(pts).length > 1 ? de(D, 2) + " N/cm" : "–");
      q("[data-minus]").disabled = n === 0;
      q("[data-plus]").disabled = n >= nmax();
      s.redraw();
    }
    q("[data-f]").value = fi;
    q("[data-f]").addEventListener("change", () => { fi = +q("[data-f]").value; n = 0; pts = {}; if (fi === 3) newUnknown(); show(); });
    q("[data-plus]").addEventListener("click", () => { if (n < nmax()) n++; show(); });
    q("[data-minus]").addEventListener("click", () => { if (n > 0) n--; show(); });
    q("[data-fit]").addEventListener("change", show);
    show();
  }

  // =====================================================================
  // 4) Feste und lose Rolle: Kräfte und Wege
  // =====================================================================
  function rolle(host, opts) {
    const GR = 0.32; // Gewichtskraft der Rolle in N
    const body = frame(host, "Feste und lose Rolle", "Reibung vernachlässigt · Rolle 0,32 N");
    body.innerHTML = `
      <div class="ctrl">
        <label><input type="radio" value="fest" data-m> feste Rolle</label>
        <label><input type="radio" value="lose" data-m> lose Rolle</label>
      </div>
      <div class="ctrl">
        <label>Masse der Last <input type="range" min="50" max="200" step="10" value="70" data-ml></label><output data-mo></output>
        <label>Seil ziehen s<sub>Zug</sub> <input type="range" min="0" max="30" step="1" value="0" data-s></label><output data-so></output>
      </div>
      <canvas aria-label="Rolle mit Last und zwei Kraftmessern"></canvas>
      <div class="counts">${counter("Lastkraft F<sub>Last</sub>", "fl")}${counter("Zugkraft F<sub>Zug</sub>", "fz")}${counter("Kraft am Haken F<sub>Haken</sub>", "fh")}${counter("Zugweg s<sub>Zug</sub>", "sz")}${counter("Hubhöhe s<sub>Last</sub>", "sl")}${counter("F<sub>Zug</sub> · s<sub>Zug</sub>", "pz")}${counter("F<sub>Last</sub> · s<sub>Last</sub>", "pl")}</div>`;
    const q = (s) => body.querySelector(s);
    const radios = body.querySelectorAll("[data-m]");
    const nm = "rolle" + Math.random().toString(36).slice(2);
    radios.forEach((r) => { r.name = nm; });
    (opts.mode === "lose" ? radios[1] : radios[0]).checked = true;
    if (opts.fixed) radios.forEach((r) => { r.closest("label").style.display = r.checked ? "" : "none"; r.disabled = true; });
    const mode = () => body.querySelector("[data-m]:checked").value;
    function vals() {
      const m = +q("[data-ml]").value / 1000, sz = +q("[data-s]").value;
      const gl = m * G;
      if (mode() === "fest") return { lose: false, fl: gl, fz: gl, fh: 2 * gl + GR, sz, sl: sz };
      const last = gl + GR;
      return { lose: true, fl: last, fz: last / 2, fh: last / 2, sz, sl: sz / 2, gl };
    }
    const s = surface(q("canvas"), 1.3, (ctx, w, h) => {
      const v = vals(), cm = h / 130, R = Math.max(16, h * 0.06);
      const showF = true, fk = h * 0.1; // px pro N für Pfeile
      ctx.lineCap = "round";
      hatchLine(ctx, w * 0.2, 16, w * 0.8, 16, -1);
      const cx = w * 0.5;
      if (!v.lose) {
        // Rolle am Haken (mit Kraftmesser) an der Decke
        kraftmesser(ctx, cx, 16, h * 0.16, v.fh, "Haken");
        const cy = 16 + h * 0.16 + 10 + R;
        ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx, cy - R - 10); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.fillStyle = css("--soft"); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = css("--fg"); ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
        // Seil: links Zugseite (Kraftmesser), rechts Last
        const yZ = cy + h * 0.12 + v.sz * cm, yL = cy + h * 0.42 - v.sl * cm;
        ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(cx - R, yZ); ctx.lineTo(cx - R, cy); ctx.arc(cx, cy, R, Math.PI, 0); ctx.lineTo(cx + R, yL); ctx.stroke();
        kraftmesser(ctx, cx - R, yZ, h * 0.14, v.fz, "Zug", true);
        // Last
        ctx.fillStyle = css("--soft"); ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.rect(cx + R - 16, yL, 32, 26); ctx.fill(); ctx.stroke();
        ctx.fillStyle = css("--fg"); ctx.font = "12px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Last", cx + R, yL + 13);
        if (showF) {
          arrow(ctx, cx + R, yL + 26, cx + R, yL + 26 + v.fl * fk, css("--fgeg"), "F_Last", { dx: 34, dy: -v.fl * fk / 2 });
          const ye = yZ + h * 0.14;
          arrow(ctx, cx - R, ye, cx - R, ye + v.fz * fk, css("--f1"), "F_Zug", { dx: -34, dy: -v.fz * fk / 2 });
        }
        // Wege markieren
        ctx.strokeStyle = css("--accent-2"); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        const yL0 = cy + h * 0.42, yZ0 = cy + h * 0.12;
        ctx.beginPath(); ctx.moveTo(cx + R + 20, yL0); ctx.lineTo(cx + R + 60, yL0); ctx.moveTo(cx - R - 60, yZ0); ctx.lineTo(cx - R - 20, yZ0); ctx.stroke(); ctx.setLineDash([]);
      } else {
        // lose Rolle: Seil vom Haken-Kraftmesser (links) um die Rolle zum Zug-Kraftmesser (rechts, nach oben gezogen)
        const kmL = h * 0.16;
        kraftmesser(ctx, cx - R, 16, kmL, v.fh, "Haken", true);
        const yTop = 16 + kmL + 6;
        const cy = h * 0.62 - v.sl * cm;
        const yZ = h * 0.4 - v.sz * cm, kmZ = h * 0.13; // unteres Ende des Zug-Kraftmessers
        ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(cx - R, yTop); ctx.lineTo(cx - R, cy); ctx.arc(cx, cy, R, Math.PI, 0, true); ctx.lineTo(cx + R, yZ); ctx.stroke();
        kraftmesser(ctx, cx + R, yZ - kmZ, kmZ, v.fz, "Zug");
        ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.4; ctx.fillStyle = css("--soft");
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = css("--fg"); ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + R + 10); ctx.stroke();
        ctx.fillStyle = css("--soft"); ctx.beginPath(); ctx.rect(cx - 16, cy + R + 10, 32, 26); ctx.fill(); ctx.stroke();
        ctx.fillStyle = css("--fg"); ctx.font = "12px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Last", cx, cy + R + 23);
        if (showF) {
          const yb = cy + R + 36;
          arrow(ctx, cx, yb, cx, yb + v.fl * fk, css("--fgeg"), "F_Last + F_Rolle", { dx: 72, dy: -v.fl * fk / 2 });
          arrow(ctx, cx - R - 10, cy, cx - R - 10, cy - v.fh * fk, css("--f1"), "F_Haken", { dx: -36, dy: v.fh * fk / 2 });
          arrow(ctx, cx + R + 10, cy, cx + R + 10, cy - v.fz * fk, css("--f1"), "F_Zug", { dx: 30, dy: v.fz * fk / 2 });
        }
        ctx.strokeStyle = css("--accent-2"); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        const c0 = h * 0.62;
        ctx.beginPath(); ctx.moveTo(cx - 44, c0); ctx.lineTo(cx - 22, c0); ctx.stroke(); ctx.setLineDash([]);
      }
    });
    function show() {
      const v = vals();
      q("[data-mo]").textContent = q("[data-ml]").value + " g";
      q("[data-so]").textContent = v.sz + " cm";
      setCount(body, "fl", de(v.fl, 2) + " N");
      setCount(body, "fz", de(v.fz, 2) + " N");
      setCount(body, "fh", de(v.fh, 2) + " N");
      setCount(body, "sz", de(v.sz, 1) + " cm");
      setCount(body, "sl", de(v.sl, 1) + " cm");
      setCount(body, "pz", de(v.fz * v.sz / 100, 3) + " N·m");
      setCount(body, "pl", de(v.fl * v.sl / 100, 3) + " N·m");
      s.redraw();
    }
    body.querySelectorAll("input").forEach((i) => i.addEventListener("input", show));
    radios.forEach((r) => r.addEventListener("change", show));
    show();
  }

  // =====================================================================
  // 5) Schiefe Ebene: Hangabtriebskraft, Zugkraft, Goldene Regel
  // =====================================================================
  function schiefeEbene(host, opts) {
    const GW = 1.36, S = 1.0; // Wagen mit Halterung in N, Schienenlänge in m
    const body = frame(host, "Schiefe Ebene", "Schiene 1,00 m · Wagen 1,36 N · Reibung vernachlässigt");
    body.innerHTML = `
      <div class="ctrl">
        <label>Höhe h <input type="range" min="0.05" max="0.6" step="0.01" value="0.2" data-h></label><output data-ho></output>
        <label>aufgelegte Masse m <input type="range" min="0" max="200" step="50" value="100" data-m></label><output data-mo></output>
      </div>
      <div class="ctrl">
        <label><input type="checkbox" data-par ${opts.parallelogramm ? "checked" : ""}> Gewichtskraft zerlegen (Normalkraft, Hangabtriebskraft)</label>
      </div>
      <canvas aria-label="Wagen auf einer schiefen Ebene mit Kraftpfeilen"></canvas>
      <div class="counts">${counter("Gesamtgewicht G", "g")}${counter("Zugkraft F<sub>Zug</sub>", "fz")}${counter("F<sub>Zug</sub> : G", "r1")}${counter("h : s", "r2")}${counter("G · h", "gh")}${counter("F<sub>Zug</sub> · s<sub>Zug</sub>", "fs")}</div>`;
    const q = (s) => body.querySelector(s);
    function vals() {
      const h = +q("[data-h]").value, m = +q("[data-m]").value / 1000;
      const g = GW + m * G, fz = g * h / S;
      return { h, m, g, fz, a: Math.asin(h / S) };
    }
    const s = surface(q("canvas"), 1.75, (ctx, w, hh) => {
      const v = vals();
      const y0 = hh * 0.6, L = Math.min(w * 0.7, (y0 - 24) / 0.6), x0 = (w - L) / 2 - 20;
      const dx = Math.cos(v.a), dy = Math.sin(v.a);
      const x1 = x0 + L * dx, y1 = y0 - L * dy;
      // Boden und Keil
      hatchLine(ctx, 10, y0, w - 10, y0, 1);
      ctx.fillStyle = css("--soft"); ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1, y0); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Höhe h und Weg s
      ctx.strokeStyle = css("--accent-2"); ctx.fillStyle = css("--accent-2"); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x1 + 14, y0); ctx.lineTo(x1 + 14, y1); ctx.stroke();
      ctx.font = "italic 14px Charter, Cambria, serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText("h = " + de(v.h, 2) + " m", x1 + 20, (y0 + y1) / 2);
      // Wagen in der Mitte der Schiene
      const t = L * 0.5, bx = x0 + t * dx, by = y0 - t * dy;
      const nx = -dy, ny = -dx; // Normale (nach oben vom Hang weg) in Bildkoordinaten
      const cw = 46, chh = 22;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-v.a);
      ctx.fillStyle = css("--bg"); ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(-cw / 2, -chh - 8, cw, chh); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-cw / 2 + 9, -4, 4, 0, 7); ctx.arc(cw / 2 - 9, -4, 4, 0, 7); ctx.stroke();
      ctx.restore();
      const sx = bx + nx * 19, sy = by + ny * 19; // Schwerpunkt
      // Seil zum Kraftmesser am oberen Ende
      ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(sx + dx * cw / 2, sy - dy * cw / 2); ctx.lineTo(x1 - 30 * dx + nx * 19, y1 + 30 * dy + ny * 19); ctx.stroke();
      // Kräfte
      const k = (hh * 0.42) / 3.4;
      const gp = v.g * k, fn = v.g * Math.cos(v.a) * k, fh = v.g * Math.sin(v.a) * k;
      if (q("[data-par]").checked) {
        const pN = [sx + nx * fn, sy + ny * fn], pH = [sx - dx * fh, sy + dy * fh];
        ctx.save(); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(pN[0], pN[1]); ctx.lineTo(sx, sy + gp); ctx.moveTo(pH[0], pH[1]); ctx.lineTo(sx, sy + gp); ctx.stroke(); ctx.restore();
        arrow(ctx, sx, sy, pN[0], pN[1], css("--fn"), "F_N", { side: -1.2 });
        arrow(ctx, sx, sy, pH[0], pH[1], css("--fres"), "F_H", { side: 1.2 });
      }
      arrow(ctx, sx, sy, sx, sy + gp, css("--fgeg"), "F_G", { side: 1.6, labelOff: 0 });
      arrow(ctx, sx, sy, sx + dx * v.fz * k, sy - dy * v.fz * k, css("--f1"), "F_Zug", { side: -1.3 });
      ctx.fillStyle = css("--fg"); ctx.beginPath(); ctx.arc(sx, sy, 3, 0, 7); ctx.fill();
      // Strecke s entlang der Schiene
      ctx.fillStyle = css("--muted"); ctx.font = "13px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.save(); ctx.translate(x0 + L * 0.25 * dx - nx * 14, y0 - L * 0.25 * dy - ny * 14); ctx.rotate(-v.a);
      ctx.fillText("s = 1,00 m", 0, 0); ctx.restore();
    });
    function show() {
      const v = vals();
      q("[data-ho]").textContent = de(v.h, 2) + " m";
      q("[data-mo]").textContent = (v.m * 1000) + " g";
      setCount(body, "g", de(v.g, 2) + " N");
      setCount(body, "fz", de(v.fz, 2) + " N");
      setCount(body, "r1", de(v.fz / v.g, 2));
      setCount(body, "r2", de(v.h / S, 2));
      setCount(body, "gh", de(v.g * v.h, 2) + " N·m");
      setCount(body, "fs", de(v.fz * S, 2) + " N·m");
      s.redraw();
    }
    body.querySelectorAll("input").forEach((i) => i.addEventListener("input", show));
    show();
  }

  const ALL = { kraefte, lampe, feder, rolle, schiefeEbene };
  document.querySelectorAll("[data-sim]").forEach((host) => {
    const fn = ALL[host.dataset.sim];
    let opts = {};
    try { opts = host.dataset.opts ? JSON.parse(host.dataset.opts) : {}; } catch (e) { /* ungültige Optionen */ }
    if (fn) fn(host, opts);
  });
  window.SimsKraft = ALL;
})();
