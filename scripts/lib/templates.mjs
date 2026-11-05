// HTML-templates voor alle pagina's. Alles is gewone tekst: geen framework nodig.
import { renderLogo } from './svg.mjs';

export const esc = (s = '') =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const ARROW = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11"/></svg>';
const ARROW_R = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const ARROW_L = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>';

const mime = (src) => (/\.webm(\?|$)/i.test(src) ? 'video/webm' : 'video/mp4');

/** Beeld of video. Video's spelen alleen af als ze in beeld zijn (zie main.js). */
export function media(m, { cls = '', alt = '', eager = false } = {}) {
  if (!m) return '';
  if (m.type === 'image') {
    return `<img class="${cls}" src="${esc(m.src)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }
  const poster = m.poster ? ` poster="${esc(m.poster)}"` : '';
  return `<video class="${cls}" muted loop playsinline preload="metadata"${poster} data-autoplay disablepictureinpicture aria-hidden="true"><source src="${esc(m.src)}" type="${mime(m.src)}"></video>`;
}

/** Titel waarvan de woorden één voor één uit een masker komen; de punt aan het eind krijgt de accentkleur. */
function title(text) {
  const t = String(text || '').trim();
  return t.endsWith('.') ? `${esc(t.slice(0, -1))}<span class="dot">.</span>` : esc(t);
}

const tagsList = (services, cls = 'tags') =>
  services.length ? `<ul class="${cls}">${services.map((s) => `<li>${esc(s.title)}</li>`).join('')}</ul>` : '';

/* ------------------------------------------------------------------ */
/* Onderdelen                                                          */
/* ------------------------------------------------------------------ */

/** Projectkaart: groot beeld, tags op het beeld, bedrijf en titel eronder. */
function projectCard(p, { variant = '', eager = false, speed = 0 } = {}) {
  const first = p.media[0];
  return `<a class="pcard${variant ? ` pcard--${variant}` : ''}" href="/cases/${esc(p.slug)}/" data-case data-services="${esc(p.services.map((s) => s.slug).join(' '))}"${speed ? ` data-speed="${speed}"` : ''}>
  <span class="pcard__media">${first ? media(first, { cls: 'pcard__asset', alt: `${p.client}: ${p.title}`, eager }) : ''}${tagsList(p.services, 'pcard__tags')}</span>
  <span class="pcard__meta"><span class="pcard__client">${esc(p.client)}</span><span class="pcard__title">${esc(p.title)}</span></span>
</a>`;
}

/** Speels raster: twee kolommen die verspringen, met afwisselende beeldverhoudingen. */
function projectGrid(projects, { empty = 'Hier verschijnen binnenkort onze cases.' } = {}) {
  if (!projects.length) return `<p class="empty">${esc(empty)}</p>`;
  const variants = ['tall', 'wide', 'square', 'wide', 'tall', 'square'];
  const cards = projects.map((p, i) => projectCard(p, { variant: variants[i % variants.length] }));
  const left = cards.filter((_, i) => i % 2 === 0).join('');
  const right = cards.filter((_, i) => i % 2 === 1).join('');
  return `<div class="pgrid" data-grid>
  <div class="pgrid__col">${left}</div>
  <div class="pgrid__col pgrid__col--offset">${right}</div>
</div>`;
}

function sectionHead({ sub, heading, text = '', link = null, h = 'h2' }) {
  return `<div class="shead">
  <div class="shead__main">
    ${sub ? `<p class="sub" data-reveal>${esc(sub)}</p>` : ''}
    <${h} class="h-section" data-split>${title(heading)}</${h}>
    ${text ? `<p class="shead__text" data-reveal>${esc(text)}</p>` : ''}
  </div>
  ${link ? `<a class="link" href="${esc(link.href)}" data-reveal>${esc(link.label)} ${ARROW_R}</a>` : ''}
</div>`;
}

function ctaBlock(ctx) {
  const { site } = ctx;
  const words = (site.ctaWords || []).filter(Boolean);
  const tel = site.phone ? site.phone.replace(/[^\d+]/g, '') : '';
  return `<section class="mod cta">
  <div class="wrap">
    <h2 class="cta__title" data-reveal>
      <span class="cta__line"><span>${esc(site.ctaTitle)}</span>${words.length ? `<span class="swap" data-swap='${esc(JSON.stringify(words))}'><span class="swap__word">${esc(words[0])}</span></span>` : ''}</span>
      <span class="cta__break"></span>
      <span>${esc(site.ctaEnd || '')}</span>
    </h2>
    <div class="cta__row">
      <p class="cta__text" data-reveal>${esc(site.ctaText)}</p>
      <div class="cta__links" data-reveal>
        ${site.email ? `<a class="cta__link" href="mailto:${esc(site.email)}"><span class="cta__label">Mail</span><span class="cta__value">${esc(site.email)}</span>${ARROW}</a>` : ''}
        ${tel ? `<a class="cta__link" href="tel:${esc(tel)}"><span class="cta__label">Bel</span><span class="cta__value">${esc(site.phone)}</span>${ARROW}</a>` : ''}
        <a class="btn btn--dark" href="/contact/"><span>${esc(site.ctaLabel)}</span></a>
      </div>
    </div>
  </div>
</section>`;
}

function menu(ctx, path) {
  const { site } = ctx;
  const links = [
    ['/cases/', 'Cases'],
    ['/over-ons/', 'Over ons'],
    ['/wat-we-doen/', 'Wat we doen'],
    ['/contact/', 'Contact']
  ];
  const cur = (href) => (href === '/' ? path === '/' : path.startsWith(href)) ? ' aria-current="page"' : '';
  return `<button class="menubtn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu openen" data-menu-btn>
  <span class="menubtn__icon" aria-hidden="true"><i></i><i></i></span>
</button>
<div class="menu" id="menu" aria-label="Menu" data-menu>
  <div class="menu__panel">
    <nav class="menu__nav" aria-label="Hoofdmenu">
      <ul>${links.map(([href, label], i) => `<li style="--i:${i}"><a class="menu__link" href="${href}"${cur(href)}><span>${label}</span><sup>0${i + 1}</sup></a></li>`).join('')}</ul>
    </nav>
    <div class="menu__foot">
      <a class="menu__home" href="/"${cur('/')}>Home</a>
      ${site.email ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ''}
      <span class="menu__social"><a href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram</a><a href="${esc(site.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></span>
    </div>
  </div>
</div>`;
}

function footer(ctx) {
  const { site, logo } = ctx;
  const year = new Date().getFullYear();
  return `<footer class="foot">
  <svg class="foot__wave" aria-hidden="true" preserveAspectRatio="none"><path/></svg>
  <div class="wrap foot__inner">
    <a class="foot__logo" href="/" aria-label="Claro, naar de homepage">${renderLogo(logo, { variant: 'mono' })}</a>
    <div class="foot__contact">
      ${site.email ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ''}
      <a href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram</a>
      <a href="${esc(site.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
    </div>
  </div>
  <div class="wrap foot__bottom">
    <p>© ${year} Claro · by ${esc(site.byline)}</p>
    <p>KvK ${esc(site.kvk)} · <a href="/privacy/">Privacy</a></p>
  </div>
</footer>`;
}

/** Complete pagina: <head>, logo, inhoud, footer, menu en overgang. */
export function page(ctx, { title: pageTitle, description, path, body, bodyClass = '', home = false, noindex = false, cta = true }) {
  const { site, assets, fonts, logo } = ctx;
  const fullTitle = home ? `${site.name}: ${pageTitle}` : `${pageTitle} | ${site.name}`;
  const desc = description || site.description;
  const canonical = `${site.url.replace(/\/$/, '')}${path}`;
  const ld = home
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site.name,
        url: site.url,
        sameAs: [site.instagram, site.linkedin].filter(Boolean)
      })}</script>`
    : '';

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="theme-color" content="#F8EDE7">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${fonts}
<link rel="stylesheet" href="${assets.css}">
<script>(function(d){d.documentElement.classList.add('js');try{if(sessionStorage.getItem('claro:swipe'))d.documentElement.classList.add('is-entering')}catch(e){}})(document)</script>
${ld}
</head>
<body class="${bodyClass}">
<a class="skip" href="#inhoud">Naar de inhoud</a>
<header class="top">
  <a class="top__logo" href="/" aria-label="Claro, naar de homepage">${renderLogo(logo, { variant: 'mono' })}</a>
</header>
<main id="inhoud">
${body}
${cta ? ctaBlock(ctx) : ''}
</main>
${footer(ctx)}
${menu(ctx, path)}
<div class="bubble" aria-hidden="true"><svg class="bubble__shape" viewBox="-60 -60 120 120"><path d="M56.00,0.00 L55.41,0.97 L54.81,1.91 L54.22,2.84 L53.64,3.75 L53.10,4.65 L52.59,5.53 L52.13,6.40 L51.72,7.27 L51.37,8.14 L51.08,9.01 L50.85,9.88 L50.69,10.77 L50.59,11.68 L50.56,12.61 L50.58,13.55 L50.65,14.52 L50.76,15.52 L50.91,16.54 L51.08,17.59 L51.27,18.66 L51.47,19.76 L51.65,20.87 L51.28,21.77 L50.36,22.42 L49.45,23.06 L48.56,23.68 L47.70,24.30 L46.87,24.92 L46.08,25.54 L45.35,26.18 L44.66,26.84 L44.03,27.52 L43.46,28.22 L42.95,28.97 L42.48,29.75 L42.07,30.57 L41.71,31.43 L41.38,32.33 L41.09,33.28 L40.83,34.26 L40.58,35.28 L40.35,36.33 L40.11,37.40 L39.86,38.49 L39.60,39.60 L38.49,39.86 L37.40,40.11 L36.33,40.35 L35.28,40.58 L34.26,40.83 L33.28,41.09 L32.33,41.38 L31.43,41.71 L30.57,42.07 L29.75,42.48 L28.97,42.95 L28.22,43.46 L27.52,44.03 L26.84,44.66 L26.18,45.35 L25.54,46.08 L24.92,46.87 L24.30,47.70 L23.68,48.56 L23.06,49.45 L22.42,50.36 L21.77,51.28 L20.87,51.65 L19.76,51.47 L18.66,51.27 L17.59,51.08 L16.54,50.91 L15.52,50.76 L14.52,50.65 L13.55,50.58 L12.61,50.56 L11.68,50.59 L10.77,50.69 L9.88,50.85 L9.01,51.08 L8.14,51.37 L7.27,51.72 L6.40,52.13 L5.53,52.59 L4.65,53.10 L3.75,53.64 L2.84,54.22 L1.91,54.81 L0.97,55.41 L0.00,56.00 L-0.97,55.41 L-1.91,54.81 L-2.84,54.22 L-3.75,53.64 L-4.65,53.10 L-5.53,52.59 L-6.40,52.13 L-7.27,51.72 L-8.14,51.37 L-9.01,51.08 L-9.88,50.85 L-10.77,50.69 L-11.68,50.59 L-12.61,50.56 L-13.55,50.58 L-14.52,50.65 L-15.52,50.76 L-16.54,50.91 L-17.59,51.08 L-18.66,51.27 L-19.76,51.47 L-20.87,51.65 L-21.77,51.28 L-22.42,50.36 L-23.06,49.45 L-23.68,48.56 L-24.30,47.70 L-24.92,46.87 L-25.54,46.08 L-26.18,45.35 L-26.84,44.66 L-27.52,44.03 L-28.22,43.46 L-28.97,42.95 L-29.75,42.48 L-30.57,42.07 L-31.43,41.71 L-32.33,41.38 L-33.28,41.09 L-34.26,40.83 L-35.28,40.58 L-36.33,40.35 L-37.40,40.11 L-38.49,39.86 L-39.60,39.60 L-39.86,38.49 L-40.11,37.40 L-40.35,36.33 L-40.58,35.28 L-40.83,34.26 L-41.09,33.28 L-41.38,32.33 L-41.71,31.43 L-42.07,30.57 L-42.48,29.75 L-42.95,28.97 L-43.46,28.22 L-44.03,27.52 L-44.66,26.84 L-45.35,26.18 L-46.08,25.54 L-46.87,24.92 L-47.70,24.30 L-48.56,23.68 L-49.45,23.06 L-50.36,22.42 L-51.28,21.77 L-51.65,20.87 L-51.47,19.76 L-51.27,18.66 L-51.08,17.59 L-50.91,16.54 L-50.76,15.52 L-50.65,14.52 L-50.58,13.55 L-50.56,12.61 L-50.59,11.68 L-50.69,10.77 L-50.85,9.88 L-51.08,9.01 L-51.37,8.14 L-51.72,7.27 L-52.13,6.40 L-52.59,5.53 L-53.10,4.65 L-53.64,3.75 L-54.22,2.84 L-54.81,1.91 L-55.41,0.97 L-56.00,0.00 L-55.41,-0.97 L-54.81,-1.91 L-54.22,-2.84 L-53.64,-3.75 L-53.10,-4.65 L-52.59,-5.53 L-52.13,-6.40 L-51.72,-7.27 L-51.37,-8.14 L-51.08,-9.01 L-50.85,-9.88 L-50.69,-10.77 L-50.59,-11.68 L-50.56,-12.61 L-50.58,-13.55 L-50.65,-14.52 L-50.76,-15.52 L-50.91,-16.54 L-51.08,-17.59 L-51.27,-18.66 L-51.47,-19.76 L-51.65,-20.87 L-51.28,-21.77 L-50.36,-22.42 L-49.45,-23.06 L-48.56,-23.68 L-47.70,-24.30 L-46.87,-24.92 L-46.08,-25.54 L-45.35,-26.18 L-44.66,-26.84 L-44.03,-27.52 L-43.46,-28.22 L-42.95,-28.97 L-42.48,-29.75 L-42.07,-30.57 L-41.71,-31.43 L-41.38,-32.33 L-41.09,-33.28 L-40.83,-34.26 L-40.58,-35.28 L-40.35,-36.33 L-40.11,-37.40 L-39.86,-38.49 L-39.60,-39.60 L-38.49,-39.86 L-37.40,-40.11 L-36.33,-40.35 L-35.28,-40.58 L-34.26,-40.83 L-33.28,-41.09 L-32.33,-41.38 L-31.43,-41.71 L-30.57,-42.07 L-29.75,-42.48 L-28.97,-42.95 L-28.22,-43.46 L-27.52,-44.03 L-26.84,-44.66 L-26.18,-45.35 L-25.54,-46.08 L-24.92,-46.87 L-24.30,-47.70 L-23.68,-48.56 L-23.06,-49.45 L-22.42,-50.36 L-21.77,-51.28 L-20.87,-51.65 L-19.76,-51.47 L-18.66,-51.27 L-17.59,-51.08 L-16.54,-50.91 L-15.52,-50.76 L-14.52,-50.65 L-13.55,-50.58 L-12.61,-50.56 L-11.68,-50.59 L-10.77,-50.69 L-9.88,-50.85 L-9.01,-51.08 L-8.14,-51.37 L-7.27,-51.72 L-6.40,-52.13 L-5.53,-52.59 L-4.65,-53.10 L-3.75,-53.64 L-2.84,-54.22 L-1.91,-54.81 L-0.97,-55.41 L-0.00,-56.00 L0.97,-55.41 L1.91,-54.81 L2.84,-54.22 L3.75,-53.64 L4.65,-53.10 L5.53,-52.59 L6.40,-52.13 L7.27,-51.72 L8.14,-51.37 L9.01,-51.08 L9.88,-50.85 L10.77,-50.69 L11.68,-50.59 L12.61,-50.56 L13.55,-50.58 L14.52,-50.65 L15.52,-50.76 L16.54,-50.91 L17.59,-51.08 L18.66,-51.27 L19.76,-51.47 L20.87,-51.65 L21.77,-51.28 L22.42,-50.36 L23.06,-49.45 L23.68,-48.56 L24.30,-47.70 L24.92,-46.87 L25.54,-46.08 L26.18,-45.35 L26.84,-44.66 L27.52,-44.03 L28.22,-43.46 L28.97,-42.95 L29.75,-42.48 L30.57,-42.07 L31.43,-41.71 L32.33,-41.38 L33.28,-41.09 L34.26,-40.83 L35.28,-40.58 L36.33,-40.35 L37.40,-40.11 L38.49,-39.86 L39.60,-39.60 L39.86,-38.49 L40.11,-37.40 L40.35,-36.33 L40.58,-35.28 L40.83,-34.26 L41.09,-33.28 L41.38,-32.33 L41.71,-31.43 L42.07,-30.57 L42.48,-29.75 L42.95,-28.97 L43.46,-28.22 L44.03,-27.52 L44.66,-26.84 L45.35,-26.18 L46.08,-25.54 L46.87,-24.92 L47.70,-24.30 L48.56,-23.68 L49.45,-23.06 L50.36,-22.42 L51.28,-21.77 L51.65,-20.87 L51.47,-19.76 L51.27,-18.66 L51.08,-17.59 L50.91,-16.54 L50.76,-15.52 L50.65,-14.52 L50.58,-13.55 L50.56,-12.61 L50.59,-11.68 L50.69,-10.77 L50.85,-9.88 L51.08,-9.01 L51.37,-8.14 L51.72,-7.27 L52.13,-6.40 L52.59,-5.53 L53.10,-4.65 L53.64,-3.75 L54.22,-2.84 L54.81,-1.91 L55.41,-0.97 L56.00,-0.00Z"/></svg><span class="bubble__text">Bekijk case</span></div>
<div class="swipe" aria-hidden="true"><div class="swipe__logo">${renderLogo(logo, { variant: 'mono' })}</div></div>
<script src="${assets.js}" defer></script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Pagina's                                                            */
/* ------------------------------------------------------------------ */

export function homePage(ctx) {
  const { site, projects, services, clients } = ctx;
  const recent = projects.slice(0, 4);
  const hero = site.heroVideo;

  const recentHtml = recent.length
    ? `<div class="recent">${recent.map((p, i) => projectCard(p, { eager: i < 2 })).join('')}</div>
    <div class="recent__more" data-reveal><a class="btn btn--dark btn--big" href="/cases/"><span>Bekijk al ons werk</span></a></div>`
    : '<p class="empty">Hier verschijnen binnenkort onze nieuwste projecten.</p>';

  const count = (slug) => projects.filter((p) => p.services.some((s) => s.slug === slug)).length;
  const servicesHtml = services
    .map(
      (s, i) => `<li class="srow" data-reveal style="--d:${i * 70}ms">
  <a class="srow__link" href="/wat-we-doen/${esc(s.slug)}/" data-case data-bubble="Bekijk cases">
    <span class="srow__title">${esc(s.title)}</span>
    <span class="srow__short">${esc(s.short)}</span>
    <span class="srow__count">${count(s.slug)} ${count(s.slug) === 1 ? 'case' : 'cases'}</span>
  </a>
</li>`
    )
    .join('');

  const clientsHtml = clients.length
    ? `<section class="mod clients">
  <div class="wrap">
    <p class="sub center" data-reveal>${esc(site.clientsTitle)}</p>
  </div>
  <div class="clients__marquee" data-reveal>
    <ul class="clients__track">${[...clients, ...clients]
      .map((c, i) => `<li class="client"${i >= clients.length ? ' aria-hidden="true"' : ''}>${c.svg}</li>`)
      .join('')}</ul>
  </div>
  <div class="clients__marquee" aria-hidden="true">
    <ul class="clients__track clients__track--rev">${[...clients, ...clients]
      .reverse()
      .map((c) => `<li class="client">${c.svg}</li>`)
      .join('')}</ul>
  </div>
</section>`
    : '';

  const body = `
<section class="mod hero" data-hero>
  <div class="wrap hero__grid">
    <div class="hero__text">
      <h1 class="h-hero" data-split>${title(site.heroTitle)}</h1>
      <p class="lead" data-reveal>${esc(site.heroIntro)}</p>
      <div class="btns" data-reveal>
        <a class="btn btn--dark" href="/cases/"><span>Ons werk</span></a>
        <a class="btn btn--line" href="/over-ons/"><span>Over ons</span></a>
      </div>
    </div>
    <div class="hero__media" data-hero-media>
      ${hero ? media(hero, { cls: 'hero__asset', eager: true }) : ''}
    </div>
  </div>
</section>

<section class="mod">
  <div class="wrap">
    ${sectionHead({ sub: 'Recent werk', heading: site.recentTitle })}
    ${recentHtml}
  </div>
</section>

<section class="mod services">
  <div class="wrap services__grid">
    <div class="services__head">
      ${sectionHead({ sub: 'Diensten', heading: site.servicesTitle, text: site.servicesIntro, link: { href: '/wat-we-doen/', label: 'Alles over onze diensten' } })}
    </div>
    <ul class="srows">${servicesHtml}</ul>
  </div>
</section>
${clientsHtml}`;

  return page(ctx, { title: site.heroTitle, path: '/', body, home: true, bodyClass: 'page-home' });
}

export function casesPage(ctx) {
  const { site, projects, services } = ctx;
  const used = services.filter((s) => projects.some((p) => p.services.some((x) => x.slug === s.slug)));
  const filters = used.length
    ? `<div class="filters" role="group" aria-label="Filter op dienst" data-filters data-reveal>
  <button type="button" class="chip is-active" data-filter="">Alles <sup>${projects.length}</sup></button>
  ${used
    .map((s) => `<button type="button" class="chip" data-filter="${esc(s.slug)}">${esc(s.title)} <sup>${projects.filter((p) => p.services.some((x) => x.slug === s.slug)).length}</sup></button>`)
    .join('')}
</div>`
    : '';
  const body = `
<section class="mod phead">
  <div class="wrap">
    <h1 class="h-hero" data-split>${title(site.casesTitle)}</h1>
    <p class="lead" data-reveal>${esc(site.casesIntro)}</p>
    ${filters}
  </div>
</section>
<section class="mod">
  <div class="wrap">${projectGrid(projects)}</div>
</section>`;
  return page(ctx, { title: 'Cases', description: site.casesIntro, path: '/cases/', body, bodyClass: 'page-cases' });
}

export function servicesPage(ctx) {
  const { site, services, projects } = ctx;
  const steps = (ctx.about && ctx.about.steps) || [];
  const blocks = services
    .map((s, i) => {
      const n = projects.filter((p) => p.services.some((x) => x.slug === s.slug));
      return `<article class="sblock" data-reveal>
  <a class="sblock__link" href="/wat-we-doen/${esc(s.slug)}/" data-case data-bubble="Bekijk cases">
    <span class="sblock__body">
      <span class="sblock__title">${esc(s.title)}</span>
      <span class="sblock__short">${esc(s.short || s.intro)}</span>
      ${s.offer.length ? `<span class="sblock__offer">${s.offer.map((o) => `<span>${esc(o.title)}</span>`).join('')}</span>` : ''}
    </span>
    <span class="sblock__more">${n.length} ${n.length === 1 ? 'case' : 'cases'}</span>
  </a>
</article>`;
    })
    .join('');
  const body = `
<section class="mod phead wwd-intro">
  <div class="wrap">
    <p class="sub" data-reveal>Diensten</p>
    <h1 class="h-hero" data-split>${title(site.servicesPageTitle)}</h1>
    <p class="lead lead--big" data-reveal>${esc(site.servicesPageIntro)}</p>
    ${
      steps.length
        ? `<div class="process">
      <p class="sub" data-reveal>${esc(ctx.about.stepsTitle || 'Zo werken we')}</p>
      <div class="process__track">
      <svg class="process__wave" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 1000 24"><path d="${processWave()}"/></svg>
      <ol class="process__list">
        ${steps.map((st, i) => `<li class="process__step" data-reveal style="--d:${i * 140}ms"><span class="process__dot">${i + 1}</span><span class="process__title">${esc(st.title)}</span><span class="process__text">${esc(st.text)}</span></li>`).join('')}
      </ol>
      </div>
    </div>`
        : ''
    }
  </div>
</section>
<section class="mod">
  <div class="wrap sblocks">${blocks}</div>
</section>`;
  return page(ctx, { title: 'Wat we doen', description: site.servicesPageIntro, path: '/wat-we-doen/', body, bodyClass: 'page-services' });
}

/** Golvende lijn tussen de stappen, in de vorm van de potloodpunt. */
function processWave() {
  let d = 'M0,6';
  for (let x = 0; x <= 1000; x += 5) d += ` L${x},${(4 + 14 * Math.abs(Math.sin((Math.PI * x) / 62))).toFixed(1)}`;
  return d;
}

export function servicePage(ctx, s) {
  const { projects, services } = ctx;
  const list = projects.filter((p) => p.services.some((x) => x.slug === s.slug));
  const others = services.filter((x) => x.slug !== s.slug);
  const offer = s.offer.length
    ? `<ul class="offer">${s.offer
        .map((o, i) => `<li class="offer__item" data-reveal style="--d:${i * 80}ms"><span class="offer__title">${esc(o.title)}</span><span class="offer__text">${esc(o.text)}</span></li>`)
        .join('')}</ul>`
    : '';
  const body = `
<section class="mod phead">
  <div class="wrap">
    <a class="back" href="/wat-we-doen/">${ARROW_L} Wat we doen</a>
    <h1 class="h-hero" data-split>${title(s.title)}</h1>
    <div class="phead__cols">
      <p class="lead" data-reveal>${esc(s.intro)}</p>
      ${offer}
    </div>
  </div>
</section>
<section class="mod">
  <div class="wrap">
    ${sectionHead({ sub: 'Cases', heading: `${s.title} in de praktijk` })}
    ${projectGrid(list, { empty: 'Binnenkort verschijnen hier cases binnen deze dienst.' })}
    ${
      others.length
        ? `<nav class="others" aria-label="Andere diensten"><span class="sub">Ook interessant</span>${others
            .map((o) => `<a class="chip chip--link" href="/wat-we-doen/${esc(o.slug)}/">${esc(o.title)}</a>`)
            .join('')}</nav>`
        : ''
    }
  </div>
</section>`;
  return page(ctx, { title: s.title, description: s.intro, path: `/wat-we-doen/${s.slug}/`, body, bodyClass: 'page-service' });
}

export function casePage(ctx, p, next) {
  const [first, ...rest] = p.media;
  const tile = (m, cls) =>
    `<button type="button" class="gal__item ${cls}" data-lb data-kind="${m.type}" data-src="${esc(m.src)}"${m.poster ? ` data-poster="${esc(m.poster)}"` : ''} aria-label="Bekijk groot">${media(m, { cls: 'gal__asset', alt: p.title })}</button>`;
  // beelden afwisselend: één breed, twee naast elkaar
  const restHtml = [];
  for (let i = 0; i < rest.length; ) {
    const mode = restHtml.length % 2 === 0 ? 2 : 1;
    const chunk = rest.slice(i, i + mode);
    restHtml.push(`<div class="gal__row gal__row--${chunk.length}">${chunk.map((m) => tile(m, '')).join('')}</div>`);
    i += mode;
  }
  const body = `
<section class="mod chead">
  <div class="wrap">
    <a class="back" href="/cases/">${ARROW_L} Alle cases</a>
    <p class="sub" data-reveal>${esc(p.client)}</p>
    <h1 class="h-hero" data-split>${title(p.title)}</h1>
    <div class="chead__cols">
      <p class="lead" data-reveal>${esc(p.intro)}</p>
      <dl class="facts" data-reveal>
        <div><dt>Klant</dt><dd>${esc(p.client)}</dd></div>
        ${p.year ? `<div><dt>Jaar</dt><dd>${esc(p.year)}</dd></div>` : ''}
        ${p.services.length ? `<div><dt>Diensten</dt><dd>${p.services.map((s) => `<a href="/wat-we-doen/${esc(s.slug)}/">${esc(s.title)}</a>`).join('')}</dd></div>` : ''}
      </dl>
    </div>
    ${first ? `<div class="gal gal--lead" data-reveal>${tile(first, 'gal__item--lead')}</div>` : ''}
  </div>
</section>
${
  p.body.length || rest.length
    ? `<section class="mod">
  <div class="wrap">
    ${p.body.length ? `<div class="story">${p.body.map((t) => `<p data-reveal>${esc(t)}</p>`).join('')}</div>` : ''}
    ${rest.length ? `<div class="gal">${restHtml.join('')}</div>` : ''}
  </div>
</section>`
    : ''
}
${
  next
    ? `<section class="mod next">
  <div class="wrap">
    <a class="next__link" href="/cases/${esc(next.slug)}/" data-case>
      <span class="next__text"><span class="sub">Volgende case</span><span class="next__title">${esc(next.client)}: ${esc(next.title)}</span></span>
      <span class="next__media">${next.media[0] ? media(next.media[0], { cls: 'next__asset' }) : ''}</span>
    </a>
    <a class="back back--bottom" href="/cases/">${ARROW_L} Terug naar alle cases</a>
  </div>
</section>`
    : ''
}`;
  return page(ctx, { title: `${p.title} voor ${p.client}`, description: p.intro, path: `/cases/${p.slug}/`, body, bodyClass: 'page-case' });
}

export function aboutPage(ctx) {
  const { about, projects } = ctx;
  const cards = projects.filter((p) => p.media[0]).slice(0, 4);
  const pillars = (about.pillars || [])
    .map((pl, i) => `<li class="pillar"><span class="pillar__num">0${i + 1}</span><span class="pillar__title">${esc(pl.title)}</span><span class="pillar__text">${esc(pl.text)}</span></li>`)
    .join('');
  const team = (about.team || [])
    .map(
      (m, i) => `<li class="person" data-reveal style="--d:${i * 100}ms">
  <span class="person__photo">${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy">` : `<span>${esc(m.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span>`}</span>
  <span class="person__name">${esc(m.name)}</span>
  <span class="person__role">${esc(m.role)}</span>
  <span class="person__bio">${esc(m.bio)}</span>
</li>`
    )
    .join('');
  const steps = (about.steps || [])
    .map((s, i) => `<li class="step" data-reveal style="--d:${i * 80}ms"><span class="step__num">0${i + 1}</span><span class="step__title">${esc(s.title)}</span><span class="step__text">${esc(s.text)}</span></li>`)
    .join('');

  const body = `
<section class="mod phead">
  <div class="wrap">
    <p class="sub" data-reveal>${esc(about.title)}</p>
    <h1 class="h-hero" data-split>${title(about.statement)}</h1>
    <p class="lead" data-reveal>${esc(about.intro)}</p>
  </div>
</section>

<section class="mod values" data-stack>
  <div class="values__sticky">
    <div class="wrap values__grid">
      <div class="values__text">
        <h2 class="h-section">${title(about.pillarsTitle)}</h2>
        <ol class="pillars">${pillars}</ol>
      </div>
      <div class="values__stage" aria-hidden="true">
        ${cards.map((p, i) => `<div class="phone" style="--i:${i}">${media(p.media[0], { cls: 'phone__asset' })}<span class="phone__label">${esc(p.client)}</span></div>`).join('')}
      </div>
    </div>
  </div>
</section>

${
  about.quote
    ? `<section class="mod quote">
  <div class="wrap">
    <blockquote class="quote__text" data-split>“${esc(about.quote)}”</blockquote>
    ${about.quoteAuthor ? `<p class="quote__author" data-reveal>${esc(about.quoteAuthor)}</p>` : ''}
  </div>
</section>`
    : ''
}

<section class="mod">
  <div class="wrap">
    <div class="story story--cols">${(about.story || []).map((t) => `<p data-reveal>${esc(t)}</p>`).join('')}</div>
    ${steps ? `${sectionHead({ sub: 'Werkwijze', heading: about.stepsTitle })}<ol class="steps">${steps}</ol>` : ''}
  </div>
</section>

${
  team
    ? `<section class="mod">
  <div class="wrap">
    ${sectionHead({ sub: 'Team', heading: about.teamTitle })}
    <ul class="team">${team}</ul>
  </div>
</section>`
    : ''
}`;
  return page(ctx, { title: 'Over ons', description: about.intro, path: '/over-ons/', body, bodyClass: 'page-about' });
}

export function contactPage(ctx) {
  const { contact, site, services } = ctx;
  const chips = services
    .map((s, i) => `<label class="pick"><input type="checkbox" name="dienst" value="${esc(s.title)}"><span>${esc(s.title)}</span></label>`)
    .join('');
  const body = `
<section class="mod phead contact">
  <div class="wrap contact__grid">
    <div>
      <h1 class="h-hero" data-split>${title(contact.title)}</h1>
      <p class="lead" data-reveal>${esc(contact.intro)}</p>
      <ul class="contact__details" data-reveal>
        ${site.email ? `<li><span>E-mail</span><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>` : ''}
        ${site.phone ? `<li><span>Telefoon</span><a href="tel:${esc(site.phone.replace(/[^\d+]/g, ''))}">${esc(site.phone)}</a></li>` : ''}
        <li><span>Instagram</span><a href="${esc(site.instagram)}" target="_blank" rel="noopener">@wijzijnclaro</a></li>
        <li><span>LinkedIn</span><a href="${esc(site.linkedin)}" target="_blank" rel="noopener">Claro op LinkedIn</a></li>
        <li><span>KvK</span><b>${esc(site.kvk)}</b></li>
      </ul>
    </div>
    <div class="card" data-reveal>
      <form class="form" name="contact" method="POST" action="/bedankt/" data-netlify="true" netlify-honeypot="bot-field" data-form>
        <h2 class="form__title">${esc(contact.formTitle)}</h2>
        <input type="hidden" name="form-name" value="contact">
        <p class="visually-hidden"><label>Niet invullen: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <label class="field"><span>Naam</span><input name="naam" type="text" required autocomplete="name"></label>
        <label class="field"><span>E-mailadres</span><input name="email" type="email" required autocomplete="email"></label>
        <label class="field"><span>Bedrijf (optioneel)</span><input name="bedrijf" type="text" autocomplete="organization"></label>
        <fieldset class="picks"><legend>Waar kunnen we mee helpen?</legend><div class="picks__row">${chips}</div></fieldset>
        <label class="field"><span>Je bericht</span><textarea name="bericht" required rows="5"></textarea></label>
        <button class="btn btn--dark" type="submit"><span>Verstuur</span></button>
        <p class="form__note">Door te versturen ga je akkoord met onze <a href="/privacy/">privacyverklaring</a>.</p>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
      <div class="form-success" hidden>
        <h2 class="form__title">${esc(contact.successTitle)}</h2>
        <p>${esc(contact.successText)}</p>
        <a class="btn btn--line" href="/"><span>Terug naar home</span></a>
      </div>
    </div>
  </div>
</section>`;
  return page(ctx, { title: 'Contact', description: contact.intro, path: '/contact/', body, bodyClass: 'page-contact', cta: false });
}

export function thanksPage(ctx) {
  const { contact } = ctx;
  const body = `
<section class="mod phead phead--center">
  <div class="wrap">
    <h1 class="h-hero" data-split>${title(contact.successTitle)}</h1>
    <p class="lead" data-reveal>${esc(contact.successText)}</p>
    <div class="btns" data-reveal><a class="btn btn--dark" href="/cases/"><span>Bekijk ons werk</span></a></div>
  </div>
</section>`;
  return page(ctx, { title: 'Bedankt', path: '/bedankt/', body, noindex: true, cta: false });
}

export function privacyPage(ctx) {
  const { privacy } = ctx;
  const body = `
<section class="mod phead">
  <div class="wrap">
    <p class="sub">Bijgewerkt: ${esc(privacy.updated || '')}</p>
    <h1 class="h-hero" data-split>${title(privacy.title)}</h1>
    <div class="prose">${(privacy.sections || []).map((s) => `<h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>`).join('')}</div>
  </div>
</section>`;
  return page(ctx, { title: privacy.title, path: '/privacy/', body, cta: false });
}

export function notFoundPage(ctx) {
  const body = `
<section class="mod phead phead--center">
  <div class="wrap">
    <p class="sub">404</p>
    <h1 class="h-hero" data-split>Deze pagina is niet zo helder.</h1>
    <p class="lead">De pagina die je zoekt bestaat niet (meer). Misschien vind je het in ons werk?</p>
    <div class="btns"><a class="btn btn--dark" href="/"><span>Naar home</span></a><a class="btn btn--line" href="/cases/"><span>Cases</span></a></div>
  </div>
</section>`;
  return page(ctx, { title: 'Niet gevonden', path: '/404.html', body, noindex: true, cta: false });
}
