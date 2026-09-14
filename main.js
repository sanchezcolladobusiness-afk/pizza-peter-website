/* ==========================================================================
   PIZZA FRATELLI – main.js
   Pizza-Navigation (8 Stücke mit Käsefäden), Scroll-Choreografie,
   Menü, FAQ, Anfrage-Formular
   ========================================================================== */
'use strict';

/* ---------------------------------------------------------------------------
   KONFIGURATION – HIER ANPASSEN
   Alle Werte mit „PLATZHALTER“ sind noch nicht echt.
   --------------------------------------------------------------------------- */
const CONFIG = {
  phoneDisplay: '0170 000 00 00',        // PLATZHALTER – so wird die Nummer angezeigt
  phoneLink:    '+491700000000',         // PLATZHALTER – Nummer für den Anruf-Link (international, ohne Leerzeichen)
  email:        'hallo@pizza-fratelli.de',  // PLATZHALTER
  instagram:    'pizzafratelli.odenwald',   // PLATZHALTER – Instagram-Name ohne @
  whatsapp:     '491700000000',          // PLATZHALTER – Ländervorwahl ohne + und ohne führende 0
  teamNames:    ['', '', '', ''],        // Namen zu den 4 Team-Fotos (leer = nur Rolle anzeigen)
};

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqMobile = window.matchMedia('(max-width: 900px)');
const isMobile = () => mqMobile.matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------------------------------------------------------------------
   Konfiguration in die Seite schreiben
   --------------------------------------------------------------------------- */
