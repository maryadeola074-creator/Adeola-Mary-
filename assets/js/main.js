(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.add("js");

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* ---------- accent switcher ---------- */
  var saved = store("am-brand");
  if (saved && saved !== "purple") doc.setAttribute("data-accent", saved);
  document.querySelectorAll(".switcher button").forEach(function (b) {
    var v = b.getAttribute("data-accent");
    b.setAttribute("aria-pressed", String((saved || "purple") === v));
    b.addEventListener("click", function () {
      if (v === "purple") doc.removeAttribute("data-accent"); else doc.setAttribute("data-accent", v);
      store("am-brand", v);
      document.querySelectorAll(".switcher button").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      if (window.__heroColor) window.__heroColor();
    });
  });

  /* ---------- preloader ---------- */
  var pre = document.querySelector(".preloader");
  function hidePre() { if (pre) pre.classList.add("done"); document.body.classList.add("loaded"); startHero(); }
  if (pre) {
    var t = setTimeout(hidePre, 1800);
    window.addEventListener("load", function () { clearTimeout(t); setTimeout(hidePre, reduce ? 0 : 500); });
  } else { document.body.classList.add("loaded"); }

  /* ---------- header + progress ---------- */
  var header = document.querySelector(".header");
  var toTop = document.querySelector(".to-top");
  var bar = toTop && toTop.querySelector(".bar");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (toTop) {
      toTop.classList.toggle("show", y > 500);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar && max > 0) bar.style.strokeDashoffset = String(151 - (151 * y) / max);
    }
    circleCta();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------- off-canvas ---------- */
  var oc = document.querySelector(".offcanvas");
  var lastFocus = null;
  function openOc() { if (!oc) return; lastFocus = document.activeElement; oc.classList.add("open"); oc.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; var c = oc.querySelector(".offcanvas__close"); if (c) c.focus(); }
  function closeOc() { if (!oc) return; oc.classList.remove("open"); oc.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  document.querySelectorAll("[data-open-menu]").forEach(function (b) { b.addEventListener("click", openOc); });
  if (oc) {
    oc.querySelectorAll("[data-close-menu]").forEach(function (b) { b.addEventListener("click", closeOc); });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeOc(); closeModal(); } });

  /* ---------- custom cursor ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    var c1 = document.createElement("div"); c1.className = "cursor";
    var c2 = document.createElement("div"); c2.className = "cursor-dot";
    document.body.appendChild(c1); document.body.appendChild(c2);
    document.body.classList.add("has-cursor");
    var mx = -100, my = -100, cx = -100, cy = -100;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; c2.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)"; });
    (function loop() { cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18; c1.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover", function (e) { c1.classList.toggle("is-hover", !!e.target.closest("a, button, .project, .work, input, textarea, select")); });
  }

  /* ---------- split headings ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var s = document.createElement("span"); s.textContent = part; s.style.setProperty("--d", (i++ * 0.06).toFixed(2) + "s");
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "svg") { walk(n); }
      });
    }
    walk(el);
    el.classList.add("split");
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, .split, .skill");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    // safety: never leave content hidden
    setTimeout(function () { revealEls.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add("in"); }); }, 2600);
  } else { revealEls.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var end = parseFloat(el.getAttribute("data-count")); var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var suf = el.getAttribute("data-suffix") || ""; var start = performance.now(); var dur = 1800;
    (function tick(now) { var p = Math.min(1, (now - start) / dur); var e = 1 - Math.pow(1 - p, 3); el.textContent = (end * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(tick); })(start);
  }
  if ("IntersectionObserver" in window && !reduce) {
    var cio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { runCount(x.target); cio.unobserve(x.target); } }); }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- carousel ---------- */
  document.querySelectorAll("[data-carousel]").forEach(function (wrap) {
    var track = wrap.querySelector(".carousel__track");
    var step = function () { var it = track.querySelector(".project"); return it ? it.getBoundingClientRect().width + 22 : 300; };
    var prev = document.querySelector("[data-prev='" + wrap.id + "']"), next = document.querySelector("[data-next='" + wrap.id + "']");
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add("dragging"); });
    window.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
    window.addEventListener("pointerup", function () { down = false; track.classList.remove("dragging"); });
    track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---------- process steps ---------- */
  var steps = document.querySelectorAll(".step");
  if (steps.length && "IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { steps.forEach(function (s) { s.classList.remove("active"); }); x.target.classList.add("active"); } }); }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- circle CTA ---------- */
  var cc = document.querySelector(".circle-cta");
  var disc = cc && cc.querySelector(".circle-cta__disc");
  function circleCta() {
    if (!cc || !disc || reduce) return;
    var r = cc.getBoundingClientRect(); var total = r.height - window.innerHeight;
    var p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.4) / (total + window.innerHeight * 0.4)));
    disc.style.setProperty("--s", (0.2 + p * 0.9).toFixed(3));
    cc.classList.toggle("filled", p > 0.45);
  }
  circleCta();

  /* ---------- testimonials ---------- */
  document.querySelectorAll("[data-slider]").forEach(function (sl) {
    var qs = sl.querySelectorAll(".quote"); var dots = sl.querySelector(".dots"); var i = 0; var timer;
    qs.forEach(function (_, k) { var d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", "Show review " + (k + 1)); d.addEventListener("click", function () { go(k); reset(); }); dots.appendChild(d); });
    function go(k) { i = (k + qs.length) % qs.length; qs.forEach(function (q, n) { q.classList.toggle("active", n === i); }); dots.querySelectorAll("button").forEach(function (d, n) { d.setAttribute("aria-current", String(n === i)); }); }
    function reset() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(i + 1); }, 7000); }
    var p = sl.querySelector("[data-q-prev]"), n = sl.querySelector("[data-q-next]");
    if (p) p.addEventListener("click", function () { go(i - 1); reset(); });
    if (n) n.addEventListener("click", function () { go(i + 1); reset(); });
    go(0); reset();
  });

  /* ---------- FAQ ---------- */
  document.querySelectorAll(".faq__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq__item"); var open = !item.classList.contains("open");
      item.classList.toggle("open", open); q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- portfolio filter + modal ---------- */
  var filters = document.querySelectorAll(".filter");
  var works = document.querySelectorAll(".work");
  var countEl = document.querySelector("[data-work-count]");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      var cat = f.getAttribute("data-filter"); var shown = 0;
      filters.forEach(function (o) { o.setAttribute("aria-pressed", String(o === f)); });
      works.forEach(function (w) { var ok = cat === "all" || w.getAttribute("data-cat") === cat; w.hidden = !ok; if (ok) shown++; });
      if (countEl) countEl.textContent = shown + (shown === 1 ? " project" : " projects");
    });
  });
  var modal = document.querySelector(".modal");
  var mLast = null;
  function closeModal() { if (!modal || !modal.classList.contains("open")) return; modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (mLast) mLast.focus(); }
  if (modal) {
    works.forEach(function (w) {
      w.addEventListener("click", function () {
        mLast = w;
        var mm = modal.querySelector(".modal__media"); var gal = w.getAttribute("data-gallery");
        if (gal) { mm.innerHTML = ""; gal.split("|").forEach(function (g, k) { var a = g.split(","); var img = document.createElement("img"); img.className = "shot"; img.src = a[0]; img.width = +a[1]; img.height = +a[2]; img.alt = w.getAttribute("data-title") + " work sample " + (k + 1); mm.appendChild(img); }); }
        else mm.innerHTML = w.querySelector(".project__media").innerHTML;
        var im = mm.querySelector(".shot"); mm.classList.toggle("has-img", !!im);
        if (im) { im.removeAttribute("loading"); if (+im.getAttribute("height") > +im.getAttribute("width")) im.classList.add("tall"); }
        modal.querySelector("[data-m-title]").textContent = w.getAttribute("data-title");
        modal.querySelector("[data-m-role]").textContent = w.getAttribute("data-role");
        modal.querySelector("[data-m-desc]").textContent = w.getAttribute("data-desc");
        var tags = modal.querySelector("[data-m-tags]"); tags.innerHTML = "";
        w.getAttribute("data-skills").split("|").forEach(function (s) { var c = document.createElement("span"); c.className = "chip"; c.innerHTML = "<i></i>"; c.appendChild(document.createTextNode(s)); tags.appendChild(c); });
        modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
        modal.querySelector(".modal__close").focus();
      });
    });
    modal.querySelectorAll("[data-close-modal]").forEach(function (b) { b.addEventListener("click", closeModal); });
  }

  /* ---------- copy buttons ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var txt = b.getAttribute("data-copy"); var label = b.querySelector("span") || b;
      var done = function () { var o = label.textContent; label.textContent = "Copied"; setTimeout(function () { label.textContent = o; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { selectText(b.previousElementSibling); });
      else selectText(b.previousElementSibling);
    });
  });
  function selectText(el) { if (!el) return; var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  /* ---------- contact form ---------- */
  var form = document.querySelector("#contact-form");
  if (form) {
    var status = form.querySelector(".form__status");
    function check(field) {
      var input = field.querySelector("input, select, textarea"); var err = field.querySelector(".err"); var msg = "";
      if (input.required && !input.value.trim()) msg = "Please fill in this field.";
      else if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = "Enter an email like name@company.com.";
      field.classList.toggle("invalid", !!msg); if (err) err.textContent = msg; input.setAttribute("aria-invalid", String(!!msg));
      return !msg;
    }
    form.querySelectorAll(".field").forEach(function (f) { var i = f.querySelector("input, select, textarea"); if (i) i.addEventListener("blur", function () { if (i.value) check(f); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true; var first = null;
      form.querySelectorAll(".field").forEach(function (f) { if (!check(f)) { ok = false; if (!first) first = f.querySelector("input, select, textarea"); } });
      if (!ok) { first.focus(); return; }
      var btn = form.querySelector("button[type=submit]"); var lbl = btn.querySelector(".lbl"); var orig = lbl.textContent;
      btn.disabled = true; lbl.textContent = "Sending…"; status.hidden = true;
      var data = new URLSearchParams(new FormData(form)).toString();
      fetch(form.getAttribute("action") || "/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: data })
        .then(function (r) { if (!r.ok) throw new Error(r.status); status.className = "form__status ok"; status.textContent = "Thanks! Your message reached Mary. She replies within 24 hours."; form.reset(); })
        .catch(function () { status.className = "form__status bad"; status.textContent = "The message didn't send. Please email Mary directly at " + form.getAttribute("data-email") + "."; })
        .finally(function () { status.hidden = false; btn.disabled = false; lbl.textContent = orig; });
    });
  }
  document.querySelectorAll(".news").forEach(function (n) {
    n.addEventListener("submit", function (e) { e.preventDefault(); var i = n.querySelector("input"); if (!i.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)) { i.focus(); i.setAttribute("aria-invalid", "true"); return; } window.location.href = n.getAttribute("data-go") + "?email=" + encodeURIComponent(i.value); });
  });

  /* ---------- hero canvas: rotating twisted ribbon of dots ---------- */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return; heroStarted = true;
    var cv = document.querySelector(".hero__canvas"); if (!cv) return;
    var ctx = cv.getContext("2d"); var W, H, dpr; var rgb = [167, 123, 255], rgb2 = [215, 196, 255];
    function readColor() {
      var cs = getComputedStyle(doc);
      function hex(v) { v = v.trim().replace("#", ""); return [parseInt(v.substr(0, 2), 16), parseInt(v.substr(2, 2), 16), parseInt(v.substr(4, 2), 16)]; }
      try { rgb = hex(cs.getPropertyValue("--accent")); rgb2 = hex(cs.getPropertyValue("--accent-2")); } catch (e) {}
    }
    window.__heroColor = readColor; readColor();
    function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener("resize", size);
    var U = 120, V = 16; var t0 = performance.now(); var visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(cv);
    var mxp = 0, myp = 0;
    window.addEventListener("mousemove", function (e) { mxp = e.clientX / window.innerWidth - 0.5; myp = e.clientY / window.innerHeight - 0.5; });
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      var t = reduce ? 0 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      var small = W < 760;
      var cx = small ? W * 0.62 : W * 0.66, cy = H * 0.5; var R = Math.min(W, H) * (small ? 0.48 : 0.42);
      var ry = t * 0.12 + mxp * 0.4, rx = 0.9 + myp * 0.3;
      var cr = Math.cos(ry), sr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
      var pts = [];
      for (var i = 0; i < U; i++) {
        var u = (i / U) * Math.PI * 2;
        for (var j = 0; j < V; j++) {
          var v = (j / (V - 1) - 0.5) * 0.9;
          var tw = u * 1.5 + t * 0.4; // twist
          var w = v * Math.cos(tw), h = v * Math.sin(tw);
          var x = (1 + w) * Math.cos(u), z = (1 + w) * Math.sin(u), y = h + 0.18 * Math.sin(u * 3 + t);
          var x1 = x * cr - z * sr, z1 = x * sr + z * cr;
          var y2 = y * cxr - z1 * sxr, z2 = y * sxr + z1 * cxr;
          var p = 3.2 / (3.2 + z2);
          pts.push([cx + x1 * R * p, cy + y2 * R * p, z2, p, Math.abs(Math.sin(tw)) ]);
        }
      }
      pts.sort(function (a, b) { return b[2] - a[2]; });
      for (var k = 0; k < pts.length; k++) {
        var q = pts[k]; var depth = (1 - (q[2] + 1.5) / 3); var a = Math.max(0.06, Math.min(1, depth));
        var mix = q[4];
        var r = Math.round(rgb[0] + (rgb2[0] - rgb[0]) * mix), g = Math.round(rgb[1] + (rgb2[1] - rgb[1]) * mix), b = Math.round(rgb[2] + (rgb2[2] - rgb[2]) * mix);
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a * 0.9).toFixed(3) + ")";
        var s = 2.4 * q[3] * (small ? 0.8 : 1);
        ctx.beginPath(); ctx.arc(q[0], q[1], s, 0, 6.283); ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }
  if (!pre) startHero();
})();
