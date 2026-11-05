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
  let pencilSpeed = 1.3, pencilBoost = 0, phase = 0;
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
  const revealEls = $$('[data-reveal], [data-split], .pcard');
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
    $('.menubtn__label', menuBtn).textContent = open ? 'Sluiten' : 'Menu';
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
    let tx = -200, ty = -200, x = -200, y = -200, active = false, raf = 0;
    const move = () => {
      x = lerp(x, tx, 0.28); y = lerp(y, ty, 0.28);
      bubble.style.setProperty('--x', `${x.toFixed(1)}px`);
      bubble.style.setProperty('--y', `${y.toFixed(1)}px`);
      raf = (active || Math.abs(x - tx) + Math.abs(y - ty) > 0.5) ? requestAnimationFrame(move) : 0;
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      const on = !!(e.target instanceof Element && e.target.closest('[data-case]'));
      if (on && !active) { x = tx; y = ty; }
      active = on;
      bubble.classList.toggle('is-on', on);
      if (on && !raf) raf = requestAnimationFrame(move);
    }, { passive: true });
    d.addEventListener('mouseleave', () => { active = false; bubble.classList.remove('is-on'); });
  }

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

  /* ---------- Intro en overgang: een potlood schrijft CLARO en drukt in de A ---------- */
  const intro = $('.intro');
  const isvg = intro && $('.intro__svg', intro);
  const ink = intro && $('.intro__ink', intro);
  const pencil = intro && $('.pencil', intro);
  const aFill = intro && $('.intro__afill', intro);
  const aReal = intro && $('.intro__a', intro);
  const word = intro && $('.intro__word', intro);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const setPencil = (x, y, rot, sc, op = 1) => {
    pencil.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${sc.toFixed(3)})`);
    pencil.style.opacity = op;
  };
  const writeY = (x) => 166 + 118 * Math.sin(x / 52) * Math.sin(x / 210 + 0.6);
  const A_X = 760, A_TOP = -70, A_IN = 205;

  /** Tijdlijn afspelen; fn(t in seconden). Resolve als de duur voorbij is. */
  function play(duration, fn) {
    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now) => {
        const t = (now - start) / 1000;
        fn(Math.min(t, duration));
        if (t < duration) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  function resetWord(full) {
    ink.setAttribute('width', full ? 2400 : 0);
    aFill.style.opacity = 1;
    aReal.style.opacity = 0;
    word.removeAttribute('transform');
  }

  /** Het potlood drukt van boven in de A; de dichte A wordt de potlood-A. */
  async function pressIntoA(dur = 0.75) {
    await play(dur, (t) => {
      const p = t / dur;
      const down = ease(seg(p, 0, 0.62));
      const y = lerp(A_TOP - 260, A_IN, down);
      setPencil(A_X, y, -90, 1, 1 - seg(p, 0.5, 0.72));
      const swap = seg(p, 0.48, 0.62);
      aFill.style.opacity = 1 - swap;
      aReal.style.opacity = swap;
      // het woord veert even in als het potlood drukt
      const squash = Math.sin(seg(p, 0.45, 0.95) * Math.PI) * 0.045;
      word.setAttribute('transform', `translate(0 ${(332 * squash).toFixed(1)}) scale(1 ${(1 - squash).toFixed(3)})`);
    });
    pencilBoost = 4;
  }

  async function longIntro() {
    resetWord(false);
    await play(2.15, (t) => {
      // 1. groot potlood komt binnen en wordt kleiner
      const inP = easeOut(seg(t, 0, 0.75));
      const sx = lerp(2300, -40, inP), sy = lerp(520, writeY(-40), inP);
      // 2. schrijven van links naar rechts
      const wP = seg(t, 0.75, 2.15);
      const tipX = lerp(-40, 1580, ease(wP));
      if (t < 0.75) setPencil(sx, sy, lerp(-8, -38, inP), lerp(2.6, 1, inP));
      else setPencil(tipX, writeY(tipX), -38 + Math.sin(t * 18) * 2, 1);
      ink.setAttribute('width', Math.max(0, tipX + 300 + 30));
    });
    // 3. potlood richting de A, rechtop
    const from = { x: 1580, y: writeY(1580) };
    await play(0.55, (t) => {
      const p = ease(t / 0.55);
      setPencil(lerp(from.x, A_X, p), lerp(from.y, A_TOP - 260, p), lerp(-38, -90, p), 1);
    });
    await pressIntoA(0.8);
  }

  /** Logo vliegt naar zijn plek bovenaan terwijl de achtergrond verdwijnt; anders een cirkel naar onderen. */
  async function leaveIntro() {
    const target = $('.top__logo .logo');
    const canFly = target && scrollY < 40 && !menuOpen;
    if (canFly) {
      const from = word.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const s = to.width / from.width;
      intro.classList.add('is-fade');
      intro.style.background = 'transparent';
      const box = isvg.getBoundingClientRect();
      await play(0.75, (t) => {
        const p = ease(t / 0.75);
        const sc = lerp(1, s, p);
        const left = lerp(from.left, to.left, p), top = lerp(from.top, to.top, p);
        const dx = left - box.left - (from.left - box.left) * sc;
        const dy = top - box.top - (from.top - box.top) * sc;
        isvg.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`;
        if (p > 0.15) intro.style.color = 'var(--ink)';
      });
      done();
    } else {
      intro.classList.add('is-out');
      await play(0.85, () => {});
      done();
    }
    function done() {
      root.classList.remove('is-intro', 'is-entering');
      intro.classList.remove('is-out', 'is-fade', 'is-in');
      intro.removeAttribute('style');
      isvg.removeAttribute('style');
      pencilBoost = 0;
    }
  }

  let leaving = false;
  function isInternal(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== '_self') return false;
    const href = a.getAttribute('href') || '';
    if (a.hasAttribute('download') || href.startsWith('#') || /^(mailto|tel):/.test(href)) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.hash) return false;
    return url;
  }
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    const url = isInternal(a, e);
    if (!url || leaving || !intro) return;
    e.preventDefault();
    if (reduced) { location.href = url.href; return; }
    leaving = true;
    resetWord(true);
    pencil.style.opacity = 0;
    intro.style.setProperty('--sx', `${((e.clientX || innerWidth / 2) / innerWidth) * 100}%`);
    intro.style.setProperty('--sy', `${((e.clientY || innerHeight / 2) / innerHeight) * 100}%`);
    intro.classList.remove('is-out', 'is-fade');
    void intro.offsetWidth;
    intro.classList.add('is-in');
    pencilBoost = 6;
    store.set('claro:swipe', '1');
    setTimeout(() => { if (menuOpen) setMenu(false); location.href = url.href; }, 820);
  });

  async function enter() {
    const isIntro = root.classList.contains('is-intro');
    const isEntering = root.classList.contains('is-entering');
    if (!intro || (!isIntro && !isEntering)) { startReveal(); return; }
    store.del('claro:swipe');
    store.set('claro:intro', '1');
    try {
      if (isIntro) await longIntro();
      else { resetWord(true); await pressIntoA(0.7); }
      startReveal();
      await leaveIntro();
    } catch (err) {
      root.classList.remove('is-intro', 'is-entering');
      startReveal();
    }
  }
  enter();
  addEventListener('pageshow', (e) => {
    if (e.persisted) {
      leaving = false;
      pencilBoost = 0;
      intro && intro.classList.remove('is-in', 'is-out', 'is-fade');
      root.classList.remove('is-intro', 'is-entering', 'menu-open');
    }
  });

  /* ---------- Wisselende woorden in het contactblok ---------- */
  $$('[data-rotator]').forEach((r) => {
    const words = $$('.rotator__word', r);
    if (words.length < 2 || reduced) return;
    let i = 0;
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      cur.classList.remove('is-on'); cur.classList.add('is-off');
      words[i].classList.remove('is-off'); words[i].classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-off'), 700);
    }, 2400);
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