function applyConfig() {
  $$('[data-config]').forEach((el) => {
    const value = CONFIG[el.dataset.config];
    if (value == null || value === '') return;
    const text = (el.dataset.prefix || '') + value + (el.dataset.suffix || '');
    if (el.dataset.attr) el.setAttribute(el.dataset.attr, text);
    else el.textContent = text;
  });
  $$('[data-team-name]').forEach((el) => {
    const name = CONFIG.teamNames[+el.dataset.teamName] || '';
    el.textContent = name;
    el.hidden = !name;
  });
  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

/* ---------------------------------------------------------------------------
   Pizza-Engine
   --------------------------------------------------------------------------- */
function createPizza() {
  const svg = $('#pizza-svg');
  const stage = $('.stage');
  if (!svg || !stage) return null;

  const NS = 'http://www.w3.org/2000/svg';
  const root = svg.querySelector('#pizza');
  const C = 300;            // Mittelpunkt im viewBox 0 0 600 600
  const PULL = 68;          // maximaler Auszug eines Stücks (viewBox-Einheiten)
  const LABEL_R = 150;      // Radius der Label-Sticker
  const caption = $('.stage__caption');

  const sliceEls = $$('.slice', root).sort((a, b) => +a.dataset.i - +b.dataset.i);
  if (sliceEls.length !== 8) console.warn('Pizza: erwartet 8 Stücke, gefunden', sliceEls.length);

  // Teller unter der Pizza (sichtbar, wenn ein Stück herausgezogen ist)
  const plate = document.createElementNS(NS, 'circle');
  plate.setAttribute('cx', C); plate.setAttribute('cy', C); plate.setAttribute('r', 262);
  plate.setAttribute('fill', '#E6E1D3'); plate.setAttribute('opacity', '.9');
  root.insertBefore(plate, root.firstChild);

  // Käsefäden liegen UNTER den Stücken, Labels darüber
  const stringsG = document.createElementNS(NS, 'g');
  stringsG.setAttribute('id', 'strings');
  root.insertBefore(stringsG, sliceEls[0]);
  const labelsG = document.createElementNS(NS, 'g');
  labelsG.setAttribute('id', 'labels');
  root.appendChild(labelsG);

  const slices = sliceEls.map((el, i) => {
    const angleDeg = +el.dataset.angle;
    const a = (angleDeg * Math.PI) / 180;
    const panel = $(`.panel[data-slice="${el.dataset.i}"]`);
    const labelText = el.dataset.label || (panel && panel.dataset.label) || '';

    // Sticker-Label
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'slice-label');
    g.setAttribute('aria-hidden', 'true');
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('rx', '17'); rect.setAttribute('ry', '17');
    rect.setAttribute('height', '34'); rect.setAttribute('y', '-17');
    rect.setAttribute('width', '90'); rect.setAttribute('x', '-45');
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('y', '1');
    text.textContent = labelText;
    g.append(rect, text);
    labelsG.appendChild(g);

    // Anker für Käsefäden: je Schnittkante 3 Punkte (deterministisch leicht versetzt)
    const anchors = [];
    [-1, 1].forEach((side) => {
      [96, 150, 206].forEach((r, k) => {
        const jitter = (((i * 7 + k * 5 + (side > 0 ? 3 : 0)) * 13) % 17) - 8;
        anchors.push({ r: r + jitter, side });
      });
    });
    const strings = anchors.map(() => {
      const outer = document.createElementNS(NS, 'path');
      outer.setAttribute('fill', 'none'); outer.setAttribute('stroke', '#D9C27A'); outer.setAttribute('stroke-linecap', 'round');
      const inner = document.createElementNS(NS, 'path');
      inner.setAttribute('fill', 'none'); inner.setAttribute('stroke', '#F6EFD9'); inner.setAttribute('stroke-linecap', 'round');
      stringsG.append(outer, inner);
      return { outer, inner, on: false };
    });

    // Zugänglichkeit + Interaktion
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'link');
    el.setAttribute('aria-label', labelText ? `Zum Bereich ${labelText}` : `Stück ${i + 1}`);

    return { el, i, a, angleDeg, cur: 0, target: 0, hover: false, active: false, label: g, rect, text, panel, anchors, strings };
  });

  function measureLabels() {
    slices.forEach((s) => {
      let w = 90, h = 34;
      try { const b = s.text.getBBox(); w = b.width + 30; h = b.height + 12; } catch (e) { /* SVG noch nicht gerendert */ }
      s.rect.setAttribute('width', w.toFixed(1)); s.rect.setAttribute('x', (-w / 2).toFixed(1));
      s.rect.setAttribute('height', h.toFixed(1)); s.rect.setAttribute('y', (-h / 2).toFixed(1));
      s.rect.setAttribute('rx', (h / 2).toFixed(1)); s.rect.setAttribute('ry', (h / 2).toFixed(1));
    });
  }

  let rotCur = 0, rotTarget = 0, idle = true, running = false, activeIdx = -2, lastT = 0;
  const lerp = (a, b, k) => a + (b - a) * k;
  // Glättung pro Frame so skalieren, dass sie bei 60 Hz den Referenzwerten entspricht (120-Hz-Geräte laufen sonst doppelt so schnell)
  const ease = (k60, dt) => 1 - Math.pow(1 - k60, dt / 16.67);

  function frame(now) {
    const dt = lastT ? Math.min(50, now - lastT) : 16.67;
    lastT = now;
    let moving = false;
    if (idle && !REDUCED) rotTarget += 0.04 * (dt / 16.67);   // langsames Drehen, solange man im Hero ist
    if (Math.abs(rotTarget - rotCur) > 0.02) { rotCur = REDUCED ? rotTarget : lerp(rotCur, rotTarget, ease(0.07, dt)); moving = true; }
    else rotCur = rotTarget;
    root.setAttribute('transform', `rotate(${rotCur.toFixed(3)} ${C} ${C})`);

    // „unten“ (Schwerkraft) in Pizza-Koordinaten, damit die Fäden durchhängen
    const th = (rotCur * Math.PI) / 180;
    const gx = Math.sin(th), gy = Math.cos(th);

    for (const s of slices) {
      s.target = s.active ? 1 : (s.hover ? 0.5 : 0);
      if (Math.abs(s.target - s.cur) > 0.002) { s.cur = REDUCED ? s.target : lerp(s.cur, s.target, ease(0.1, dt)); moving = true; }
      else s.cur = s.target;

      const p = s.cur;
      const rotChanged = Math.abs(rotCur - (s.lastRot == null ? 1e9 : s.lastRot)) > 0.0005;
      if (Math.abs(p - (s.lastP == null ? 1e9 : s.lastP)) < 0.0005 && !rotChanged) continue;
      s.lastP = p; s.lastRot = rotCur;
      const d = (isMobile() && !stage.classList.contains('is-big') ? PULL * 1.1 : isMobile() ? PULL * 0.72 : PULL) * p;
      const dx = Math.cos(s.a) * d, dy = Math.sin(s.a) * d;
      s.el.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);

      const lx = C + Math.cos(s.a) * LABEL_R + dx;
      const ly = C + Math.sin(s.a) * LABEL_R + dy;
      s.label.setAttribute('transform', `translate(${lx.toFixed(2)} ${ly.toFixed(2)}) rotate(${(-rotCur).toFixed(3)}) scale(${(1 + (isMobile() ? 0.55 : 0.14) * p).toFixed(3)})`);

      s.anchors.forEach((an, k) => {
        const str = s.strings[k];
        if (p < 0.03) {
          if (str.on) { str.outer.removeAttribute('d'); str.inner.removeAttribute('d'); str.on = false; }
          return;
        }
        const e = s.a + an.side * (Math.PI / 8) * 1.03;      // knapp unter der Kante des Nachbarstücks
        const px = C + Math.cos(e) * an.r, py = C + Math.sin(e) * an.r;
        const qx = px + dx, qy = py + dy;
        const sag = 4 + 26 * p;
        const mx = (px + qx) / 2 + gx * sag, my = (py + qy) / 2 + gy * sag;
        const dPath = `M${px.toFixed(1)} ${py.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${qx.toFixed(1)} ${qy.toFixed(1)}`;
        const w = Math.max(2.2, 9 - 6 * p);
        str.outer.setAttribute('d', dPath); str.inner.setAttribute('d', dPath);
        str.outer.setAttribute('stroke-width', (w + 3).toFixed(2));
        str.inner.setAttribute('stroke-width', w.toFixed(2));
        str.on = true;
      });
    }

    if (moving || (idle && !REDUCED)) requestAnimationFrame(frame);
    else { running = false; lastT = 0; }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

  function setCaption(i) {
    if (!caption) return;
    if (i < 0) {
      caption.innerHTML = `<span class="stage__hint">${caption.dataset.hint || ''}</span>`;
    } else {
      const s = slices[i];
      caption.innerHTML = `<b>0${i + 1}</b><span class="dot"></span><span>${s.text.textContent}</span>`;
    }
  }

  function setActive(i, fromScroll) {
    if (fromScroll && lockTo >= 0 && i !== lockTo) return;   // Klick-Ziel hat Vorrang vor Zwischen-Panels
    if (i === lockTo) lockTo = -1;
    if (i === activeIdx) return;
    activeIdx = i;
    slices.forEach((s) => { s.active = s.i === i; s.label.classList.toggle('is-on', s.active || s.hover); });
    idle = i < 0;
    if (i >= 0) {
      const face = isMobile() ? 90 : 0;                 // aktives Stück zeigt zu den Texten (rechts bzw. unten)
      let want = face - slices[i].angleDeg;
      want += Math.round((rotCur - want) / 360) * 360;   // kürzester Drehweg
      rotTarget = want;
    }
    setCaption(i);
    kick();
  }

  let lockTo = -1, lockTimer = 0;
  function goTo(i) {
    const p = slices[i] && slices[i].panel;
    if (!p) return;
    lockTo = i; clearTimeout(lockTimer); lockTimer = setTimeout(() => { lockTo = -1; }, 1500);
    setActive(i);
    p.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  }

  // Hover per Sektor-Winkel (stabil, auch wenn das Stück unter dem Zeiger wegrutscht)
  function sliceAtPointer(ev) {
    const r = svg.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * 600 - C, y = (ev.clientY - r.top) / r.height * 600 - C;
    const dist = Math.hypot(x, y);
    if (dist > 268 + PULL || dist < 12) return -1;
    let ang = (Math.atan2(y, x) * 180 / Math.PI) - rotCur + 90;   // 0° = 12 Uhr, im Uhrzeigersinn
    ang = ((ang % 360) + 360) % 360;
    return Math.floor(ang / 45);
  }
  let hoverIdx = -1;
  function setHover(i) {
    if (i === hoverIdx) return;
    hoverIdx = i;
    slices.forEach((s) => { s.hover = s.i === i; s.label.classList.toggle('is-on', s.active || s.hover); });
    kick();
  }
  svg.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse') setHover(sliceAtPointer(ev)); });
  svg.addEventListener('pointerleave', () => setHover(-1));
  slices.forEach((s) => {
    s.el.addEventListener('focus', () => setHover(s.i));
    s.el.addEventListener('blur', () => setHover(-1));
    s.el.addEventListener('click', () => goTo(s.i));
    s.el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); goTo(s.i); } });
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureLabels);
  measureLabels();
  window.addEventListener('load', measureLabels);

  return { setActive, goTo, kick, measureLabels };
}

