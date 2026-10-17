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
      const hold = reduced ? 160 : 1050;   // zo lang blijft het logo met zijn animatie in beeld
      if (!reduced) curtain.classList.add('is-playing');
      const slide = curtain.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-100%)` }], { duration: 900, easing: EASE, delay: hold, fill: 'forwards' });
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
      await curtain.animate([{ transform: `translateY(100%)` }, { transform: 'translateY(0)' }], { duration: 750, easing: EASE, fill: 'forwards' }).finished;
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
    // Op telefoons (en touchscreens) dezelfde overgang als de andere pagina's; de uitvergrote kaart blijft voor desktop.
    const touchLayout = matchMedia('(hover: none), (max-width: 900px)').matches;
    a.matches('[data-service]') && !touchLayout ? expandThenGo(a, url.href) : leaveWithCurtain(url.href);
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

  /* ---------- Knoppen: vulling start vanaf de plek waar de muis binnenkomt ---------- */
  if (finePointer) {
    $$('.btn, .cta-pill').forEach((el) => {
      el.addEventListener('pointerenter', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    });
  }

  /* ---------- Case-beelden groot bekijken (lightbox) ---------- */
  const lbTiles = $$('[data-lb]');
  if (lbTiles.length) {
    const lb = d.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Beeld groot bekijken');
    lb.innerHTML = '<div class="lb__stage"></div>' +
      '<button type="button" class="lb__close" aria-label="Sluiten"><span class="lb__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></span></button>' +
      '<button type="button" class="lb__nav lb__nav--prev" aria-label="Vorige"><span class="lb__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></span></button>' +
      '<button type="button" class="lb__nav lb__nav--next" aria-label="Volgende"><span class="lb__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg></span></button>' +
      '<p class="lb__info"><span class="lb__title"></span><span class="lb__count"></span></p>';
    body.appendChild(lb);
    const stage = $('.lb__stage', lb);
    const prevBtn = $('.lb__nav--prev', lb), nextBtn = $('.lb__nav--next', lb);
    let group = [], idx = 0, opener = null;

    const show = (i, dirn = 0) => {
      idx = (i + group.length) % group.length;
      const t = group[idx];
      const el = d.createElement(t.dataset.kind === 'image' ? 'img' : 'video');
      el.className = 'lb__asset';
      if (el.tagName === 'IMG') { el.src = t.dataset.src; el.alt = ''; }
      else {
        el.src = t.dataset.src; if (t.dataset.poster) el.poster = t.dataset.poster;
        el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; el.controls = true;
        el.setAttribute('playsinline', ''); el.play && el.play().catch(() => {});
      }
      if (dirn && !reduced) el.style.animation = `lb-in-${dirn > 0 ? 'r' : 'l'} 0.45s var(--ease-out)`;
      stage.replaceChildren(el);
      $('.lb__count', lb).textContent = group.length > 1 ? `${String(idx + 1).padStart(2, '0')} / ${String(group.length).padStart(2, '0')}` : '';
    };
    const open = (tile) => {
      const art = tile.closest('.case');
      group = $$('[data-lb]', art);
      opener = tile;
      $('.lb__title', lb).textContent = art.dataset.title || '';
      lb.classList.toggle('is-single', group.length < 2);
      show(group.indexOf(tile));
      lb.classList.add('is-open');
      root.classList.add('lb-open');
      $('.lb__close', lb).focus({ preventScroll: true });
    };
    const close = () => {
      if (!lb.classList.contains('is-open')) return;
      lb.classList.remove('is-open');
      root.classList.remove('lb-open');
      setTimeout(() => { if (!lb.classList.contains('is-open')) stage.replaceChildren(); }, 450);
      opener && opener.focus({ preventScroll: true });
    };
    const step = (n) => { if (group.length > 1) show(idx + n, n); };

    lbTiles.forEach((t) => t.addEventListener('click', () => open(t)));
    $('.lb__close', lb).addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) close(); });
    addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });
    let sx = 0, sy2 = 0;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy2 = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy2;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
    }, { passive: true });
  }

  /* ---------- Vet: titels woord voor woord uit een masker ---------- */
  const splitTargets = $$('.phero__title, .shero__title, .section-title, .cases__title, .clients__title, .services__title, .case__title, .snext__title');
  if (!reduced) {
    splitTargets.forEach((el) => {
      let n = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((ch) => {
          if (ch.nodeType === 3) {
            const frag = d.createDocumentFragment();
            ch.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
              const o = d.createElement('span'); o.className = 'sw';
              const i = d.createElement('span'); i.className = 'sw__i'; i.style.setProperty('--wi', n++); i.textContent = part;
              o.appendChild(i); frag.appendChild(o);
            });
            ch.replaceWith(frag);
          } else if (ch.nodeType === 1) walk(ch);
        });
      };
      walk(el);
      el.classList.add('split');
    });
  }

  /* ---------- Vet: grote "Let's chat!" letter voor letter ---------- */
  const ctaLabel = $('.cta-pill__label');
  if (ctaLabel && !reduced) {
    const txt = ctaLabel.textContent;
    ctaLabel.setAttribute('aria-label', txt);
    ctaLabel.innerHTML = [...txt].map((c, i) => `<span class="ch" aria-hidden="true" style="--ci:${i}">${c === ' ' ? '&nbsp;' : c.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join('');
  }

  /* ---------- Vet: titels, teamfoto's en Let's chat in beeld laten komen ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    // let op: een element met clip-path wordt door de observer als onzichtbaar gezien, dus we kijken naar de ouder
    const showIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const t = en.target;
        (t._show || [t]).forEach((el) => el.classList.add('is-shown'));
        showIO.unobserve(t);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.split, .cta-pill').forEach((el) => showIO.observe(el));
    $$('.person').forEach((pp) => { const ph = $('.person__photo', pp); if (ph) { pp._show = [ph]; showIO.observe(pp); } });
  } else {
    $$('.split, .person__photo, .cta-pill').forEach((el) => el.classList.add('is-shown'));
  }

  /* ---------- Footer: terug naar boven en groot logo dat omhoog schuift ---------- */
  $$('[data-to-top]').forEach((b) => b.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })));
  const footEl = $('.footer');
  if (footEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => footEl.classList.toggle('is-end', e.isIntersecting), { threshold: 0.6 }).observe($('.footer__giant', footEl) || footEl);
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

  /* ---------- Interactieve puntenachtergrond ---------- */
  (function dotFields() {
    if (reduced) return;
    const sections = $$('.intro, .services, .clients, .sintro, .story, .steps, .team, .phero');
    if (!sections.length) return;
    const GAP = 26, R = 240, DPR = Math.min(devicePixelRatio || 1, 1.5);
    const fields = [];

    sections.forEach((sec) => {
      const c = d.createElement('canvas');
      c.className = 'dots';
      c.setAttribute('aria-hidden', 'true');
      sec.prepend(c);
      sec.classList.add('has-dots');
      fields.push({ sec, c, ctx: c.getContext('2d'), w: 0, h: 0, n: 0, mx: -9999, my: -9999, inside: false, ripples: [], active: false, visible: false });
    });

    function build(f) {
      f.w = f.sec.clientWidth; f.h = f.sec.clientHeight;
      f.c.width = Math.round(f.w * DPR); f.c.height = Math.round(f.h * DPR);
      f.c.style.width = f.w + 'px'; f.c.style.height = f.h + 'px';
      const cols = Math.ceil(f.w / GAP) + 1, rows = Math.ceil(f.h / GAP) + 1;
      const offX = (f.w - (cols - 1) * GAP) / 2, offY = (f.h - (rows - 1) * GAP) / 2;
      f.n = cols * rows;
      f.bx = new Float32Array(f.n); f.by = new Float32Array(f.n);
      f.ox = new Float32Array(f.n); f.oy = new Float32Array(f.n);
      f.vx = new Float32Array(f.n); f.vy = new Float32Array(f.n);
      f.glow = new Float32Array(f.n); f.rx = new Float32Array(f.n); f.ry = new Float32Array(f.n);
      let i = 0;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++, i++) { f.bx[i] = offX + x * GAP; f.by[i] = offY + y * GAP; }
      draw(f);
    }

    function draw(f) {
      const g = f.ctx;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.clearRect(0, 0, f.w, f.h);
      // gewone punten in één pad
      g.fillStyle = 'rgba(174, 107, 255, 0.16)';
      g.beginPath();
      for (let i = 0; i < f.n; i++) {
        if (f.glow[i] > 0.04) continue;
        const x = f.bx[i] + f.ox[i] + f.rx[i], y = f.by[i] + f.oy[i] + f.ry[i];
        g.moveTo(x + 1.1, y); g.arc(x, y, 1.1, 0, 6.2832);
      }
      g.fill();
      // oplichtende punten
      for (let i = 0; i < f.n; i++) {
        const k = f.glow[i];
        if (k <= 0.04) continue;
        const x = f.bx[i] + f.ox[i] + f.rx[i], y = f.by[i] + f.oy[i] + f.ry[i];
        const r = 1.1 + k * 1.2;
        g.fillStyle = `rgba(${Math.round(174 + 26 * k)}, ${Math.round(107 + 43 * k)}, 255, ${(0.16 + k * 0.5).toFixed(3)})`;
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      }
    }

    function step(f, now) {
      let moving = false;
      const R2 = R * R;
      f.ripples = f.ripples.filter((rp) => now - rp.t < 2000);
      for (let i = 0; i < f.n; i++) {
        let fx = 0, fy = 0, glow = 0, rfx = 0, rfy = 0;
        const px = f.bx[i], py = f.by[i];
        if (f.inside) {
          const dx = px - f.mx, dy = py - f.my, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const dist = Math.sqrt(d2) || 1, s = 1 - dist / R, e = s * s * (3 - 2 * s);
            fx += (dx / dist) * e * 7; fy += (dy / dist) * e * 7;
            glow = Math.max(glow, e * 0.75);
          }
        }
        for (const rp of f.ripples) {
          const age = (now - rp.t) / 1000, dx = px - rp.x, dy = py - rp.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          // één zachte golf die naar buiten loopt
          const front = age * 480, off = (dist - front) / 75;
          if (off > -3 && off < 3) {
            const fade = Math.max(0, 1 - age / 2), band = Math.exp(-off * off) * fade * Math.min(1, (dist + 40) / 120);
            rfx += (dx / dist) * band * 14; rfy += (dy / dist) * band * 14;
            glow = Math.max(glow, band * 0.8);
          }
        }
        // rustig naar de doelpositie glijden, zonder na te veren
        const ddx = fx - f.ox[i], ddy = fy - f.oy[i];
        f.ox[i] += ddx * 0.07; f.oy[i] += ddy * 0.07;
        f.rx[i] = rfx; f.ry[i] = rfy;
        f.glow[i] += (glow - f.glow[i]) * (f.ripples.length ? 0.35 : 0.08);
        if (rfx !== 0 || rfy !== 0 || Math.abs(ddx) + Math.abs(ddy) > 0.05 || Math.abs(f.ox[i]) + Math.abs(f.oy[i]) > 0.05 || f.glow[i] > 0.01) moving = true;
      }
      draw(f);
      return moving || f.inside || f.ripples.length > 0;
    }

    let raf = 0;
    function loop(now) {
      raf = 0;
      let any = false;
      for (const f of fields) if (f.active && f.visible) { f.active = step(f, now); any = any || f.active; }
      if (any) raf = requestAnimationFrame(loop);
    }
    const wake = (f) => { f.active = true; if (!raf) raf = requestAnimationFrame(loop); };

    fields.forEach((f) => {
      const local = (e) => { const r = f.c.getBoundingClientRect(); f.mx = e.clientX - r.left; f.my = e.clientY - r.top; };
      if (finePointer) {
        f.sec.addEventListener('pointermove', (e) => { local(e); f.inside = true; wake(f); }, { passive: true });
        f.sec.addEventListener('pointerleave', () => { f.inside = false; wake(f); });
      }
      f.sec.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a, button, input, textarea, label')) return;
        local(e); f.ripples.push({ x: f.mx, y: f.my, t: performance.now() }); wake(f);
      }, { passive: true });
    });

    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      const f = fields.find((x) => x.sec === en.target);
      f.visible = en.isIntersecting;
      if (f.visible && !f.w) build(f);
    }), { rootMargin: '200px 0px' });
    fields.forEach((f) => io.observe(f.sec));

    let rt;
    const rebuild = () => fields.forEach((f) => { if (f.w && (f.sec.clientWidth !== f.w || f.sec.clientHeight !== f.h)) build(f); });
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(rebuild, 200); });
    addEventListener('load', rebuild);
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(rebuild, 200); }); fields.forEach((f) => ro.observe(f.sec)); }
  })();

  /* ---------- Scroll-effecten (één lus voor alles) ---------- */
  const heroSection = $('.hero, .shero');
  const heroMedia = $('[data-hero-media]');
  const wordBlocks = $$('[data-words]').map((el) => ({ el, words: $$('.w', el) }));
  const cta = $('[data-cta]');
  const marquee = $('[data-marquee]');
  const track = marquee && $('.marquee__track', marquee);
  if (track) {
    root.classList.add('js-marquee');
    // genoeg kopieën zodat de streamer op elk scherm gevuld blijft
    const fillMarquee = () => {
      const first = track.firstElementChild;
      const gw = first.offsetWidth;
      if (!gw) return;
      const need = Math.max(3, Math.ceil(innerWidth / gw) + 2);
      while (track.children.length < need) {
        const c = first.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
    };
    fillMarquee();
    addEventListener('resize', fillMarquee);
    addEventListener('load', fillMarquee);
  }

  let lastSy = scrollY, vel = 0, mx = 0, dir = 1;

  function tick() {
    const sy = scrollY;
    const vh = innerHeight;
    vel = lerp(vel, sy - lastSy, 0.14);
    lastSy = sy;

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
