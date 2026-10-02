/* Interactive figures for the BaRe-Mem note. Plain JavaScript + SVG, no dependencies.
   Every number on screen comes from the equations in the note; nothing is pre-computed. */
(function () {
  "use strict";

  /* ---------- maths ---------- */
  function erf(x) {                      /* Abramowitz & Stegun 7.1.26, |error| < 1.5e-7 */
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  function npdf(x, mu, varr) { return Math.exp(-0.5 * (x - mu) * (x - mu) / varr) / Math.sqrt(2 * Math.PI * varr); }
  function matVec(S, x) { return S.map(function (row) { return row.reduce(function (a, v, j) { return a + v * x[j]; }, 0); }); }
  function dot(a, b) { return a.reduce(function (s, v, i) { return s + v * b[i]; }, 0); }
  function eye(d, scale) { var M = []; for (var i = 0; i < d; i++) { M.push([]); for (var j = 0; j < d; j++) M[i].push(i === j ? scale : 0); } return M; }
  function fmt(v, n) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(n === undefined ? 2 : n); }
  function tfmt(v, n) { return (v < 0 ? "-" : "") + Math.abs(v).toFixed(n === undefined ? 2 : n); }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- DOM / SVG helpers ---------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function h(tag, attrs, parent, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function s(tag, attrs, parent, text) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function tex(el, src, display) {
    if (window.katex) { try { window.katex.render(src, el, { displayMode: !!display, throwOnError: false }); return; } catch (e) {} }
    el.textContent = src;
  }
  function slider(parent, label, min, max, step, value, onInput, digits) {
    var row = h("label", { class: "w-slider" }, parent);
    var name = h("span", { class: "w-slider-name" }, row);
    tex(name, label);
    var input = h("input", { type: "range", min: min, max: max, step: step, value: value }, row);
    var out = h("span", { class: "w-slider-value" }, row, fmt(+value, digits));
    input.addEventListener("input", function () { out.textContent = fmt(+input.value, digits); onInput(+input.value); });
    return { input: input, set: function (v) { input.value = v; out.textContent = fmt(+v, digits); } };
  }
  function button(parent, text, onClick, cls) {
    var b = h("button", { type: "button", class: "w-btn" + (cls ? " " + cls : "") }, parent, text);
    b.addEventListener("click", onClick);
    return b;
  }
  /* a plot frame: returns scale functions and the inner group */
  function frame(svg, W, H, pad, xr, yr, xticks, yticks, xlabel, ylabel) {
    var g = s("g", {}, svg);
    var X = function (v) { return pad.l + (v - xr[0]) / (xr[1] - xr[0]) * (W - pad.l - pad.r); };
    var Y = function (v) { return H - pad.b - (v - yr[0]) / (yr[1] - yr[0]) * (H - pad.t - pad.b); };
    s("rect", { x: pad.l, y: pad.t, width: W - pad.l - pad.r, height: H - pad.t - pad.b, class: "w-frame" }, g);
    (xticks || []).forEach(function (t) {
      s("line", { x1: X(t), x2: X(t), y1: H - pad.b, y2: H - pad.b + 4, class: "w-tick" }, g);
      s("text", { x: X(t), y: H - pad.b + 16, class: "w-ticklabel", "text-anchor": "middle" }, g, String(t));
    });
    (yticks || []).forEach(function (t) {
      s("line", { x1: pad.l - 4, x2: pad.l, y1: Y(t), y2: Y(t), class: "w-tick" }, g);
      s("text", { x: pad.l - 7, y: Y(t) + 4, class: "w-ticklabel", "text-anchor": "end" }, g, String(t));
    });
    if (xlabel) s("text", { x: (pad.l + W - pad.r) / 2, y: H - 4, class: "w-axislabel", "text-anchor": "middle" }, g, xlabel);
    if (ylabel) s("text", { x: 12, y: (pad.t + H - pad.b) / 2, class: "w-axislabel", "text-anchor": "middle", transform: "rotate(-90 12 " + (pad.t + H - pad.b) / 2 + ")" }, g, ylabel);
    return { g: g, X: X, Y: Y };
  }
  function path(points) { return points.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2); }).join(" "); }
  function tween(from, to, ms, step, done) {
    /* animate with animation frames; a timer guarantees the final state even when frames
       are not delivered (background tab, print, headless capture) */
    var t0 = null, finished = false;
    function finish() { if (finished) return; finished = true; step(to.slice()); if (done) done(); }
    function frameFn(ts) {
      if (finished) return;
      if (t0 === null) t0 = ts;
      var u = Math.min(1, (ts - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      if (u >= 1) { finish(); return; }
      step(from.map(function (f, i) { return f + (to[i] - f) * e; }));
      requestAnimationFrame(frameFn);
    }
    requestAnimationFrame(frameFn);
    setTimeout(finish, ms + 120);
  }

  /* =====================================================================
     1. Anatomy of x_{t,k}: which block is filled for which candidate
     ===================================================================== */
  function anatomy(root) {
    var sources = ["A1", "A2", "A3", "A4", "A5", "A6", "own"];
    var dq = 3, dc = 3, active = 2;
    var bar = h("div", { class: "w-row w-choices" }, root);
    h("span", { class: "w-muted" }, bar, "Candidate:");
    var btns = sources.map(function (name, i) {
      return button(bar, i === 6 ? "own answer" : "advisor " + (i + 1), function () { active = i; draw(); }, "w-chip");
    });
    var W = 680, H = 190, cell = 21, gap = 6;
    var svg = s("svg", { viewBox: "0 0 " + W + " " + H, class: "w-svg" }, root);
    var formula = h("div", { class: "w-formula" }, root);
    function draw() {
      btns.forEach(function (b, i) { b.classList.toggle("on", i === active); });
      clear(svg);
      var x0 = 34, rows = [{ y: 42, name: "x", vals: true }, { y: 128, name: "w", vals: false }];
      rows.forEach(function (row) {
        s("text", { x: 8, y: row.y + 15, class: "w-rowname" }, svg, row.name);
        var x = x0;
        sources.forEach(function (name, i) {
          var on = i === active;
          for (var j = 0; j < dq; j++) {
            s("rect", { x: x + j * cell, y: row.y, width: cell - 2, height: cell - 2, rx: 3,
              class: row.vals ? (on ? "w-cell q" : "w-cell zero") : (on ? "w-cell wq" : "w-cell wfaint") }, svg);
            if (row.vals && !on) s("text", { x: x + j * cell + (cell - 2) / 2, y: row.y + 14, class: "w-cellzero", "text-anchor": "middle" }, svg, "0");
          }
          if (row.vals) s("text", { x: x + (dq * cell) / 2, y: row.y - 7, class: "w-blocklabel" + (on ? " on" : ""), "text-anchor": "middle" }, svg, i === 6 ? "own" : "A" + (i + 1));
          else s("text", { x: x + (dq * cell) / 2, y: row.y + cell + 14, class: "w-blocklabel" + (on ? " on" : ""), "text-anchor": "middle" }, svg, i === 6 ? "w_own" : "w_A" + (i + 1));
          x += dq * cell + gap;
        });
        x += 8;
        for (var j = 0; j < dc; j++) s("rect", { x: x + j * cell, y: row.y, width: cell - 2, height: cell - 2, rx: 3, class: row.vals ? "w-cell c" : "w-cell wc" }, svg);
        s("text", { x: x + (dc * cell) / 2, y: row.vals ? row.y - 7 : row.y + cell + 14, class: "w-blocklabel on", "text-anchor": "middle" }, svg, row.vals ? "ψ_c" : "w_c");
        x += dc * cell + gap + 8;
        s("rect", { x: x, y: row.y, width: cell - 2, height: cell - 2, rx: 3, class: row.vals ? "w-cell b" : "w-cell wb" }, svg);
        if (row.vals) s("text", { x: x + (cell - 2) / 2, y: row.y + 14, class: "w-cellone", "text-anchor": "middle" }, svg, "1");
        s("text", { x: x + (cell - 2) / 2, y: row.vals ? row.y - 7 : row.y + cell + 14, class: "w-blocklabel on", "text-anchor": "middle" }, svg, row.vals ? "1" : "w_0");
      });
      s("text", { x: x0, y: 88, class: "w-note" }, svg, "e_k ⊗ ψ_q: the question features sit in the block of the candidate's source; every other source block is zero");
      var who = active === 6 ? "\\text{own}" : "A" + (active + 1);
      tex(formula, "w^\\top x_{t,k} \\;=\\; \\underbrace{w_{" + who + "}^\\top \\psi_q(t)}_{\\text{source on this kind of question}} \\;+\\; \\underbrace{w_c^\\top \\psi_c(t,k)}_{\\text{what the answer says}} \\;+\\; \\underbrace{w_0}_{\\text{bias}}", true);
    }
    draw();
  }

  /* =====================================================================
     2. The Kalman gain up close: a mixing weight, and the minimiser of the error
     ===================================================================== */
  function gainFig(root) {
    var v0 = 9 / 16, mu0 = 0, mu, v, last, gains, busy = false;
    var controls = h("div", { class: "w-row" }, root);
    var v0S = slider(controls, "v_0", 0.05, 3, 0.01, v0, function (x) { v0 = x; reset(); }, 2);
    slider(controls, "\\mu_0", -1.5, 1.5, 0.01, mu0, function (x) { mu0 = x; reset(); }, 2);
    var bRow = h("div", { class: "w-row" }, root);
    button(bRow, "Observe ✓  (s = +1)", function () { observe(1); }, "w-ok");
    button(bRow, "Observe ✗  (s = −1)", function () { observe(-1); }, "w-bad");
    button(bRow, "Reset", function () { reset(); }, "w-ghost");
    var grid = h("div", { class: "w-pair" }, root);
    var left = h("div", { class: "w-panel" }, grid), right = h("div", { class: "w-panel" }, grid);
    h("div", { class: "w-panel-title" }, left, "Belief, outcome and update");
    var rightTitle = h("div", { class: "w-panel-title" }, right, "Error of the next update, for every step size k");
    var svgL = s("svg", { viewBox: "0 0 360 250", class: "w-svg" }, left);
    var svgR = s("svg", { viewBox: "0 0 360 250", class: "w-svg" }, right);
    var stats = h("div", { class: "w-stats w-gainstats" }, root);
    var chips = h("div", { class: "w-gains" }, root);

    function reset() { mu = mu0; v = v0; last = null; gains = []; render(mu, v, null); }
    function drawLeft(curMu, curV, info) {
      clear(svgL);
      var f = frame(svgL, 360, 250, { l: 12, r: 10, t: 10, b: 84 }, [-3, 3], [0, 1.25], [-3, -2, -1, 0, 1, 2, 3], [], "");
      function curve(m, va) { var p = []; for (var z = -3; z <= 3.001; z += 0.03) p.push([f.X(z), f.Y(Math.min(1.25, npdf(z, m, va)))]); return p; }
      if (info) {
        s("path", { d: path(curve(info.s, 1)), class: "w-lik " + (info.s > 0 ? "ok" : "bad") }, f.g);
        s("path", { d: path(curve(info.mu0, info.v0)), class: "w-ghostline" }, f.g);
      }
      var pts = curve(curMu, curV);
      s("path", { d: path([[f.X(-3), f.Y(0)]].concat(pts).concat([[f.X(3), f.Y(0)]])) + " Z", class: "w-belief-area" }, f.g);
      s("path", { d: path(pts), class: "w-belief" }, f.g);
      s("text", { x: f.X(-2.9), y: f.Y(1.13), class: "w-small" }, f.g, "belief N(μ, v)");
      if (info) s("text", { x: f.X(2.9), y: f.Y(1.13), class: "w-small", "text-anchor": "end" }, f.g, "dashed: before · coloured: outcome");
      /* the number line: where the update lands between the old belief and the outcome */
      var yl = 214;
      s("line", { x1: f.X(-3), x2: f.X(3), y1: yl, y2: yl, class: "w-axisline" }, f.g);
      if (info) {
        var xa = f.X(info.mu0), xs = f.X(info.s), xm = f.X(curMu);
        s("line", { x1: xa, x2: xs, y1: yl, y2: yl, class: "w-seg-track" }, f.g);
        s("line", { x1: xa, x2: xm, y1: yl, y2: yl, class: "w-seg-move" }, f.g);
        s("circle", { cx: xa, cy: yl, r: 4.5, class: "w-pt old" }, f.g);
        s("circle", { cx: xs, cy: yl, r: 5, class: "w-pt " + (info.s > 0 ? "ok" : "bad") }, f.g);
        s("circle", { cx: xm, cy: yl, r: 5.5, class: "w-pt new" }, f.g);
        s("text", { x: (xa + xs) / 2, y: yl - 12, class: "w-kfrac", "text-anchor": "middle" }, f.g, "μ′ lands K = " + info.K.toFixed(2) + " of the way from μ to s");
        s("text", { x: xa, y: yl + 20, class: "w-small", "text-anchor": "middle" }, f.g, "μ");
        s("text", { x: xs, y: yl + 20, class: "w-small", "text-anchor": "middle" }, f.g, "s");
        if (Math.abs(xm - xa) >= 16 && Math.abs(xm - xs) >= 16) s("text", { x: xm, y: yl + 20, class: "w-small w-strong", "text-anchor": "middle" }, f.g, "μ′");
      } else {
        s("circle", { cx: f.X(curMu), cy: yl, r: 5.5, class: "w-pt new" }, f.g);
        s("text", { x: f.X(curMu), y: yl + 20, class: "w-small", "text-anchor": "middle" }, f.g, "μ");
        s("text", { x: f.X(0), y: yl - 12, class: "w-small", "text-anchor": "middle" }, f.g, "observe an outcome to see where the update lands");
      }
    }
    function drawRight(curV, applied) {
      clear(svgR);
      rightTitle.textContent = applied ? "Error of this update, for every step size k" : "Error of the next update, for every step size k";
      var R = function (k) { return curV - 2 * k * curV + (1 + curV) * k * k; };
      var K = curV / (1 + curV), ymax = Math.max(curV, 1) * 1.08;
      var f = frame(svgR, 360, 250, { l: 40, r: 12, t: 10, b: 40 }, [0, 1], [0, ymax], [0, 0.25, 0.5, 0.75, 1], ymax > 2 ? [0, 1, 2, 3] : [0, 0.5, 1], "step size k", "expected squared error");
      var pts = []; for (var k = 0; k <= 1.0001; k += 0.01) pts.push([f.X(k), f.Y(R(k))]);
      s("path", { d: path(pts), class: "w-parabola" }, f.g);
      [0.1, 0.5].forEach(function (k) {
        s("circle", { cx: f.X(k), cy: f.Y(R(k)), r: 4.5, class: "w-pt hollow" }, f.g);
        s("text", { x: f.X(k), y: f.Y(R(k)) - 9, class: "w-small", "text-anchor": "middle" }, f.g, "fixed " + k);
      });
      s("line", { x1: f.X(K), x2: f.X(K), y1: f.Y(0), y2: f.Y(R(K)), class: "w-kline" }, f.g);
      s("circle", { cx: f.X(K), cy: f.Y(R(K)), r: 6, class: "w-pt new" }, f.g);
      s("text", { x: f.X(K) + 8, y: f.Y(R(K)) + 18, class: "w-kfrac" }, f.g, "K = v/(1+v) = " + K.toFixed(2));
    }
    function render(curMu, curV, info) {
      drawLeft(curMu, curV, info);
      drawRight(info ? info.v0 : curV, !!info);
      clear(stats);
      var K = curV / (1 + curV);
      if (info) {
        tex(h("div", {}, stats), "K=\\frac{v}{1+v}=\\frac{" + info.v0.toFixed(2) + "}{1+" + info.v0.toFixed(2) + "}=" + info.K.toFixed(2) +
          ",\\quad \\mu'=(1-K)\\,\\mu+K\\,s=" + (1 - info.K).toFixed(2) + "\\cdot(" + tfmt(info.mu0) + ")+" + info.K.toFixed(2) + "\\cdot(" + (info.s > 0 ? "+1" : "-1") + ")=" + tfmt(info.mu1) +
          ",\\quad v'=(1-K)\\,v=" + info.v1.toFixed(2), true);
        tex(h("div", { class: "w-muted" }, stats), "\\text{precision: } \\tfrac{1}{v'}=\\tfrac{1}{v}+1=" + (1 / info.v0).toFixed(2) + "+1=" + (1 / info.v1).toFixed(2) + "\\qquad \\text{next gain: } K=" + (info.v1 / (1 + info.v1)).toFixed(2));
      } else {
        tex(h("div", {}, stats), "\\text{next gain: } K=\\frac{v}{1+v}=\\frac{" + curV.toFixed(2) + "}{1+" + curV.toFixed(2) + "}=" + K.toFixed(2) + "\\quad\\text{(observe an outcome to apply it)}", true);
      }
      clear(chips);
      h("span", { class: "w-muted" }, chips, gains.length ? "Gains so far:" : "Each observation adds one unit of precision, so the gain shrinks:");
      gains.forEach(function (g) { h("span", { class: "w-gainchip " + (g.s > 0 ? "ok" : "bad") }, chips, (g.s > 0 ? "✓ " : "✗ ") + g.K.toFixed(2)); });
    }
    function observe(sv) {
      if (busy) return; busy = true;
      var K = v / (1 + v), info = { s: sv, mu0: mu, v0: v, K: K, mu1: mu + K * (sv - mu), v1: (1 - K) * v };
      tween([mu, v], [info.mu1, info.v1], 500, function (vals) { drawLeft(vals[0], vals[1], info); }, function () {
        mu = info.mu1; v = info.v1; gains.push({ K: K, s: sv }); last = info; render(mu, v, info); busy = false;
      });
    }
    reset();
  }

  /* =====================================================================
     3. The memory: verified outcomes -> exact Kalman updates -> p = Phi(mu / sqrt(1+v))
     ===================================================================== */
  function memory(root) {
    var lam = 16 / 9, shared = false, S, m, gains, view;
    var cands = [{ name: "Candidate 1", cls: "c1" }, { name: "Candidate 2", cls: "c2" }];
    function xOf(k) { var d = shared ? 3 : 2, x = []; for (var i = 0; i < d; i++) x.push(0); x[k] = 1; if (shared) x[2] = 1; return x; }
    function stateOf(k) { var x = xOf(k), mu = dot(x, m), v = dot(x, matVec(S, x)); return { mu: mu, v: v, p: Phi(mu / Math.sqrt(1 + v)) }; }
    function reset() {
      var d = shared ? 3 : 2; S = eye(d, 1 / lam); m = []; for (var i = 0; i < d; i++) m.push(0);
      gains = [[], []]; view = [stateOf(0), stateOf(1)]; render(null);
    }
    var controls = h("div", { class: "w-row" }, root);
    var lamS = slider(controls, "\\lambda", 0.25, 8, 0.01, lam, function (v) { lam = v; reset(); }, 2);
    var sharedLabel = h("label", { class: "w-toggle" }, controls);
    var sharedBox = h("input", { type: "checkbox" }, sharedLabel);
    h("span", {}, sharedLabel, " shared bias feature");
    sharedBox.addEventListener("change", function () { shared = sharedBox.checked; reset(); });
    button(controls, "Reset", function () { reset(); }, "w-ghost");
    button(controls, "Paper's Figure 1", function () {
      lam = 16 / 9; lamS.set(lam); shared = false; sharedBox.checked = false; reset();
      [1, 1, -1].forEach(function (sv, i) { setTimeout(function () { verify(0, sv); }, 120 + i * 650); });
    }, "w-ghost");

    var grid = h("div", { class: "w-cands" }, root);
    var panels = cands.map(function (c, k) {
      var box = h("div", { class: "w-cand " + c.cls }, grid);
      var head = h("div", { class: "w-cand-head" }, box);
      h("b", {}, head, c.name);
      var btns = h("span", { class: "w-cand-btns" }, head);
      button(btns, "✓ right", function () { verify(k, 1); }, "w-ok");
      button(btns, "✗ wrong", function () { verify(k, -1); }, "w-bad");
      var svg = s("svg", { viewBox: "0 0 320 150", class: "w-svg" }, box);
      var stats = h("div", { class: "w-stats" }, box);
      var gainRow = h("div", { class: "w-gains" }, box);
      return { svg: svg, stats: stats, gainRow: gainRow };
    });
    var log = h("div", { class: "w-log" }, root);

    function drawCand(k, st, ghost) {
      var P = panels[k], svg = P.svg;
      clear(svg);
      var f = frame(svg, 320, 150, { l: 14, r: 10, t: 10, b: 30 }, [-3.5, 3.5], [0, 0.5], [-3, -2, -1, 0, 1, 2, 3], [], "signed correctness s");
      function curve(mu, v) { var pts = []; for (var z = -3.5; z <= 3.501; z += 0.05) pts.push([f.X(z), f.Y(Math.min(0.5, npdf(z, mu, 1 + v)))]); return pts; }
      var pts = curve(st.mu, st.v);
      var area = pts.filter(function (p) { return p[0] >= f.X(0); });
      s("path", { d: path([[f.X(0), f.Y(0)]].concat(area).concat([[f.X(3.5), f.Y(0)]])) + " Z", class: "w-area " + cands[k].cls }, f.g);
      if (ghost) s("path", { d: path(curve(ghost.mu, ghost.v)), class: "w-ghostline" }, f.g);
      s("path", { d: path(pts), class: "w-line " + cands[k].cls }, f.g);
      s("line", { x1: f.X(0), x2: f.X(0), y1: f.Y(0), y2: f.Y(0.5), class: "w-zero" }, f.g);
      s("text", { x: f.X(0.25), y: f.Y(0.44), class: "w-pnum " + cands[k].cls }, f.g, "p = " + st.p.toFixed(2));
      clear(P.stats);
      tex(h("span", {}, P.stats), "\\mu=" + tfmt(st.mu) + ",\\; v=" + tfmt(st.v) + ",\\; p=\\Phi\\big(\\mu/\\sqrt{1+v}\\big)=" + st.p.toFixed(2));
    }
    function render(last) {
      [0, 1].forEach(function (k) {
        drawCand(k, view[k], null);
        var row = panels[k].gainRow; clear(row);
        h("span", { class: "w-muted" }, row, gains[k].length ? "Kalman gains so far: " : "No verified outcome yet");
        gains[k].forEach(function (g) { h("span", { class: "w-gainchip " + (g.s > 0 ? "ok" : "bad") }, row, (g.s > 0 ? "✓ " : "✗ ") + g.g.toFixed(2)); });
      });
      clear(log);
      if (last) {
        tex(h("div", {}, log), "\\text{" + cands[last.k].name + ": } K=\\tfrac{v}{1+v}=" + last.gain.toFixed(2) + ",\\quad \\mu \\leftarrow (1-K)\\,\\mu + K\\,s = " + (1 - last.gain).toFixed(2) + "\\cdot(" + tfmt(last.mu0) + ") + " + last.gain.toFixed(2) + "\\cdot(" + (last.s > 0 ? "+1" : "-1") + ") = " + tfmt(last.mu1));
      } else {
        h("div", { class: "w-muted" }, log, "Click ✓ or ✗ to write a verified outcome into the memory.");
      }
    }
    function verify(k, sv) {
      var before = [stateOf(0), stateOf(1)];
      var x = xOf(k), Sx = matVec(S, x), c = dot(x, Sx), g = Sx.map(function (v) { return v / (1 + c); });
      var resid = sv - dot(x, m);
      m = m.map(function (v, i) { return v + g[i] * resid; });
      S = S.map(function (row, i) { return row.map(function (v, j) { return v - g[i] * Sx[j]; }); });
      var after = [stateOf(0), stateOf(1)];
      gains[k].push({ g: c / (1 + c), s: sv });
      var lastInfo = { k: k, s: sv, mu0: before[k].mu, mu1: after[k].mu, gain: c / (1 + c) };
      tween([before[0].mu, before[0].v, before[1].mu, before[1].v], [after[0].mu, after[0].v, after[1].mu, after[1].v], 450, function (vals) {
        [0, 1].forEach(function (j) { var mu = vals[2 * j], v = vals[2 * j + 1]; drawCand(j, { mu: mu, v: v, p: Phi(mu / Math.sqrt(1 + v)) }, before[j]); });
      }, function () { view = after; render(lastInfo); });
    }
    reset();
  }

  /* =====================================================================
     4. A step size that adapts: the Kalman gain against fixed step sizes
     ===================================================================== */
  function stepFig(root) {
    var pTrue = 0.7, lam = 16 / 9, N = 300, seed = 11, outcomes = [], shown = 0, timer = null;
    var rules = [
      { name: "Kalman gain 1/(λ+n)", short: "Kalman", cls: "kal", gain: function (n) { return 1 / (lam + n); } },
      { name: "fixed step 0.3", short: "fixed 0.3", cls: "fix1", gain: function () { return 0.3; } },
      { name: "fixed step 0.02", short: "fixed 0.02", cls: "fix2", gain: function () { return 0.02; } }
    ];
    var controls = h("div", { class: "w-row" }, root);
    slider(controls, "p^{\\ast}\\ \\text{(true reliability)}", 0.05, 0.95, 0.01, pTrue, function (v) { pTrue = v; newStream(true); }, 2);
    var bRow = h("div", { class: "w-row" }, root);
    button(bRow, "Stream " + N + " outcomes", function () { play(); });
    button(bRow, "New random stream", function () { seed++; newStream(false); }, "w-ghost");
    var legend = h("div", { class: "w-legend" }, root);
    rules.forEach(function (r) { var it = h("span", { class: "w-legend-item" }, legend); h("span", { class: "w-swatch " + r.cls }, it); h("span", {}, it, r.name); });
    var it0 = h("span", { class: "w-legend-item" }, legend); h("span", { class: "w-swatch truth" }, it0); h("span", {}, it0, "target 2p* − 1");
    var svg = s("svg", { viewBox: "0 0 680 344", class: "w-svg" }, root);
    var out = h("div", { class: "w-stats" }, root);

    function newStream(full) {
      var rng = mulberry32(seed * 7919);
      outcomes = []; for (var i = 0; i < N; i++) outcomes.push(rng() < pTrue ? 1 : -1);
      if (timer) { clearInterval(timer); timer = null; }
      shown = full ? N : 0; draw();
    }
    function trajectories(n) {
      return rules.map(function (r) {
        var mu = 0, pts = [[0, 0]];
        for (var i = 1; i <= n; i++) { mu = mu + r.gain(i) * (outcomes[i - 1] - mu); pts.push([i, mu]); }
        return pts;
      });
    }
    function draw() {
      clear(svg);
      var target = 2 * pTrue - 1;
      var f = frame(svg, 680, 220, { l: 50, r: 16, t: 10, b: 30 }, [0, N], [-1, 1], [0, 50, 100, 150, 200, 250, 300], [-1, -0.5, 0, 0.5, 1], "", "estimate μ");
      s("line", { x1: f.X(0), x2: f.X(N), y1: f.Y(target), y2: f.Y(target), class: "w-truthline" }, f.g);
      var tr = trajectories(shown);
      tr.forEach(function (pts, i) { s("path", { d: path(pts.map(function (p) { return [f.X(p[0]), f.Y(p[1])]; })), class: "w-traj " + rules[i].cls }, f.g); });
      var g2 = frame(svg, 680, 344, { l: 50, r: 16, t: 236, b: 42 }, [0, N], [0, 0.4], [0, 50, 100, 150, 200, 250, 300], [0, 0.2, 0.4], "verified outcomes n", "gain");
      rules.forEach(function (r) {
        var pts = []; for (var n = 1; n <= N; n++) pts.push([g2.X(n), g2.Y(Math.min(0.4, r.gain(n)))]);
        s("path", { d: path(pts), class: "w-traj thin " + r.cls }, g2.g);
      });
      clear(out);
      if (shown > 0) {
        var avg = tr.map(function (pts) { var a = 0; for (var i = 1; i < pts.length; i++) a += Math.abs(pts[i][1] - target); return a / Math.max(1, pts.length - 1); });
        var fin = tr.map(function (pts) { return Math.abs(pts[pts.length - 1][1] - target); });
        tex(h("div", {}, out), "\\text{error averaged over the " + shown + " outcomes: }" + rules.map(function (r, i) { return "\\text{" + r.short + "}\\ " + avg[i].toFixed(3); }).join(",\\;\\; "));
        tex(h("div", { class: "w-muted" }, out), "\\text{error after the last outcome: }" + rules.map(function (r, i) { return "\\text{" + r.short + "}\\ " + fin[i].toFixed(3); }).join(",\\;\\; "));
      } else {
        h("span", { class: "w-muted" }, out, "Press “Stream” to feed verified outcomes one at a time.");
      }
    }
    function play() {
      if (timer) clearInterval(timer);
      shown = 0;
      timer = setInterval(function () { shown = Math.min(N, shown + 3); draw(); if (shown >= N) { clearInterval(timer); timer = null; } }, 16);
    }
    newStream(true);
  }

  /* =====================================================================
     5. Learning rho and delta online: a 2-D Bayesian regression
     ===================================================================== */
  function learn(root) {
    var trueRho = 0.85, trueDelta = 0.2, seed = 7, rng, P, q, n, trace;
    function reset(warm) { rng = mulberry32(seed++); P = [[1, 0], [0, 1]]; q = [0.5, 0]; n = 0; trace = [estimate()];
      for (var i = 0; i < (warm || 0); i++) { step(); trace.push(estimate()); }
      draw(); }
    function estimate() {
      var det = P[0][0] * P[1][1] - P[0][1] * P[1][0];
      var inv = [[P[1][1] / det, -P[0][1] / det], [-P[1][0] / det, P[0][0] / det]];
      var th = matVec(inv, q);
      return { n: n, rho: th[0], delta: th[1], sr: Math.sqrt(inv[0][0]), sd: Math.sqrt(inv[1][1]) };
    }
    function step() {
      var T = rng(), kappa = 0.35 + 0.45 * rng();
      var a = Math.min(1, Math.max(0, T * trueRho + (1 - T) * (kappa - trueDelta)));
      var y = rng() < a ? 1 : 0, z = y - (1 - T) * kappa, u = [T, T - 1];
      P = [[P[0][0] + u[0] * u[0], P[0][1] + u[0] * u[1]], [P[1][0] + u[1] * u[0], P[1][1] + u[1] * u[1]]];
      q = [q[0] + u[0] * z, q[1] + u[1] * z];
      n += 1;
    }
    var controls = h("div", { class: "w-row" }, root);
    slider(controls, "\\rho\\ \\text{(true)}", 0.3, 1, 0.01, trueRho, function (v) { trueRho = v; reset(150); }, 2);
    slider(controls, "\\delta\\ \\text{(true)}", -0.2, 0.5, 0.01, trueDelta, function (v) { trueDelta = v; reset(150); }, 2);
    var btnRow = h("div", { class: "w-row" }, root);
    button(btnRow, "Verify 1 question", function () { step(); trace.push(estimate()); draw(); });
    button(btnRow, "Verify 50 more", function () {
      var left = 50;
      (function tick() { if (left-- <= 0) return; step(); trace.push(estimate()); draw(); setTimeout(tick, 18); })();
    });
    button(btnRow, "Reset", function () { reset(0); }, "w-ghost");
    var svg = s("svg", { viewBox: "0 0 680 260", class: "w-svg" }, root);
    var out = h("div", { class: "w-stats" }, root);
    function draw() {
      clear(svg);
      var nmax = Math.max(50, trace[trace.length - 1].n);
      var f = frame(svg, 680, 260, { l: 50, r: 20, t: 14, b: 42 }, [0, nmax], [-0.4, 1.2], [], [-0.25, 0, 0.25, 0.5, 0.75, 1], "verified questions", "estimate");
      [0, nmax].forEach(function (t) { s("text", { x: f.X(t), y: 260 - 42 + 16, class: "w-ticklabel", "text-anchor": "middle" }, f.g, String(t)); });
      [["rho", trueRho, "c1"], ["delta", trueDelta, "c2"]].forEach(function (spec) {
        var key = spec[0], sdKey = key === "rho" ? "sr" : "sd";
        var upper = trace.map(function (e) { return [f.X(e.n), f.Y(Math.min(1.2, e[key] + e[sdKey]))]; });
        var lower = trace.map(function (e) { return [f.X(e.n), f.Y(Math.max(-0.4, e[key] - e[sdKey]))]; }).reverse();
        s("path", { d: path(upper.concat(lower)) + " Z", class: "w-band " + spec[2] }, f.g);
        s("line", { x1: f.X(0), x2: f.X(nmax), y1: f.Y(spec[1]), y2: f.Y(spec[1]), class: "w-true " + spec[2] }, f.g);
        s("path", { d: path(trace.map(function (e) { return [f.X(e.n), f.Y(e[key])]; })), class: "w-line " + spec[2] }, f.g);
      });
      var e = trace[trace.length - 1];
      s("text", { x: f.X(nmax) - 4, y: f.Y(1.12), class: "w-small", "text-anchor": "end" }, f.g, "solid: estimate ± 1 sd   dashed: true value");
      clear(out);
      tex(h("span", {}, out), "n=" + e.n + ":\\quad \\hat\\rho=" + e.rho.toFixed(3) + "\\ (\\text{true } " + trueRho.toFixed(2) + "),\\quad \\hat\\delta=" + tfmt(e.delta, 3) + "\\ (\\text{true } " + tfmt(trueDelta) + ")");
    }
    reset(150);
  }

  var widgets = { "w-anatomy": anatomy, "w-gain": gainFig, "w-memory": memory, "w-step": stepFig, "w-learn": learn };
  function init() {
    Object.keys(widgets).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.dataset.ready) { el.dataset.ready = "1"; widgets[id](el); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.addEventListener("load", init);
})();