/* ---------------------------------------------------------------------------
   Scroll-Choreografie: welcher Bereich ist aktiv?
   --------------------------------------------------------------------------- */
function createScrollDirector(pizza) {
  const panels = $$('.panel');
  const stage = $('.stage');
  const topbar = $('.topbar');
  const navLinks = $$('.nav__link');
  let ticking = false;

  function update() {
    const stageH = isMobile() && stage ? stage.getBoundingClientRect().bottom : 0;
    const line = stageH + (window.innerHeight - stageH) * (isMobile() ? 0.42 : 0.5);
    let best = null;
    for (const p of panels) {
      const r = p.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) { best = p; break; }
    }
    if (!best) best = panels[0].getBoundingClientRect().top > line ? panels[0] : panels[panels.length - 1];
    const idx = best.dataset.slice != null ? +best.dataset.slice : -1;
    panels.forEach((p) => p.classList.toggle('is-active', p === best));
    if (stage) stage.classList.toggle('is-hero', idx < 0);
    if (stage) {
      const stickTop = parseFloat(getComputedStyle(stage).top) || 0;   // Andock-Höhe der Leiste (unter der Topbar)
      stage.classList.toggle('is-big', isMobile() && stage.getBoundingClientRect().top > stickTop + 1);
    }
    navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + best.id));
    if (pizza) pizza.setActive(idx, true);
    if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 30);
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', () => { if (pizza) { pizza.setActive(-2); pizza.measureLabels(); } update(); });
  update();
  return { update };
}

