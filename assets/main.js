/* Gemeinsame Bausteine aller Lernseiten: Navigation, Formeln, Versuche, Operatoren */
(function () {
  "use strict";

  // Einheiten mit ihren Konzepten und Kapiteln (Ordner relativ zur Startseite)
  const UNITS = {
    q13: {
      name: "Quantenobjekte",
      year: "Jahrgang 13",
      dir: "jg13/quantenobjekte/",
      concepts: [
        { short: "Wellencharakter", title: "Wellencharakter von Quantenobjekten", chapters: [
          ["1-1-elektronenbeugung.html", "Elektronenbeugung und de Broglie"],
          ["1-2-neutronen-fullerene.html", "Neutronen und Fullerene"],
        ] },
        { short: "Stochastische Deutung", title: "Stochastische Deutung", chapters: [
          ["2-1-einzelne-elektronen.html", "Einzelne Elektronen am Doppelspalt"],
          ["2-2-einzelne-photonen.html", "Einzelne Photonen"],
        ] },
        { short: "Komplementarität", title: "Komplementarität und Nichtlokalität", chapters: [
          ["3-1-mach-zehnder.html", "Das Mach-Zehnder-Interferometer"],
          ["3-2-quantenradierer.html", "Der Quantenradierer"],
        ] },
        { short: "Unbestimmtheit", title: "Unbestimmtheit", chapters: [
          ["4-1-einzelspalt.html", "Ein Photon im Spalt lokalisieren"],
          ["4-2-mehrfachspalt.html", "Unbestimmtheit am Mehrfachspalt"],
          ["4-3-wellenpakete.html", "Wellenpakete"],
        ] },
        { short: "Quantisierung", title: "Quantisierung der Photonenenergie", chapters: [
          ["5-1-hallwachs.html", "Der Hallwachs-Versuch"],
          ["5-2-fotozelle.html", "Fotoeffekt an der Vakuum-Fotozelle"],
          ["5-3-led.html", "Leuchtdiode als Photonenquelle"],
          ["5-4-roentgenbremsspektrum.html", "Das Röntgenbremsspektrum"],
          ["5-5-roentgenfluoreszenz.html", "Röntgenfluoreszenz"],
        ] },
      ],
    },
    k8: {
      name: "Kräfte und Kraftwandler",
      year: "Jahrgang 8",
      dir: "jg08/kraft/",
      concepts: [
        { short: "Kräfte darstellen", title: "Kräfte darstellen und addieren", chapters: [
          ["1-1-kraftpfeil.html", "Kraftpfeil und Kräfteaddition"],
          ["1-2-kraeftegleichgewicht.html", "Kräftegleichgewicht"],
        ] },
        { short: "Federn", title: "Federn und das Hookesche Gesetz", chapters: [
          ["2-1-federkonstante.html", "Die Federkonstante"],
          ["2-2-hookesches-gesetz.html", "Das Hookesche Gesetz anwenden"],
          ["2-3-grenzen-hooke.html", "Grenzen des Hookeschen Gesetzes"],
        ] },
        { short: "Kraftwandler", title: "Kraftwandler", chapters: [
          ["3-1-feste-rolle.html", "Die feste Rolle"],
          ["3-2-lose-rolle.html", "Die lose Rolle"],
          ["3-3-schiefe-ebene.html", "Schiefe Ebene und Goldene Regel"],
          ["3-4-kraftwandler-vergleich.html", "Kraftwandler im Vergleich"],
        ] },
        { short: "Wechselwirkung", title: "Kraft und Gegenkraft", chapters: [
          ["4-1-kraft-gegenkraft.html", "Kraft und Gegenkraft"],
        ] },
        { short: "Klassenarbeit", title: "Vorbereitung auf die Klassenarbeit", chapters: [
          ["5-1-uebung.html", "Übung: Ersatzkraft und Goldene Regel"],
          ["5-2-selbsttest.html", "Selbsttest"],
        ] },
      ],
    },
  };

  // Operatoren mit Kurzdefinition (nach der Operatorenliste für das Fach Physik)
  const OPERATORS = {
    "abschätzen": "Durch begründete Überlegungen Größenordnungen physikalischer Größen angeben.",
    "angeben": "Objekte, Sachverhalte, Begriffe, Daten ohne nähere Erläuterungen und Begründungen aufzählen.",
    "aufstellen": "Eine begründete Vermutung formulieren, die sich überprüfen lässt.",
    "auswerten": "Daten, Einzelergebnisse oder sonstige Elemente in einen Zusammenhang stellen und gegebenenfalls zu einer Gesamtaussage zusammenführen.",
    "begründen": "Einen angegebenen Sachverhalt auf Regeln, Gesetzmäßigkeiten bzw. kausale Zusammenhänge zurückführen.",
    "benennen": "Elemente, Sachverhalte, Begriffe, Daten ohne Erläuterungen aufzählen.",
    "berechnen": "Numerische Ergebnisse von einem Ansatz ausgehend gewinnen.",
    "bewerten": "Eine eigene Position nach ausgewiesenen Normen und Werten vertreten.",
    "beschreiben": "Strukturen, Sachverhalte oder Zusammenhänge strukturiert und fachsprachlich richtig mit eigenen Worten wiedergeben.",
    "bestätigen": "Eine Aussage oder einen Zusammenhang anhand von Messwerten oder Überlegungen als zutreffend nachweisen.",
    "bestimmen": "Einen Lösungsweg darstellen und das Ergebnis formulieren.",
    "beurteilen": "Zu einem Sachverhalt eine selbstständige Einschätzung nach fachwissenschaftlichen und fachmethodischen Kriterien formulieren.",
    "darstellen": "Sachverhalte, Zusammenhänge, Methoden und Bezüge in angemessenen Kommunikationsformen strukturiert wiedergeben.",
    "deuten": "Sachverhalte in einen Erklärungszusammenhang bringen.",
    "ergänzen": "Fehlende Teile eines Satzes, einer Tabelle oder einer Zeichnung sinnvoll vervollständigen.",
    "erklären": "Einen Sachverhalt mithilfe eigener Kenntnisse in einen Zusammenhang stellen (z. B. Theorie, Modell, Gesetz, Regel).",
    "erläutern": "Einen Sachverhalt veranschaulichend darstellen und durch zusätzliche Informationen verständlich machen.",
    "ermitteln": "Einen Zusammenhang oder eine Lösung finden und das Ergebnis formulieren.",
    "herleiten": "Aus Größengleichungen durch mathematische Operationen eine physikalische Größe freistellen.",
    "interpretieren": "Sachverhalte, Phänomene oder Ergebnisse auf Erklärungsmöglichkeiten untersuchen und diese gegeneinander abwägend darstellen.",
    "nennen": "Elemente, Sachverhalte, Begriffe, Daten ohne Erläuterungen aufzählen.",
    "prüfen": "Sachverhalte oder Aussagen an Fakten oder innerer Logik messen und eventuelle Widersprüche aufdecken.",
    "skizzieren": "Sachverhalte, Strukturen oder Ergebnisse auf das Wesentliche reduziert übersichtlich darstellen.",
    "überprüfen": "Sachverhalte oder Aussagen an Fakten oder innerer Logik messen und eventuelle Widersprüche aufdecken.",
    "untersuchen": "Sachverhalte nach bestimmten, fachlich begründeten Kriterien erschließen.",
    "unterscheiden": "Sachverhalte anhand eines Merkmals voneinander abgrenzen.",
    "vergleichen": "Gemeinsamkeiten und Unterschiede herausarbeiten.",
    "zeichnen": "Eine möglichst exakte grafische Darstellung beobachtbarer oder gegebener Strukturen anfertigen.",
    "zuordnen": "Begriffe, Gegenstände oder Beispiele begründet einer vorgegebenen Gruppe oder Kategorie zuweisen.",
  };

  const body = document.body;
  const root = body.dataset.root || ".";
  const here = location.pathname.split("/").pop() || "index.html";
  const unit = UNITS[body.dataset.unit];

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* privat */ } }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  // ---------- Hell/Dunkel ----------
  const THEMES = [["auto", "Auto"], ["light", "Hell"], ["dark", "Dunkel"]];
  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    document.dispatchEvent(new CustomEvent("themechange"));
  }
  applyTheme(load("phy-theme") || "auto");

  // ---------- Kopf- und Fußzeile ----------
  function findChapter() {
    if (!unit) return null;
    for (let c = 0; c < unit.concepts.length; c++) {
      const i = unit.concepts[c].chapters.findIndex(([f]) => f === here);
      if (i >= 0) return { c, i };
    }
    return null;
  }
  const pos = findChapter();

  function buildHeader() {
    const h = document.createElement("header");
    h.className = "site";
    let nav = "";
    if (unit) {
      nav = unit.concepts.map((k, c) => {
        const first = k.chapters[0];
        const href = first ? first[0] : "index.html#k" + (c + 1);
        const cur = pos && pos.c === c ? ' aria-current="page"' : "";
        return `<a href="${href}"${cur}${first ? "" : ' class="later"'}><span class="n">${c + 1}</span>${k.short}</a>`;
      }).join("");
    }
    h.innerHTML = `<div class="wrap"><div class="top">
      <a class="brand" href="${root}/index.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="20" cy="12" r="2.4" fill="var(--laser)"/></svg>Physik</a>
      ${unit ? `<a class="unit" href="index.html">${unit.year} · ${unit.name}</a>` : ""}
      <button class="theme" type="button" title="Farbschema wechseln"></button>
      </div>${unit ? `<nav aria-label="Konzepte">${nav}</nav>` : ""}</div>`;
    body.prepend(h);
    // auf schmalen Bildschirmen das aktuelle Konzept in der Leiste sichtbar machen
    const navEl = h.querySelector("nav"), cur = h.querySelector("nav a[aria-current]");
    if (navEl && cur) navEl.scrollLeft = cur.getBoundingClientRect().left - navEl.getBoundingClientRect().left - 16;

    const btn = h.querySelector(".theme");
    const label = () => {
      const t = load("phy-theme") || "auto";
      btn.textContent = THEMES.find(([k]) => k === t)[1];
    };
    btn.addEventListener("click", () => {
      const t = load("phy-theme") || "auto";
      const next = THEMES[(THEMES.findIndex(([k]) => k === t) + 1) % THEMES.length][0];
      store("phy-theme", next);
      applyTheme(next);
      label();
    });
    label();

    const f = document.createElement("footer");
    f.className = "site";
    f.innerHTML = `<div class="wrap">Lernmaterial Physik · Inhalte nach dem Unterricht von J. Tormöhlen</div>`;
    body.append(f);
  }

  // Kapitel-Leiste unter dem Kicker und Blättern am Seitenende
  function buildChapterNav() {
    if (!pos) return;
    const concept = unit.concepts[pos.c];
    const main = document.querySelector("main .wrap");
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = `Konzept ${pos.c + 1} · ${concept.title}`;
    main.prepend(kicker);

    if (concept.chapters.length > 1) {
      const strip = document.createElement("nav");
      strip.className = "chapters-strip";
      strip.setAttribute("aria-label", "Kapitel dieses Konzepts");
      strip.innerHTML = concept.chapters.map(([f, t], i) =>
        `<a href="${f}"${i === pos.i ? ' aria-current="page"' : ""}>${pos.c + 1}.${i + 1} ${t}</a>`).join("");
      const h1 = main.querySelector("h1");
      h1.before(strip);
    }

    const flat = [];
    unit.concepts.forEach((k, c) => k.chapters.forEach(([f, t], i) => flat.push({ f, t, nr: `${c + 1}.${i + 1}` })));
    const idx = flat.findIndex((x) => x.f === here);
    const prev = flat[idx - 1], next = flat[idx + 1];
    const pager = document.createElement("nav");
    pager.className = "pager";
    pager.setAttribute("aria-label", "Blättern");
    pager.innerHTML =
      (prev ? `<a href="${prev.f}"><small>← ${prev.nr}</small>${prev.t}</a>` : `<a href="index.html"><small>←</small>Übersicht</a>`) +
      (next ? `<a class="next" href="${next.f}"><small>${next.nr} →</small>${next.t}</a>` : `<a class="next" href="index.html"><small>→</small>Übersicht</a>`);
    main.append(pager);
  }

  // ---------- Formeln ----------
  function renderMath(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el || body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    }
  }

  // ---------- Operatoren ----------
  function initOperators() {
    document.querySelectorAll(".op").forEach((el) => {
      // Infinitiv („erläutern“) oder Imperativ („Erläutere“) – beides wird gefunden
      let key = (el.dataset.op || el.textContent).trim().toLowerCase();
      // berechne → berechnen, erläutere → erläutern, ermittle → ermitteln
      const forms = [key, key + "n", key.replace(/e([lr])e$/, "e$1n"), key.replace(/([lr])e$/, "e$1n")];
      key = forms.find((f) => OPERATORS[f]) || key;
      const def = OPERATORS[key];
      if (!def) return;
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-expanded", "false");
      const d = document.createElement("span");
      d.className = "def";
      d.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ": " + def;
      el.append(d);
    });
    const toggle = (op) => {
      document.querySelectorAll('.op[aria-expanded="true"]').forEach((o) => { if (o !== op) o.setAttribute("aria-expanded", "false"); });
      if (op) op.setAttribute("aria-expanded", op.getAttribute("aria-expanded") === "true" ? "false" : "true");
    };
    document.addEventListener("click", (e) => toggle(e.target.closest(".op[aria-expanded]")));
    document.addEventListener("keydown", (e) => {
      const op = e.target.closest && e.target.closest(".op[aria-expanded]");
      if (op && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(op); }
      if (e.key === "Escape") toggle(null);
    });
  }

  // ---------- Versuche: Beobachtung erst nach eigener Vorhersage ----------
  function initVersuche() {
    document.querySelectorAll(".versuch").forEach((v, n) => {
      const ta = v.querySelector("textarea");
      const btn = v.querySelector("[data-reveal]");
      if (!btn) return;
      const key = `phy-vorhersage:${here}:${n}`;
      if (ta) {
        ta.value = load(key) || "";
        ta.addEventListener("input", () => store(key, ta.value));
      }
      v.querySelectorAll(".locked").forEach((li) => {
        if (!li.querySelector(".hint")) {
          const p = document.createElement("p");
          p.className = "hint";
          p.textContent = "Erscheint, wenn du deine Vorhersage notiert hast.";
          li.querySelector("h4").after(p);
        }
      });
      btn.addEventListener("click", () => {
        if (ta && ta.value.trim().length < 5) {
          ta.focus();
          ta.placeholder = "Notiere zuerst kurz deine Vermutung …";
          return;
        }
        v.querySelectorAll(".locked").forEach((li) => li.classList.remove("locked"));
        btn.disabled = true;
        btn.textContent = "Beobachtung unten";
      });
    });
  }

  // ---------- Quiz: eine Antwort wählen, sofort Rückmeldung ----------
  function initQuiz() {
    document.querySelectorAll(".quiz").forEach((quiz) => {
      const items = quiz.querySelectorAll(".qq");
      const score = document.createElement("p");
      score.className = "qscore";
      quiz.append(score);
      let right = 0, done = 0;
      items.forEach((qq) => {
        const ok = +qq.dataset.correct;
        const btns = qq.querySelectorAll("button");
        btns.forEach((b, i) => {
          b.type = "button";
          b.addEventListener("click", () => {
            btns.forEach((x, j) => {
              x.disabled = true;
              if (j === ok) x.classList.add("right");
            });
            if (i !== ok) b.classList.add("wrong");
            else right++;
            done++;
            const why = qq.querySelector(".why");
            if (why) why.hidden = false;
            score.textContent = `${right} von ${done} richtig` + (done === items.length ? " – fertig!" : "");
          });
        });
      });
    });
  }

  // Breite Tabellen scrollbar machen
  function wrapTables() {
    document.querySelectorAll("main table").forEach((t) => {
      if (t.parentElement.classList.contains("tbl-scroll")) return;
      const d = document.createElement("div");
      d.className = "tbl-scroll";
      t.replaceWith(d);
      d.append(t);
    });
  }

  // Sprungmarke zur Selbstkontrolle unter der Einleitung
  function linkSelbstkontrolle() {
    const sk = document.getElementById("selbstkontrolle");
    const lead = document.querySelector("main .lead");
    if (!sk || !lead) return;
    const n = sk.querySelectorAll(".task").length, q = sk.querySelectorAll(".qq").length;
    const teile = [n ? `${n} Aufgabe${n > 1 ? "n" : ""}` : "", q ? `${q} Quizfrage${q > 1 ? "n" : ""}` : ""].filter(Boolean).join(", ");
    const p = document.createElement("p");
    p.className = "zur-sk";
    p.innerHTML = `<a href="#selbstkontrolle">↓ Zur Selbstkontrolle${teile ? ` (${teile})` : ""}</a>`;
    lead.after(p);
  }

  buildHeader();
  buildChapterNav();
  linkSelbstkontrolle();
  wrapTables();
  initOperators();
  initVersuche();
  initQuiz();
  if (document.readyState === "complete") renderMath();
  else window.addEventListener("load", () => renderMath());

  window.Phy = { renderMath, UNITS };
})();
