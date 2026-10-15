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

  /* ---------- De rand van het overgangsscherm: organische verfklodders (gooey) ---------- */
  const edgeH = () => Math.round(clamp(innerHeight * 0.2, 100, 220));
  function buildEdges() {
    if (!curtain) return;
    const E = edgeH(), W = innerWidth;
    curtain.style.setProperty('--edge', E + 'px');
    $$('.curtain__edge', curtain).forEach((n) => n.remove());
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const NS = 'http://www.w3.org/2000/svg';
    for (const side of ['top', 'bottom']) {
      const up = side === 'top', id = 'goo-' + side;
      const y0 = up ? E * 0.62 : E * 0.38;          // basislijn waar de rand aan het scherm vastzit
      let shapes = `<rect class="base" x="-80" y="${up ? y0 : -4}" width="${W + 160}" height="${up ? E - y0 + 4 : y0 + 4}" fill="var(--c-light)"/>`;
      const n = Math.ceil(W / (up ? 70 : 62));
      for (let i = 0; i <= n; i++) {
        const cx = (i + (rnd() - 0.5) * 0.7) * (W / n);
        const r = E * (up ? 0.14 + rnd() * 0.17 : 0.07 + rnd() * 0.1);
        const reach = E * (up ? 0.1 + rnd() * 0.5 : 0.18 + rnd() * 0.55);   // hoe ver de klodder uitsteekt
        const t = (1.2 + rnd() * 1.4).toFixed(2), d = (-rnd() * 2).toFixed(2), a = Math.round(4 + rnd() * 12);
        if (up) shapes += `<circle class="blob" cx="${cx.toFixed(1)}" cy="${(y0 - reach + r).toFixed(1)}" r="${r.toFixed(1)}" style="--t:${t}s;--d:${d}s;--a:${a}"/>`;
        else {
          // druppel: lange smalle ellips met een dikke druppelkop
          const len = reach, rx = r * 0.7;
          shapes += `<g class="blob" style="--t:${t}s;--d:${d}s;--a:${Math.round(a * 0.6)}"><ellipse cx="${cx.toFixed(1)}" cy="${(y0 + len / 2).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${(len / 2).toFixed(1)}"/><circle cx="${cx.toFixed(1)}" cy="${(y0 + len).toFixed(1)}" r="${(r * 1.05).toFixed(1)}"/></g>`;
        }
      }
      // losse druppeltjes die zweven
      for (let i = 0; i < Math.max(3, Math.round(W / 220)); i++) {
        const r = 5 + rnd() * 8, cx = rnd() * W;
        const cy = up ? y0 - E * (0.28 + rnd() * 0.3) : y0 + E * (0.35 + rnd() * 0.45);
        shapes += `<circle class="blob" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" style="--t:${(1 + rnd()).toFixed(2)}s;--d:${(-rnd()).toFixed(2)}s;--a:${Math.round(10 + rnd() * 16)}"/>`;
      }
      const svg = d.createElementNS(NS, 'svg');
      svg.setAttribute('class', `curtain__edge curtain__edge--${side}`);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('viewBox', `0 0 ${W} ${E}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.innerHTML = `<defs><filter id="${id}" x="-5%" y="-60%" width="110%" height="220%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="${Math.max(7, E * 0.06).toFixed(1)}" result="b"/><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -10"/></filter></defs><g filter="url(#${id})">${shapes}</g>`;
      curtain.appendChild(svg);
    }
  }
  buildEdges();
  { let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!leaving) buildEdges(); }, 200); }); }

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
      const hold = reduced ? 160 : 1050;   // zo lang blijft het logo met zijn animatie in beeld
      if (!reduced) curtain.classList.add('is-playing');
      const slide = curtain.animate([{ transform: 'translateY(0)' }, { transform: `translateY(calc(-100% - ${edgeH()}px))` }], { duration: 900, easing: EASE, delay: hold, fill: 'forwards' });
      setTimeout(ready, hold + 260);
      await slide.finished.catch(() => {});
      root.classList.remove('is-entering');
      curtain.classList.remove('is-playing');
      slide.cancel();
    } else {
      requestAnimationFrame(() => requestAnimationFrame(ready));
    }
  }

  /* ---------- Een pagina verlaten ---------- */
  async function leaveWithCurtain(href) {
    if (leaving) return;
    leaving = true;
    store.set('claro:curtain', String(Date.now()));
    curtain.classList.add('is-active');
    try {
      await curtain.animate([{ transform: `translateY(calc(100% + ${edgeH()}px))` }, { transform: 'translateY(0)' }], { duration: 750, easing: EASE, fill: 'forwards' }).finished;
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
    if (curtain) curtain.classList.remove('is-active', 'is-playing');
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

  /* ---------- Klantlogo's: strak bijsnijden en optisch even groot, zodat alles netjes uitlijnt ---------- */
  $$('.client__logo svg').forEach((svg) => {
    try {
      const b = svg.getBBox();
      if (!(b.width > 0 && b.height > 0)) return;
      const pad = Math.max(b.width, b.height) * 0.004;
      svg.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
      const ratio = b.width / b.height;
      const w = Math.max(70, Math.min(Math.sqrt(11000 * ratio), 76 * ratio, 200));
      svg.parentElement.style.setProperty('--w', Math.round(w) + 'px');
    } catch (e) {}
  });

  /* ---------- Diensten op touchscreens: ook een tik op het voorbeeldbeeld opent de dienst ---------- */
  $$('.service').forEach((li) => {
    const media = $('.service__media', li), link = $('.service__link', li);
    if (media && link) media.addEventListener('click', () => { if (matchMedia('(hover: none), (max-width: 900px)').matches) link.click(); });
  });

  /* ---------- Header-video wisselt mee als je je telefoon draait ---------- */
  const heroVid = $('video[data-src-m]');
  if (heroVid) {
    const mq = matchMedia('(max-aspect-ratio: 1/1)');
    mq.addEventListener('change', () => {
      const k = mq.matches ? 'm' : 'd';
      const src = heroVid.getAttribute('data-src-' + k), poster = heroVid.getAttribute('data-poster-' + k);
      if (poster) heroVid.poster = poster;
      if (src && !heroVid.src.endsWith(src)) { heroVid.src = src; heroVid.load(); if (!reduced) heroVid.play().catch(() => {}); }
    });
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

  enter();
})();