/* ---------------------------------------------------------------------------
   Reveal-Animationen
   --------------------------------------------------------------------------- */
function setupReveal() {
  const targets = $$('.panel, .marquee, .footer, [data-reveal-group]');
  if (!('IntersectionObserver' in window) || REDUCED) { targets.forEach((t) => t.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  targets.forEach((t) => io.observe(t));
}

/* ---------------------------------------------------------------------------
   Menü (mobil)
   --------------------------------------------------------------------------- */
function setupMenu() {
  const burger = $('.burger');
  if (!burger) return;
  const toggle = (open) => {
    const isOpen = open != null ? open : !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) { menuScrollY = window.scrollY; document.body.style.position = 'fixed'; document.body.style.top = `-${menuScrollY}px`; document.body.style.width = '100%'; setTimeout(() => { const first = $('.menu-overlay a'); if (first) first.focus(); }, 350); }
    else { document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = ''; window.scrollTo(0, menuScrollY); burger.focus(); }
  };
  let menuScrollY = 0;
  burger.addEventListener('click', () => toggle());
  $$('.menu-overlay a').forEach((a) => a.addEventListener('click', () => toggle(false)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) toggle(false);
    if (e.key === 'Tab' && document.body.classList.contains('menu-open')) {   // Fokus im Menü halten
      const items = [burger, ...$$('.menu-overlay a')];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
}

/* ---------------------------------------------------------------------------
   FAQ
   --------------------------------------------------------------------------- */
function setupFaq() {
  $$('.faq__item').forEach((item) => {
    const btn = $('.faq__q', item);
    btn.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

/* ---------------------------------------------------------------------------
   Anfrage-Formular → E-Mail / WhatsApp
   --------------------------------------------------------------------------- */
function setupForm() {
  const form = $('#anfrage');
  if (!form) return;
  const compose = () => {
    const f = new FormData(form);
    const lines = [
      `Hallo Pizza Fratelli,`,
      ``,
      `ich möchte eine Anfrage stellen:`,
      `Name: ${f.get('name') || '-'}`,
      `Anlass: ${f.get('anlass') || '-'}`,
      `Datum: ${fmtDate(f.get('datum'))}`,
      `Gäste: ${f.get('gaeste') || '-'}`,
      `Ort: ${f.get('ort') || '-'}`,
      ``,
      `${f.get('nachricht') || ''}`,
      ``,
      `Viele Grüße`,
      `${f.get('name') || ''}`,
    ];
    return { subject: `Anfrage ${f.get('anlass') || 'Event'} – ${fmtDate(f.get('datum')) === '-' ? 'Termin offen' : fmtDate(f.get('datum'))}`, body: lines.join('\n') };
  };
  const fmtDate = (v) => { if (!v) return '-'; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? `${m[3]}.${m[2]}.${m[1]}` : v; };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const { subject, body } = compose();
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    markSent();
  });
  const markSent = () => {
    const ok = $('.form__success', form);
    if (ok && !ok.textContent) ok.textContent = ok.dataset.text || '';
    form.classList.add('is-sent');
  };
  const wa = $('[data-whatsapp]');
  if (wa) wa.addEventListener('click', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const { body } = compose();
    markSent();
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
  });
}

/* ---------------------------------------------------------------------------
   Start
   --------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const safe = (fn, name) => { try { return fn(); } catch (err) { console.error('Pizza Fratelli:', name, err); return null; } };
  safe(applyConfig, 'config');
  const pizza = safe(createPizza, 'pizza');
  safe(() => createScrollDirector(pizza), 'scroll');
  safe(setupReveal, 'reveal');
  safe(setupMenu, 'menu');
  safe(setupFaq, 'faq');
  safe(setupForm, 'form');
  if (pizza) pizza.kick();
});
