/* ==========================================================================
   Claro, interactie
   Lamp-cursor, scroll-effecten, menu, paginatransities en het contactformulier.
   Geen externe bibliotheken nodig.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EASE = 'cubic-bezier(.76,0,.24,1)';

  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  const body = d.body;
  const header = $('#header');
  const curtain = $('.curtain');
  const mediaCurtain = $('.media-curtain');
  let leaving = false;
  let menuOpen = false;

  /* ---------- Hulp: een video of afbeelding maken ---------- */
  function makeAsset(info, cls) {
    let el;
    if (info.type === 'video') {
      el = d.createElement('video');
      el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true;
      el.setAttribute('playsinline', '');
      if (info.poster) el.poster = info.poster;
      el.src = info.src;
      el.addEventListener('loadedmetadata', () => {
        try { if (info.t && el.duration) el.currentTime = info.t % el.duration; } catch (e) {}
        el.play().catch(() => {});
      }, { once: true });
    } else {
      el = d.createElement('img');
      el.src = info.src; el.alt = '';
    }
    if (cls) el.className = cls;
    return el;
  }

  /* ---------- Binnenkomen op een pagina ---------- */
  function ready() {
    $$('[data-hero-in]').forEach((el, i) => el.style.setProperty('--n', i));
    body.classList.add('is-ready');
  }

  async function enter() {
    const raw = store.get('claro:media');
    if (root.classList.contains('is-entering-media') && raw && mediaCurtain) {
      const info = JSON.parse(raw);
      store.del('claro:media');
      const asset = makeAsset(info, 'media-curtain__asset');
      mediaCurtain.replaceChildren(asset);

      // laat de video op de hero verdergaan waar de overgang bleef
      const heroVid = $('.shero__asset');
      if (heroVid && heroVid.tagName === 'VIDEO' && info.type === 'video') {
        const sync = () => { try { if (info.t && heroVid.duration) heroVid.currentTime = info.t % heroVid.duration; } catch (e) {} heroVid.play().catch(() => {}); };
        heroVid.readyState >= 1 ? sync() : heroVid.addEventListener('loadedmetadata', sync, { once: true });
      }
      await Promise.race([
        new Promise((r) => { asset.addEventListener(info.type === 'video' ? 'loadeddata' : 'load', r, { once: true }); }),
        sleep(1200)
      ]);
      await sleep(140);
      ready();
      const fade = mediaCurtain.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 950, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      await fade.finished.catch(() => {});
      root.classList.remove('is-entering-media');
      fade.cancel();
      mediaCurtain.replaceChildren();
    } else if (root.classList.contains('is-entering') && curtain) {
      store.del('claro:curtain');
      const slide = curtain.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 900, easing: EASE, delay: 160, fill: 'forwards' });
      setTimeout(ready, 420);
      await slide.finished.catch(() => {});
      root.classList.remove('is-entering');
      slide.cancel();
    } else {
      requestAnimationFrame(() => requestAnimationFrame(ready));
    }
  }

  /* ---------- Een pagina verlaten ---------- */
  async function leaveWithCurtain(href) {
    if (leaving) return;
    leaving = true;
    store.set('claro:curtain', '1');
    try {
      await curtain.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 750, easing: EASE, fill: 'forwards' }).finished;
    } catch (e) {}
    location.href = href;
  }

  async function expandThenGo(link, href) {
    const li = link.closest('.service');
    const card = li && $('.service__card', li);
    const el = card && $('video, img', card);
    if (!card || !el) return leaveWithCurtain(href);
    if (leaving) return;
    leaving = true;

    const r = card.getBoundingClientRect();
    const w = card.offsetWidth, h = card.offsetHeight;
    const rot = parseFloat(getComputedStyle(li).getPropertyValue('--rot')) || 0;
    const radius = getComputedStyle(card).borderTopLeftRadius;
    const info = el.tagName === 'VIDEO'
      ? { type: 'video', src: el.currentSrc || ($('source', el) || {}).src, poster: el.poster, t: el.currentTime }
      : { type: 'image', src: el.currentSrc || el.src };

    const ghost = d.createElement('div');
    ghost.className = 'ghost';
    Object.assign(ghost.style, {
      left: `${r.left + r.width / 2 - w / 2}px`, top: `${r.top + r.height / 2 - h / 2}px`,
      width: `${w}px`, height: `${h}px`, transform: `rotate(${rot}deg)`, borderRadius: radius
    });
    ghost.appendChild(makeAsset(info));
    body.appendChild(ghost);
    card.style.visibility = 'hidden';

    header && header.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: 'forwards' });
    try {
      await ghost.animate([
        { left: ghost.style.left, top: ghost.style.top, width: `${w}px`, height: `${h}px`, transform: `rotate(${rot}deg)`, borderWidth: '3px', borderRadius: radius },
        { left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px`, transform: 'rotate(0deg)', borderWidth: '0px', borderRadius: '0px' }
      ], { duration: 1000, easing: EASE, fill: 'forwards' }).finished;
    } catch (e) {}

    const gv = $('video', ghost);
    if (gv) info.t = gv.currentTime;
    store.set('claro:media', JSON.stringify(info));
    location.href = href;
  }

  d.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;

    const samePage = url.pathname === location.pathname;
    if (samePage && url.hash) { if (menuOpen) setMenu(false); return; }
    if (samePage) { e.preventDefault(); if (menuOpen) setMenu(false); scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
    if (reduced) return;
    e.preventDefault();
    a.matches('[data-service]') ? expandThenGo(a, url.href) : leaveWithCurtain(url.href);
  });

  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    $$('.ghost').forEach((g) => g.remove());
    $$('.service__card').forEach((c) => (c.style.visibility = ''));
    [curtain, header].forEach((n) => n && n.getAnimations().forEach((a) => a.cancel()));
    root.classList.remove('is-entering', 'is-entering-media');
    body.classList.add('is-ready');
  });

  /* ---------- Menu ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    if (open) {
      menu.removeAttribute('inert');
      setTimeout(() => { const first = $('a', menu); first && first.focus({ preventScroll: true }); }, 500);
    } else {
      menu.setAttribute('inert', '');
    }
  }
  burger && burger.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches && menuOpen) setMenu(false); });

  /* ---------- Header: verbergt bij omlaag scrollen, komt terug bij omhoog ---------- */
  let lastY = scrollY;
  function headerScroll() {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 40);
    if (!menuOpen) {
      if (y > lastY + 6 && y > 320) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 40) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  addEventListener('scroll', headerScroll, { passive: true });
  headerScroll();

  /* ---------- Lamp-cursor ---------- */
  let lamp, glowPos, corePos;
  const L = { tx: innerWidth / 2, ty: innerHeight / 2, gx: 0, gy: 0, cx: 0, cy: 0, seen: false };
  if (finePointer) {
    lamp = d.createElement('div');
    lamp.className = 'lamp';
    lamp.setAttribute('aria-hidden', 'true');
    lamp.innerHTML = '<div class="lamp__pos"><i class="lamp__glow"></i></div><div class="lamp__pos"><i class="lamp__core"></i></div>';
    body.appendChild(lamp);
    [glowPos, corePos] = $$('.lamp__pos', lamp);
    root.classList.add('has-lamp');

    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      L.tx = e.clientX; L.ty = e.clientY;
      if (!L.seen) { L.seen = true; L.gx = L.cx = L.tx; L.gy = L.cy = L.ty; lamp.classList.add('is-on'); }
      const t = e.target;
      if (!(t instanceof Element)) return;
      lamp.classList.toggle('is-hover', !!t.closest('a, button, label, .chip, summary'));
      lamp.classList.toggle('is-text', !!t.closest('input[type=text], input[type=email], textarea'));
      const zone = t.closest('[data-lamp]');
      lamp.classList.toggle('lamp--light', !!zone && zone.dataset.lamp === 'light');
    }, { passive: true });
    root.addEventListener('mouseleave', () => lamp.classList.remove('is-on'));
    root.addEventListener('mouseenter', () => L.seen && lamp.classList.add('is-on'));
    addEventListener('pointerdown', () => lamp.classList.add('is-down'));
    addEventListener('pointerup', () => lamp.classList.remove('is-down'));
  }

  /* ---------- Magnetische knoppen en vulling vanaf de muis ---------- */
  if (finePointer && !reduced) {
    $$('.btn, .cta-pill').forEach((el) => {
      const strength = el.classList.contains('cta-pill') ? 0.04 : 0.22;
      const max = el.classList.contains('cta-pill') ? 18 : 9;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${clamp(dx * strength, -max, max)}px ${clamp(dy * strength, -max, max)}px`;
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  /* ---------- Onthullen bij scrollen ---------- */
  const revealEls = $$('[data-reveal], .intro__logo');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Video's: spelen alleen als je ze ziet ---------- */
  const videos = $$('video');
  if (!finePointer) videos.forEach((v) => { if (v.dataset.play === 'hover') v.dataset.play = 'auto'; });
  if (reduced) {
    videos.forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  } else if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.2 });
    videos.filter((v) => v.dataset.play !== 'hover').forEach((v) => vio.observe(v));
  }

  /* ---------- Diensten: schuine voorbeeldbeelden die de muis volgen ---------- */
  const hovered = new Set();
  $$('.service').forEach((li) => {
    const v = $('video', li);
    const newTilt = () => li.style.setProperty('--rot', `${(Math.random() < 0.5 ? -1 : 1) * rand(2, 5)}deg`); // altijd tussen -5 en 5 graden
    newTilt();
    li._mx = 0; li._cur = 0;
    if (!finePointer) return;
    let pauseTimer;
    const start = () => { clearTimeout(pauseTimer); if (!hovered.has(li)) { newTilt(); hovered.add(li); } if (v) v.play().catch(() => {}); };
    const stop = () => { li._mx = 0; pauseTimer = setTimeout(() => { if (v && !li.matches(':hover, :focus-within')) v.pause(); }, 600); };
    li.addEventListener('pointerenter', start);
    li.addEventListener('focusin', start);
    li.addEventListener('pointerleave', stop);
    li.addEventListener('focusout', stop);
    li.addEventListener('pointermove', (e) => {
      const r = li.getBoundingClientRect();
      li._mx = clamp(e.clientX - (r.left + r.width * 0.53), -r.width * 0.3, r.width * 0.3) * 0.4;
    }, { passive: true });
  });

  /* ---------- Scroll-effecten (één lus voor alles) ---------- */
  const heroSection = $('.hero, .shero');
  const heroMedia = $('[data-hero-media]');
  const wordBlocks = $$('[data-words]').map((el) => ({ el, words: $$('.w', el) }));
  const cta = $('[data-cta]');
  const marquee = $('[data-marquee]');
  const track = marquee && $('.marquee__track', marquee);
  if (track) root.classList.add('js-marquee');

  let lastSy = scrollY, vel = 0, mx = 0, dir = 1;

  function tick() {
    const sy = scrollY;
    const vh = innerHeight;
    vel = lerp(vel, sy - lastSy, 0.14);
    lastSy = sy;

    // lamp
    if (lamp && L.seen) {
      const f = reduced ? 1 : 0.13;
      L.gx = lerp(L.gx, L.tx, f); L.gy = lerp(L.gy, L.ty, f);
      L.cx = lerp(L.cx, L.tx, reduced ? 1 : 0.5); L.cy = lerp(L.cy, L.ty, reduced ? 1 : 0.5);
      glowPos.style.transform = `translate3d(${L.gx}px, ${L.gy}px, 0)`;
      corePos.style.transform = `translate3d(${L.cx}px, ${L.cy}px, 0)`;
    }

    // header-video: parallax, lichte zoom en donker worden
    if (heroSection && heroMedia && !reduced) {
      const h = heroSection.offsetHeight;
      const p = clamp(sy / h);
      if (sy < h * 1.2) {
        heroMedia.style.transform = `translate3d(0, ${(p * h * 0.2).toFixed(1)}px, 0) scale(${(1 + p * 0.07).toFixed(4)})`;
        heroSection.style.setProperty('--veil', (p * 0.8).toFixed(3));
      }
    }

    // streamer: loopt door, sneller en in de richting van je scroll
    if (track) {
      if (vel > 0.6) dir = 1; else if (vel < -0.6) dir = -1;
      const gw = track.firstElementChild.offsetWidth;
      mx -= (reduced ? 0 : (0.9 + Math.min(Math.abs(vel), 40) * 0.45)) * dir;
      if (gw) { if (mx <= -gw) mx += gw; if (mx > 0) mx -= gw; }
      track.style.transform = `translate3d(${mx.toFixed(2)}px, 0, 0)`;
    }

    // tekst die oplicht tijdens het scrollen
    for (const { el, words } of wordBlocks) {
      if (reduced) break;
      const r = el.getBoundingClientRect();
      const start = vh * 0.9, end = vh * 0.3;
      const p = clamp((start - r.top) / (start - end + r.height * 0.4));
      const n = words.length;
      for (let i = 0; i < n; i++) {
        const local = clamp(p * (n + 3) - i);
        words[i].style.opacity = (0.2 + local * 0.8).toFixed(3);
      }
    }

    // grote knop in de footer groeit mee
    if (cta && !reduced) {
      const r = cta.getBoundingClientRect();
      cta.style.setProperty('--p', clamp((vh - r.top) / (vh * 0.55)).toFixed(3));
    }

    // diensten: zachte volg-beweging van het beeld
    hovered.forEach((li) => {
      li._cur = lerp(li._cur, li._mx, 0.1);
      li.style.setProperty('--mx', `${li._cur.toFixed(1)}px`);
      if (!li.matches(':hover, :focus-within') && Math.abs(li._cur) < 0.5) hovered.delete(li);
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- Contactformulier ---------- */
  const form = $('[data-form]');
  if (form) {
    const status = $('.form__status', form);
    const success = $('.form-success');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.classList.add('is-sending');
      status.textContent = 'Bezig met versturen…';
      try {
        const params = new URLSearchParams();
        for (const [k, v] of new FormData(form)) params.append(k, v);
        const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
        if (!res.ok) throw new Error(`status ${res.status}`);
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      } catch (err) {
        status.textContent = 'Versturen is niet gelukt. Probeer het later opnieuw of stuur ons direct een e-mail.';
      } finally {
        form.classList.remove('is-sending');
      }
    });
  }

  /* ---------- Footer-speeltuin: blokken met zwaartekracht ---------- */
  function initPlayground() {
    const box = $('[data-playground]');
    if (!box) return;
    const COLORS = ['#2f0668', '#1f0044', '#4a12a0', '#6d2fd0', '#8a4de8', '#2f0668', '#5a1fb8', '#e2c8ff'];
    const G = 2200;            // zwaartekracht (px/s²)
    const R_FRAC = 0.3;        // hoekradius t.o.v. blokgrootte (zelfde als CSS border-radius: 30%)
    const floor = { invM: 0, invI: 0, vx: 0, vy: 0, w: 0 };
    let W = box.clientWidth, H = box.clientHeight;
    let bodies = [], grab = null, raf = 0, last = 0, calm = 0, started = false;

    function make(i, n) {
      const base = clamp(W * 0.085, 50, 120);
      const s = base * rand(0.72, 1.28);
      const r = s * R_FRAC, h = s / 2 - r, m = s * s * 0.01;
      const el = d.createElement('div');
      el.className = 'cube';
      el.style.cssText = `width:${s}px;height:${s}px;--cube:${COLORS[i % COLORS.length]}`;
      box.appendChild(el);
      const pts = [];
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) if (a || b) pts.push([a * h, b * h]);
      return {
        el, s, r, pts, invM: 1 / m, invI: 1 / (m * s * s / 6),
        x: rand(s, Math.max(s * 1.5, W - s)), y: -s * (1 + i * 0.9) - rand(0, 60),
        a: rand(0, Math.PI * 2), vx: rand(-80, 80), vy: rand(0, 200), w: rand(-3, 3)
      };
    }

    // Eén contact oplossen met een impuls (met wrijving en een zachte positiecorrectie).
    function contact(A, B, nx, ny, px, py, pen) {
      const rax = px - A.x, ray = py - A.y, rbx = px - B.x, rby = py - B.y;
      const vx = (B.vx - B.w * rby) - (A.vx - A.w * ray);
      const vy = (B.vy + B.w * rbx) - (A.vy + A.w * rax);
      const vn = vx * nx + vy * ny;
      const ran = rax * ny - ray * nx, rbn = rbx * ny - rby * nx;
      const kn = A.invM + B.invM + ran * ran * A.invI + rbn * rbn * B.invI;
      if (vn < 0) {
        const j = -(1 + (vn < -260 ? 0.28 : 0)) * vn / kn;
        A.vx -= j * nx * A.invM; A.vy -= j * ny * A.invM; A.w -= ran * j * A.invI;
        B.vx += j * nx * B.invM; B.vy += j * ny * B.invM; B.w += rbn * j * B.invI;
        const tx = -ny, ty = nx;
        const vt = vx * tx + vy * ty;
        const rat = rax * ty - ray * tx, rbt = rbx * ty - rby * tx;
        const kt = A.invM + B.invM + rat * rat * A.invI + rbt * rbt * B.invI;
        const jt = clamp(-vt / kt, -0.55 * j, 0.55 * j);
        A.vx -= jt * tx * A.invM; A.vy -= jt * ty * A.invM; A.w -= rat * jt * A.invI;
        B.vx += jt * tx * B.invM; B.vy += jt * ty * B.invM; B.w += rbt * jt * B.invI;
      }
      const corr = Math.max(pen - 0.2, 0) * 0.8 / (A.invM + B.invM);
      A.x -= nx * corr * A.invM; A.y -= ny * corr * A.invM;
      B.x += nx * corr * B.invM; B.y += ny * corr * B.invM;
    }

    function world(b) {
      const c = Math.cos(b.a), sn = Math.sin(b.a);
      return b.pts.map(([px, py]) => [b.x + px * c - py * sn, b.y + px * sn + py * c]);
    }

    function step(dt) {
      for (const b of bodies) {
        b.vy += G * dt;
        b.vx *= 1 - 0.05 * dt; b.vy *= 1 - 0.05 * dt; b.w *= 1 - 0.35 * dt;
      }
      if (grab) {
        const b = grab.b, c = Math.cos(b.a), sn = Math.sin(b.a);
        const rx = grab.lx * c - grab.ly * sn, ry = grab.lx * sn + grab.ly * c;
        const ex = grab.tx - (b.x + rx), ey = grab.ty - (b.y + ry);
        const ax = ex * 260 - b.vx * 24, ay = ey * 260 - b.vy * 24;
        b.vx += ax * dt; b.vy += ay * dt;
        b.w += ((rx * ay - ry * ax) * b.invI / b.invM) * dt;
        b.w *= 0.94;
      }
      for (const b of bodies) { b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt; }
      for (let it = 0; it < 4; it++) {
        const ws = bodies.map(world);
        for (let i = 0; i < bodies.length; i++) {
          const A = bodies[i];
          for (let k = 0; k < ws[i].length; k++) {
            const [px, py] = ws[i][k], r = A.r;
            // wanden (links, rechts, vloer). Boven blijft open zodat blokken kunnen invallen.
            if (px - r < 0) contact(floor, A, 1, 0, px - r, py, -(px - r));
            else if (px + r > W) contact(floor, A, -1, 0, px + r, py, px + r - W);
            if (py + r > H) contact(floor, A, 0, -1, px, py + r, py + r - H);
          }
          for (let j = i + 1; j < bodies.length; j++) {
            const B = bodies[j], reach = (A.s + B.s) * 0.72;
            if (Math.abs(A.x - B.x) > reach || Math.abs(A.y - B.y) > reach) continue;
            let best = null;
            for (const [ax, ay] of ws[i]) for (const [bx, by] of ws[j]) {
              const dx = bx - ax, dy = by - ay, rr = A.r + B.r, d2 = dx * dx + dy * dy;
              if (d2 < rr * rr && d2 > 1e-6) {
                const dist = Math.sqrt(d2), pen = rr - dist;
                if (!best || pen > best.pen) best = { nx: dx / dist, ny: dy / dist, px: ax + dx * 0.5, py: ay + dy * 0.5, pen };
              }
            }
            if (best) contact(A, B, best.nx, best.ny, best.px, best.py, best.pen);
          }
        }
      }
    }

    function draw() {
      for (const b of bodies) b.el.style.transform = `translate(${(b.x - b.s / 2).toFixed(1)}px,${(b.y - b.s / 2).toFixed(1)}px) rotate(${b.a.toFixed(3)}rad)`;
    }

    function frame(t) {
      const dt = Math.min((t - last) / 1000 || 0.016, 1 / 30);
      last = t;
      const n = 4;
      for (let i = 0; i < n; i++) step(dt / n);
      draw();
      const moving = grab || bodies.some((b) => Math.abs(b.vx) + Math.abs(b.vy) > 14 || Math.abs(b.w) > 0.25 || b.y < 0);
      calm = moving ? 0 : calm + dt;
      raf = calm > 1 ? 0 : requestAnimationFrame(frame);
    }
    function wake() { calm = 0; if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    function start() {
      if (started) return;
      started = true;
      const n = W < 600 ? 10 : 18;
      bodies = Array.from({ length: n }, (_, i) => make(i, n));
      if (reduced) {                       // geen animatie: meteen in rust gevallen tonen
        bodies.forEach((b, i) => { b.y = H * 0.3 + (i % 4) * 20; b.vy = 0; });
        for (let i = 0; i < 600; i++) step(1 / 240);
        draw();
      } else wake();
    }

    // Pakken, slepen en loslaten (muis, touch en pen)
    box.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.cube');
      if (!el || reduced) return;
      const b = bodies.find((q) => q.el === el);
      if (!b) return;
      const rc = box.getBoundingClientRect();
      const tx = e.clientX - rc.left, ty = e.clientY - rc.top;
      const c = Math.cos(-b.a), sn = Math.sin(-b.a), dx = tx - b.x, dy = ty - b.y;
      grab = { b, tx, ty, lx: dx * c - dy * sn, ly: dx * sn + dy * c, id: e.pointerId };
      el.classList.add('is-grabbed');
      box.classList.add('is-played');
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      wake();
    });
    box.addEventListener('pointermove', (e) => {
      if (!grab || e.pointerId !== grab.id) return;
      const rc = box.getBoundingClientRect();
      const m = grab.b.s * 0.5;
      grab.tx = clamp(e.clientX - rc.left, m, W - m);
      grab.ty = clamp(e.clientY - rc.top, m, H - m);
      wake();
    });
    const release = (e) => {
      if (!grab || (e && e.pointerId !== grab.id)) return;
      grab.b.el.classList.remove('is-grabbed');
      grab = null;
      wake();
    };
    box.addEventListener('pointerup', release);
    box.addEventListener('pointercancel', release);

    new ResizeObserver(() => {
      const w = box.clientWidth, h = box.clientHeight;
      if (w === W && h === H) return;
      W = w; H = h;
      for (const b of bodies) { b.x = clamp(b.x, b.s / 2, W - b.s / 2); b.y = Math.min(b.y, H - b.s / 2); }
      if (reduced) { for (let i = 0; i < 300; i++) step(1 / 240); draw(); } else wake();
    }).observe(box);

    new IntersectionObserver((entries, io) => {
      if (entries.some((e) => e.isIntersecting)) { start(); io.disconnect(); }
    }, { threshold: 0.35 }).observe(box);
  }

  initPlayground();
  enter();
})();
