/* ==========================================================================
   Claro, interactie
   Logo-animatie, menu, overgangen, scroll-effecten, "Bekijk case"-bubbel,
   filters, lightbox en het contactformulier. Geen externe bibliotheken.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const body = d.body;
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- Logo: de A is een potlood dat om zijn eigen as draait ---------- */
  const PRE = 'M665.98,327.39 C673.88,327.36 681.52,327.50 683.92,319.70';
  const SUF = 'L831.87,318.70 C834.10,326.79 841.58,327.47 850.30,327.47 L919.88,327.47 C919.69,327.47 830.44,50.64 830.44,50.64 C826.94,39.97 821.24,30.48 813.57,22.51 C804.88,13.48 794.18,7.63 782.32,3.85 C762.09,-2.60 740.71,-0.96 721.79,8.70 C703.25,18.16 690.65,32.77 684.56,52.92 L601.43,327.47Z M796.64,175.10 C795.50,178.05 788.17,177.79 783.02,177.85 L727.40,178.44 C725.36,178.46 723.66,177.65 722.76,176.46 C721.62,174.96 721.24,173.28 721.91,171.24 L754.15,72.74 C754.80,70.77 755.97,68.67 757.92,68.33 C760.19,67.94 761.90,69.94 762.66,72.12 L796.98,170.61 C797.55,172.25 797.21,173.60 796.64,175.09 Z';
  const L0 = [683.92, 319.7], L1 = [712.6, 226.7], R0 = [831.87, 318.7], R1 = [806.4, 225.7];
  const onLeg = (a, b, y) => a[0] + ((a[1] - y) / (a[1] - b[1])) * (b[0] - a[0]);
  function pencilPath(phase) {
    const TOP = 220.5, AMP = 26.5, N = 40;
    const yEnd = TOP + AMP * Math.abs(Math.sin(phase));
    const xl = onLeg(L0, L1, yEnd), xr = onLeg(R0, R1, yEnd), cx = (xl + xr) / 2, r = (xr - xl) / 2;
    let w = '';
    for (let i = 0; i <= N; i++) {
      const u = -Math.PI / 2 + (i / N) * Math.PI;
      w += ` L${(cx + r * Math.sin(u)).toFixed(1)},${(TOP + AMP * Math.abs(Math.sin(2 * u + phase))).toFixed(1)}`;
    }
    return `${PRE}${w} ${SUF}`;
  }
  const pencils = $$('.logo__pencil').map((el) => ({ el, on: true }));
  let pencilSpeed = 0.85, pencilBoost = 0, phase = 0;
  if (pencils.length && !reduced) {
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver((es) => es.forEach((e) => { const p = pencils.find((x) => x.el.closest('svg') === e.target); if (p) p.on = e.isIntersecting; }));
      pencils.forEach((p) => pio.observe(p.el.closest('svg')));
    }
    let last = 0;
    const spin = (t) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      phase += dt * (pencilSpeed + pencilBoost);
      const dStr = pencilPath(phase);
      for (const p of pencils) if (p.on) p.el.setAttribute('d', dStr);
      requestAnimationFrame(spin);
    };
    requestAnimationFrame(spin);
  }

  /* ---------- Titels: woord voor woord uit een masker ---------- */
  if (!reduced) {
    $$('[data-split]').forEach((el) => {
      let n = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((ch) => {
          if (ch.nodeType === 3) {
            const frag = d.createDocumentFragment();
            ch.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
              const o = d.createElement('span'); o.className = 'w';
              const i = d.createElement('i'); i.style.setProperty('--wi', n++); i.textContent = part;
              o.appendChild(i); frag.appendChild(o);
            });
            ch.replaceWith(frag);
          } else if (ch.nodeType === 1 && !ch.classList.contains('w')) {
            // een los element (zoals de punt) als geheel laten meebewegen
            const o = d.createElement('span'); o.className = 'w';
            const i = d.createElement('i'); i.style.setProperty('--wi', n++);
            ch.replaceWith(o); i.appendChild(ch); o.appendChild(i);
          }
        });
      };
      walk(el);
    });
  }

  /* ---------- In beeld komen ---------- */
  const revealEls = $$('[data-reveal], [data-split], .pcard, .process__track');
  let revealIO = null;
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  const startReveal = () => revealIO && revealEls.forEach((el) => revealIO.observe(el));

  /* ---------- Video's spelen alleen als je ze ziet ---------- */
  const videos = $$('video[data-autoplay]');
  if (reduced) {
    videos.forEach((v) => v.pause());
  } else if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}); } else v.pause();
      });
    }, { threshold: 0.15 });
    videos.forEach((v) => vio.observe(v));
  }

  /* ---------- Menu onderaan ---------- */
  const menuBtn = $('[data-menu-btn]');
  const menuEl = $('[data-menu]');
  let menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    if (open) setTimeout(() => $('.menu__link', menuEl)?.focus({ preventScroll: true }), 300);
  }
  if (menuBtn && menuEl) {
    menuBtn.addEventListener('click', () => setMenu(!menuOpen));
    menuEl.addEventListener('click', (e) => { if (e.target === menuEl) setMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---------- "Bekijk case"-bubbel ---------- */
  const bubble = $('.bubble');
  if (bubble && finePointer && !reduced) {
    root.classList.add('has-bubble');
    const bubbleText = $('.bubble__text', bubble);
    let tx = -200, ty = -200, x = -200, y = -200, active = false, raf = 0;
    const move = () => {
      x = lerp(x, tx, 0.28); y = lerp(y, ty, 0.28);
      bubble.style.setProperty('--x', `${x.toFixed(1)}px`);
      bubble.style.setProperty('--y', `${y.toFixed(1)}px`);
      raf = (active || Math.abs(x - tx) + Math.abs(y - ty) > 0.5) ? requestAnimationFrame(move) : 0;
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      const hit = e.target instanceof Element ? e.target.closest('[data-case]') : null;
      const on = !!hit;
      if (on) { const label = hit.dataset.bubble || 'Bekijk case'; if (bubbleText.textContent !== label) bubbleText.textContent = label; }
      if (on && !active) { x = tx; y = ty; }
      active = on;
      bubble.classList.toggle('is-on', on);
      if (on && !raf) raf = requestAnimationFrame(move);
    }, { passive: true });
    d.addEventListener('mouseleave', () => { active = false; bubble.classList.remove('is-on'); });
  }

  /* ---------- Muiscursor: stip en ring ---------- */
  if (finePointer && !reduced) {
    const cur = d.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cursor__dot"></span>';
    body.appendChild(cur);
    const dot = $('.cursor__dot', cur);
    let mx = -100, my = -100, rx = -100, ry = -100, raf = 0;
    const move = () => {
      rx = lerp(rx, mx, 0.35); ry = lerp(ry, my, 0.35);
      dot.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      raf = Math.abs(rx - mx) + Math.abs(ry - my) > 0.3 ? requestAnimationFrame(move) : 0;
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!cur.classList.contains('is-on')) { rx = mx; ry = my; cur.classList.add('is-on'); }
      const t = e.target instanceof Element ? e.target : null;
      cur.classList.toggle('is-link', !!(t && t.closest('a, button, label, .chip, [role="button"]')));
      cur.classList.toggle('is-hidden', !!(t && (t.closest('[data-case]') || t.closest('input, textarea'))));
      cur.classList.toggle('on-blue', !!(t && t.closest('main > .mod:nth-of-type(even), .menu__panel, .menubtn, .swipe, .btn--dark')));
      if (!raf) raf = requestAnimationFrame(move);
    }, { passive: true });
    d.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
  }

  /* ---------- Werkwijze: hoogte van de vaste titel doorgeven ---------- */
  $$('.process').forEach((pr) => {
    const head = $('.process__head', pr);
    if (!head) return;
    const set = () => pr.style.setProperty('--ph', `${head.offsetHeight}px`);
    set(); addEventListener('resize', set); addEventListener('load', set);
  });

  /* ---------- Contactblok: klik voor gekleurde balletjes die onderaan verzamelen ---------- */
  $$('[data-balls]').forEach((sec) => {
    const cv = $('.cta__balls', sec);
    const g = cv.getContext('2d');
    const COLORS = ['#2166ff', '#0a3fb8', '#ff8ad8', '#ffd25e', '#5ef2b4', '#3b2d28', '#ff7a59'];
    const LIFE = 5, FADE = 0.28;
    let W = 0, H = 0, dpr = 1, balls = [], raf = 0, last = 0;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = sec.clientWidth; H = sec.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
    };
    size(); addEventListener('resize', size);
    const spawn = (x, y) => {
      const n = 7 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 250 + Math.random() * 450;
        balls.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 9 + Math.random() * 17, c: COLORS[Math.floor(Math.random() * COLORS.length)], t: 0, life: LIFE - Math.random() * 1.2 });
      }
      if (balls.length > 160) balls.splice(0, balls.length - 160);
      if (!raf) { last = 0; raf = requestAnimationFrame(step); }
    };
    function step(now) {
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 0.016;
      last = now;
      for (const b of balls) {
        b.t += dt;
        b.vy += 1500 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y + b.r > H) { b.y = H - b.r; b.vy *= -0.32; b.vx *= 0.9; if (Math.abs(b.vy) < 30) b.vy = 0; }
        if (b.x - b.r < 0) { b.x = b.r; b.vx *= -0.5; }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx *= -0.5; }
      }
      // balletjes duwen elkaar weg, zodat ze op een hoopje liggen
      for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < min * min) {
          const d = Math.sqrt(d2), o = (min - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const k = rv * 0.55; a.vx += k * nx; a.vy += k * ny; b.vx -= k * nx; b.vy -= k * ny; }
        }
      }
      balls = balls.filter((b) => b.t < b.life);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      for (const b of balls) {
        const left = b.life - b.t;
        const s = left < FADE ? left / FADE : Math.min(1, b.t / 0.12);
        g.fillStyle = b.c;
        g.beginPath(); g.arc(b.x, b.y, Math.max(0.1, b.r * s), 0, 6.2832); g.fill();
      }
      raf = balls.length ? requestAnimationFrame(step) : 0;
    }
    sec.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      const r = sec.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top);
    });
  });

  /* ---------- Filters op de cases-pagina ---------- */
  const filters = $('[data-filters]');
  const grid = $('[data-grid]');
  if (filters && grid) {
    const cols = $$('.pgrid__col', grid);
    const cards = $$('.pcard', grid);
    const variants = ['tall', 'wide', 'square', 'wide', 'tall', 'square'];
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const f = btn.dataset.filter;
      $$('[data-filter]', filters).forEach((b) => b.classList.toggle('is-active', b === btn));
      let n = 0;
      cards.forEach((c) => {
        const show = !f || c.dataset.services.split(' ').includes(f);
        c.classList.toggle('is-hidden', !show);
        if (!show) return;
        c.className = c.className.replace(/pcard--\w+/, `pcard--${variants[n % variants.length]}`);
        cols[n % 2].appendChild(c);
        c.classList.remove('is-in');
        requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('is-in')));
        n++;
      });
    });
  }

  /* ---------- Scroll-effecten (één lus) ---------- */
  const heroMedia = $('[data-hero-media]');
  const hero = $('[data-hero]');
  const speedEls = $$('[data-speed]').map((el) => ({ el, s: parseFloat(el.dataset.speed) || 0 }));
  const stack = $('[data-stack]');
  const phones = stack ? $$('.phone', stack) : [];
  if (stack) stack.style.setProperty('--stack-n', String(Math.max(1, phones.length)));
  const wide = matchMedia('(min-width: 961px)');
  function tick() {
    const vh = innerHeight;
    if (!reduced) {
      // header-video wordt kleiner en vervaagt als je naar beneden scrolt
      if (hero && heroMedia) {
        const r = hero.getBoundingClientRect();
        const p = clamp(-r.top / (r.height * 0.9));
        heroMedia.style.transform = `translate3d(0, ${(p * 60).toFixed(1)}px, 0) scale(${(1 - p * 0.14).toFixed(4)})`;
        heroMedia.style.opacity = (1 - p * 0.75).toFixed(3);
      }
      // kaarten die met verschillende snelheden bewegen
      for (const { el, s } of speedEls) {
        if (!wide.matches) { el.style.transform = ''; continue; }
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - vh / 2) * -s;
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
      }
      // Over ons: staande beelden schuiven over elkaar heen
      if (stack && phones.length && wide.matches) {
        const r = stack.getBoundingClientRect();
        const total = r.height - vh;
        const p = clamp(-r.top / total) * phones.length;
        phones.forEach((ph, i) => {
          const local = clamp(p - i + 0.6);
          const y = (1 - local) * 110;
          const rot = (i % 2 ? 1 : -1) * (3 + i) * (1 - local * 0.4);
          ph.style.setProperty('--y', `${y.toFixed(2)}svh`);
          ph.style.setProperty('--r', `${rot.toFixed(2)}deg`);
        });
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- Overgang tussen pagina's ---------- */
  const swipe = $('.swipe');
  let leaving = false;
  function isInternal(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download') || /^(#|mailto:|tel:)/.test(a.getAttribute('href'))) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.hash) return false;
    return url;
  }
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    const url = isInternal(a, e);
    if (!url || leaving || !swipe) return;
    e.preventDefault();
    if (reduced) { location.href = url.href; return; }
    leaving = true;
    swipe.classList.remove('is-out');
    void swipe.offsetWidth;
    swipe.classList.add('is-in');
    root.classList.add('is-leaving');
    pencilBoost = 4;
    store.set('claro:swipe', '1');
    setTimeout(() => {
      if (menuOpen) setMenu(false);
      location.href = url.href;
    }, 1850);
  });
  function enter() {
    if (root.classList.contains('is-entering') && swipe) {
      store.del('claro:swipe');
      pencilBoost = 3;
      setTimeout(() => {
        swipe.classList.add('is-out');
        root.classList.add('is-arriving');
        root.classList.remove('is-entering');
        pencilBoost = 0;
        startReveal();
        setTimeout(() => { swipe.classList.remove('is-out'); root.classList.remove('is-arriving'); }, 1150);
      }, 200);
    } else {
      startReveal();
    }
  }
  enter();
  addEventListener('pageshow', (e) => {
    if (e.persisted) {
      leaving = false;
      pencilBoost = 0;
      swipe && swipe.classList.remove('is-in', 'is-out', 'is-reveal');
      root.classList.remove('is-entering', 'is-leaving', 'is-arriving', 'menu-open');
    }
  });

  /* ---------- Case-beelden groot bekijken (lightbox) ---------- */
  const lbTiles = $$('[data-lb]');
  if (lbTiles.length) {
    const lb = d.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Beeld groot bekijken');
    lb.innerHTML = '<div class="lb__stage"></div>' +
      '<button type="button" class="lb__close" aria-label="Sluiten"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '<button type="button" class="lb__nav lb__nav--prev" aria-label="Vorige"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></button>' +
      '<button type="button" class="lb__nav lb__nav--next" aria-label="Volgende"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg></button>' +
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
      group = lbTiles;
      opener = tile;
      $('.lb__title', lb).textContent = d.title.split(' | ')[0];
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


  /* ---------- Contactblok: het woord wisselt (helder, duidelijk, Claro) ---------- */
  $$('[data-swap]').forEach((sw) => {
    let words = [];
    try { words = JSON.parse(sw.dataset.swap); } catch (e) { return; }
    const escH = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const letters = (w) => [...w].map((ch, k) => `<i style="--k:${k}">${ch === ' ' ? '&nbsp;' : escH(ch)}</i>`).join('');
    let cur = $('.swap__word', sw);
    cur.innerHTML = letters(words[0]);
    const pad = () => { const cs = getComputedStyle(sw); return parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight); };
    const fit = (el) => { sw.style.width = `${el.offsetWidth + pad()}px`; };
    fit(cur);
    addEventListener('resize', () => fit(cur));
    if (words.length < 2 || reduced) return;
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      const next = d.createElement('span');
      next.className = 'swap__word is-in';
      next.innerHTML = letters(words[i]);
      cur.classList.add('is-out');
      sw.appendChild(next);
      fit(next);
      requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('is-in')));
      const old = cur;
      cur = next;
      setTimeout(() => old.remove(), 800);
    }, 2600);
  });

  /* ---------- Footer: golvende rand zoals de potloodpunt ---------- */
  const wave = $('.foot__wave');
  if (wave) {
    const wpath = $('path', wave);
    let wOn = false, wPhase = 0, wLast = 0;
    const drawWave = () => {
      const W = wave.clientWidth || innerWidth, H = 16, P = 46;
      wave.setAttribute('viewBox', `0 0 ${W} ${H}`);
      let dStr = `M0,${H}`;
      for (let x = 0; x <= W + 4; x += 4) {
        const y = 3 + 8 * Math.abs(Math.sin((Math.PI * x) / P + wPhase));
        dStr += ` L${x},${y.toFixed(1)}`;
      }
      wpath.setAttribute('d', `${dStr} L${W + 4},${H} Z`);
    };
    const waveLoop = (t) => {
      if (!wOn) { wLast = 0; return; }
      if (wLast) wPhase += ((t - wLast) / 1000) * 0.9;
      wLast = t;
      drawWave();
      requestAnimationFrame(waveLoop);
    };
    drawWave();
    addEventListener('resize', drawWave);
    if (!reduced && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { const was = wOn; wOn = e.isIntersecting; root.classList.toggle('on-foot', wOn); if (wOn && !was) requestAnimationFrame(waveLoop); }, { rootMargin: '0px 0px -60px 0px' }).observe($('.foot'));
    }
  }

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
      } catch (err) {
        status.textContent = 'Versturen is niet gelukt. Probeer het later opnieuw of stuur ons direct een e-mail.';
      } finally {
        form.classList.remove('is-sending');
      }
    });
  }
})();
