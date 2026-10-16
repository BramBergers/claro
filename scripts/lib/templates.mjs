// HTML-sjablonen voor alle pagina's. Wil je tekst of opbouw aanpassen? Dit is de plek.
import { logoWidth, renderLogo, svgRatio } from './svg.mjs';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tagsText = (tags = []) => tags.map(esc).join(' · ');

const STAR =
  '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12.7 6.4 17.6 11.3 24 12 17.6 12.7 12.7 17.6 12 24 11.3 17.6 6.4 12.7 0 12 6.4 11.3 11.3 6.4 12 0Z"/></svg>';
const CHEVRON =
  '<svg class="chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW =
  '<svg class="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M5 3h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const mime = (src) => (/\.webm(\?|$)/i.test(src) ? 'video/webm' : 'video/mp4');

/** Eén video of afbeelding. mode: "auto" (speelt als je het ziet) of "hover" (speelt bij hover). */
export function media(m, { cls = '', alt = '', mode = 'auto', preload = 'metadata', eager = false } = {}) {
  if (!m) return '';
  if (m.type === 'image') {
    return `<img class="${cls}" src="${esc(m.src)}" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async" data-media-kind="image">`;
  }
  const poster = m.poster ? ` poster="${esc(m.poster)}"` : '';
  return `<video class="${cls}" muted loop playsinline preload="${preload}"${poster} data-play="${mode}" data-media-kind="video" disablepictureinpicture aria-hidden="true"><source src="${esc(m.src)}" type="${mime(m.src)}"></video>`;
}

function headline(text) {
  const parts = text.trim().split(/\s+/);
  return parts
    .map((p, i) => {
      let inner = esc(p);
      if (i === parts.length - 1 && p.endsWith('.')) inner = `${esc(p.slice(0, -1))}<span class="accent">.</span>`;
      return `<span class="w${i === 0 ? ' w--accent' : ''}">${inner}</span>`;
    })
    .join(' ');
}

function words(text) {
  return text
    .trim()
    .split(/\s+/)
    .map((p) => `<span class="w">${esc(p)}</span>`)
    .join(' ');
}

/* ------------------------------------------------------------------ */
/* Onderdelen die op elke pagina terugkomen                             */
/* ------------------------------------------------------------------ */

function header(ctx, current) {
  const { site, services, logo } = ctx;
  const cur = (href) => (current === href ? ' aria-current="page"' : '');
  const inWork = current.startsWith('/werk/');
  const serviceLinks = services
    .map(
      (s) =>
        `<li><a class="dropdown__link" href="/werk/${esc(s.slug)}/"${cur(`/werk/${s.slug}/`)}><span>${esc(s.title)}</span>${ARROW}</a></li>`
    )
    .join('');
  const menuServices = services
    .map(
      (s, i) =>
        `<li style="--i:${i}"><a href="/werk/${esc(s.slug)}/"${cur(`/werk/${s.slug}/`)}><span>${esc(s.title)}</span></a></li>`
    )
    .join('');

  return `
<header class="site-header" id="header">
  <div class="site-header__inner">
    <a class="brand" href="/" aria-label="Claro, naar de homepage">${renderLogo(logo, { className: 'brand__logo' })}</a>
    <nav class="nav" aria-label="Hoofdmenu">
      <ul class="nav__list">
        <li class="nav__item has-dropdown">
          <a class="nav__link" href="/#werk"${inWork ? ' aria-current="true"' : ''}>ons werk ${CHEVRON}</a>
          <div class="dropdown"><ul>${serviceLinks}</ul></div>
        </li>
        <li class="nav__item"><a class="nav__link" href="/over-claro/"${cur('/over-claro/')}>over claro</a></li>
        <li class="nav__item"><a class="btn btn--pill" href="/contact/"${cur('/contact/')}><span>${esc(site.ctaLabel)}</span></a></li>
      </ul>
    </nav>
    <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu openen">
      <span class="burger__line"></span><span class="burger__line"></span>
    </button>
  </div>
</header>
<div class="menu" id="menu" inert>
  <div class="menu__glow" aria-hidden="true"></div>
  <nav class="menu__nav" aria-label="Mobiel menu">
    <p class="menu__label" style="--i:0">ons werk</p>
    <ul class="menu__services">${menuServices}</ul>
    <a class="menu__big" style="--i:5" href="/over-claro/"${cur('/over-claro/')}><span>over claro</span></a>
    <a class="btn btn--solid btn--xl menu__cta" style="--i:6" href="/contact/"><span>${esc(site.ctaLabel)}</span></a>
  </nav>
  <div class="menu__foot" style="--i:7">
    <a class="link-arrow" href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram ${ARROW}</a>
    <a class="link-arrow" href="${esc(site.linkedin)}" target="_blank" rel="noopener">LinkedIn ${ARROW}</a>
  </div>
</div>`;
}

function footer(ctx) {
  const { site, logo } = ctx;
  const year = new Date().getFullYear();
  return `
<footer class="footer">
  <div class="container footer__inner">
    <div class="footer__top">
      <a class="footer__brand" href="/" aria-label="Claro, naar de homepage">${renderLogo(logo, { variant: 'mono' })}</a>
      <ul class="footer__social">
        <li><a class="link-arrow" href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram ${ARROW}</a></li>
        <li><a class="link-arrow" href="${esc(site.linkedin)}" target="_blank" rel="noopener">LinkedIn ${ARROW}</a></li>
      </ul>
    </div>
    <a class="cta-pill" href="/contact/" data-cta>
      <span class="cta-pill__fill" aria-hidden="true"></span>
      <span class="cta-pill__label">${esc(site.ctaLabel)}</span>
    </a>
    <div class="footer__bottom">
      <p>${year} Claro · by ${esc(site.byline)}</p>
      <p>kvk: ${esc(site.kvk)} · <a class="text-link" href="/privacy/">privacy</a></p>
    </div>
  </div>
</footer>`;
}

/** Complete pagina: <head>, menu, inhoud en footer. */
export function page(ctx, { title, description, path, body, bodyClass = '', home = false, noindex = false }) {
  const { site, assets, fonts, logo } = ctx;
  const fullTitle = home ? title : `${title} | ${site.name}`;
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
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#1F0044">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${fonts}
<script>
(function(){var d=document.documentElement;d.classList.add('js');
try{if(sessionStorage.getItem('claro:media')){d.classList.add('is-entering-media')}
else if(sessionStorage.getItem('claro:curtain')){d.classList.add('is-entering')}}catch(e){}
setTimeout(function(){d.classList.remove('is-entering','is-entering-media')},5000);})();
</script>
<link rel="stylesheet" href="${assets.css}">
${ld}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Naar de inhoud</a>
${header(ctx, path)}
<main id="main">
${body}
</main>
${footer(ctx)}
<div class="curtain" aria-hidden="true"><div class="curtain__logo">${renderLogo(logo, { variant: 'mono' })}</div></div>
<div class="media-curtain" aria-hidden="true"></div>
<script src="${assets.js}" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Pagina's                                                            */
/* ------------------------------------------------------------------ */

/** Header-video: een brede versie voor desktop en optioneel een staande voor telefoons. Alleen de passende wordt geladen. */
function heroVideo(d, m) {
  const mob = m && m.type === 'video' ? m : null;
  const attrs = `data-src-d="${esc(d.src)}"${d.poster ? ` data-poster-d="${esc(d.poster)}"` : ''}${mob ? ` data-src-m="${esc(mob.src)}"${mob.poster ? ` data-poster-m="${esc(mob.poster)}"` : ''}` : ''}`;
  return `<video class="hero__asset" autoplay muted loop playsinline preload="auto" ${attrs} data-media-kind="video" disablepictureinpicture aria-hidden="true"></video>
<script>(function(){var v=document.currentScript.previousElementSibling,p=!!v.getAttribute('data-src-m')&&matchMedia('(max-aspect-ratio: 1/1)').matches,k=p?'m':'d',po=v.getAttribute('data-poster-'+k);if(po)v.poster=po;v.src=v.getAttribute('data-src-'+k);})();</script>`;
}

export function homePage(ctx) {
  const { site, services, clients, logo } = ctx;
  const hero = site.heroVideo;
  const marqueeItems = site.marquee.map((t) => `<span class="marquee__item">${esc(t)}</span>${STAR}`).join('');

  const body = `
<section class="hero">
  <div class="hero__media" data-hero-media>
    ${
      hero
        ? hero.type === 'image'
          ? media(hero, { cls: 'hero__asset', eager: true })
          : heroVideo(hero, site.heroVideoMobile)
        : ''
    }
  </div>
  <div class="hero__shade" aria-hidden="true"></div>
</section>

<div class="marquee" aria-label="Onze diensten" data-marquee>
  <div class="marquee__track">
    <div class="marquee__group">${marqueeItems}</div>
    <div class="marquee__group" aria-hidden="true">${marqueeItems}</div>
    <div class="marquee__group" aria-hidden="true">${marqueeItems}</div>
  </div>
</div>

<section class="intro">
  <div class="container">
    ${renderLogo(logo, { className: 'intro__logo' })}
    <h1 class="intro__title" data-words>${headline(site.heroTitle)}</h1>
    <div class="intro__cta" data-reveal>
      <a class="btn btn--solid" href="/contact/"><span>${esc(site.ctaLabel)}</span></a>
      <a class="btn btn--ghost" href="#werk"><span>Ons werk</span></a>
    </div>
  </div>
</section>

<section class="services" id="werk">
  <div class="container">
    <h2 class="services__title" data-reveal>${esc(site.servicesTitle)}</h2>
  </div>
  <ul class="services__list">
    ${services
      .map(
        (s, i) => `<li class="service" data-reveal style="--d:${i * 90}ms">
      <a class="service__link" href="/werk/${esc(s.slug)}/" data-service>
        <span class="service__bar" aria-hidden="true"></span>
        <span class="container service__row">
          <span class="service__title">${esc(s.title)}</span>
          <span class="service__tags">${tagsText(s.tags)}</span>
        </span>
      </a>
      <div class="service__media" aria-hidden="true"><div class="service__card">${media(s.media, { cls: 'service__asset', mode: 'hover', preload: 'none' })}</div></div>
    </li>`
      )
      .join('')}
  </ul>
</section>

<section class="clients">
  <div class="container">
    <h2 class="clients__title" data-reveal>${esc(site.clientsTitle)}</h2>
    <div class="clients__marquee">
      <div class="clients__track">
        <ul class="clients__grid">
          ${clients
            .map(
              (c, i) =>
                `<li class="client" data-reveal style="--d:${(i % 4) * 90}ms"><span class="client__logo" style="--w:${logoWidth(svgRatio(c.svg))}px">${c.svg}</span></li>`
            )
            .join('')}
        </ul>
        <ul class="clients__grid clients__grid--copy" aria-hidden="true">
          ${clients.map((c) => `<li class="client"><span class="client__logo" style="--w:${logoWidth(svgRatio(c.svg))}px">${c.svg}</span></li>`).join('')}
        </ul>
      </div>
    </div>
  </div>
</section>`;

  return page(ctx, {
    title: `${site.name} | Helder in design, klaar voor impact`,
    description: site.description,
    path: '/',
    body,
    bodyClass: 'page-home',
    home: true
  });
}

export function servicePage(ctx, service, index) {
  const { services, site } = ctx;
  const next = services[(index + 1) % services.length];
  const hero = service.media;

  const offer = service.offer
    .map(
      (o, i) => `<li class="offer__item" data-reveal style="--d:${i * 90}ms">
        <span class="offer__num">0${i + 1}</span>
        <h3 class="offer__title">${esc(o.title)}</h3>
        <p class="offer__text">${esc(o.text)}</p>
      </li>`
    )
    .join('');

  const cases = service.cases
    .map((c, i) => {
      const [first, ...rest] = c.media;
      const tile = (m, lead) =>
        `<button type="button" class="case__media${lead ? ' case__media--lead' : ''}" data-lb data-kind="${m.type}" data-src="${esc(m.src)}"${m.poster ? ` data-poster="${esc(m.poster)}"` : ''} aria-label="Bekijk groot: ${esc(c.title)}">${media(m, { cls: 'case__asset', alt: c.title })}<span class="case__zoom" aria-hidden="true"></span></button>`;
      return `<article class="case" data-reveal data-title="${esc(c.title)}">
      <div class="case__meta">
        <p class="case__eyebrow">${esc(c.client)}${c.client && c.year ? ' · ' : ''}${esc(c.year)}</p>
        <h3 class="case__title">${esc(c.title)}</h3>
        <p class="case__text">${esc(c.description)}</p>
        <span class="case__count">${String(i + 1).padStart(2, '0')} / ${String(service.cases.length).padStart(2, '0')}</span>
      </div>
      <div class="case__visuals">
        ${first ? tile(first, true) : ''}
        ${rest.length ? `<div class="case__gallery" data-n="${rest.length}">${rest.map((m) => tile(m, false)).join('')}</div>` : ''}
      </div>
    </article>`;
    })
    .join('');

  const body = `
<section class="shero">
  <div class="shero__media" data-hero-media>${hero ? media(hero, { cls: 'shero__asset', eager: true, preload: 'auto' }) : ''}</div>
  <div class="shero__shade" aria-hidden="true"></div>
  <div class="container shero__content">
    <p class="eyebrow" data-hero-in>ons werk</p>
    <h1 class="shero__title" data-hero-in>${esc(service.title)}</h1>
    <p class="shero__tags" data-hero-in>${tagsText(service.tags)}</p>
  </div>
  <a class="scrollcue" href="#intro" aria-label="Scroll naar beneden"><span></span></a>
</section>

<section class="sintro" id="intro">
  <div class="container sintro__grid">
    <p class="sintro__lead" data-words>${words(service.intro)}</p>
    <ul class="offer">${offer}</ul>
  </div>
</section>

<section class="cases">
  <div class="container">
    <h2 class="cases__title" data-reveal>Cases</h2>
    ${cases || '<p class="cases__empty">Binnenkort verschijnen hier onze cases.</p>'}
  </div>
</section>

<section class="snext">
  <a class="snext__link" href="/werk/${esc(next.slug)}/">
    <span class="service__bar" aria-hidden="true"></span>
    <span class="container snext__row">
      <span class="snext__label">volgende dienst</span>
      <span class="snext__title">${esc(next.title)}</span>
      <span class="snext__arrow" aria-hidden="true">${ARROW}</span>
    </span>
  </a>
</section>`;

  return page(ctx, {
    title: service.title,
    description: service.intro,
    path: `/werk/${service.slug}/`,
    body,
    bodyClass: 'page-service'
  });
}

export function aboutPage(ctx) {
  const { about } = ctx;
  const steps = about.steps
    .map(
      (s, i) => `<li class="step" data-reveal style="--d:${i * 90}ms">
        <span class="step__num">0${i + 1}</span>
        <h3 class="step__title">${esc(s.title)}</h3>
        <p class="step__text">${esc(s.text)}</p>
      </li>`
    )
    .join('');

  const initials = (n) =>
    n
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const team = about.team
    .map(
      (p, i) => `<li class="person" data-reveal style="--d:${i * 120}ms">
        <div class="person__photo">${
          p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : `<span>${esc(initials(p.name))}</span>`
        }</div>
        <h3 class="person__name">${esc(p.name)}</h3>
        <p class="person__role">${esc(p.role)}</p>
        <p class="person__bio">${esc(p.bio)}</p>
      </li>`
    )
    .join('');

  const body = `
<section class="phero phero--about">
  <div class="container">
    <p class="eyebrow" data-hero-in>${esc(about.title)}</p>
    <h1 class="phero__title" data-hero-in>${esc(about.statement)}</h1>
    <p class="phero__lead" data-hero-in>${esc(about.intro)}</p>
  </div>
</section>

<section class="story">
  <div class="container story__grid">
    ${about.story.map((p) => `<p class="story__p" data-words>${words(p)}</p>`).join('')}
  </div>
</section>

<section class="steps">
  <div class="container">
    <h2 class="section-title" data-reveal>${esc(about.stepsTitle)}</h2>
    <ol class="steps__list">${steps}</ol>
  </div>
</section>

<section class="team">
  <div class="container">
    <h2 class="section-title" data-reveal>${esc(about.teamTitle)}</h2>
    <ul class="team__list">${team}</ul>
  </div>
</section>`;

  return page(ctx, {
    title: about.title,
    description: about.intro,
    path: '/over-claro/',
    body,
    bodyClass: 'page-about'
  });
}

export function contactPage(ctx) {
  const { contact, site, services } = ctx;
  const chips = [...services.map((s) => s.title), 'Iets anders']
    .map(
      (t) =>
        `<label class="chip"><input type="checkbox" name="interesse" value="${esc(t)}"><span>${esc(t)}</span></label>`
    )
    .join('');

  const body = `
<section class="phero phero--contact">
  <div class="container contact__grid">
    <div class="contact__intro">
      <p class="eyebrow" data-hero-in>contact</p>
      <h1 class="phero__title" data-hero-in>${esc(contact.title)}</h1>
      <p class="phero__lead" data-hero-in>${esc(contact.intro)}</p>
      <ul class="contact__details" data-hero-in>
        <li><span>e-mail</span><a class="text-link" href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
        <li><span>instagram</span><a class="text-link" href="${esc(site.instagram)}" target="_blank" rel="noopener">@wijzijnclaro</a></li>
        <li><span>linkedin</span><a class="text-link" href="${esc(site.linkedin)}" target="_blank" rel="noopener">Claro op LinkedIn</a></li>
        <li><span>kvk</span><b>${esc(site.kvk)}</b></li>
      </ul>
    </div>

    <div class="contact__card" data-hero-in>
      <form class="form" name="contact" method="POST" action="/bedankt/" data-netlify="true" netlify-honeypot="bot-field" data-form>
        <h2 class="form__title">${esc(contact.formTitle)}</h2>
        <input type="hidden" name="form-name" value="contact">
        <p class="visually-hidden"><label>Niet invullen: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <div class="field"><input id="f-naam" name="naam" type="text" required autocomplete="name" placeholder=" "><label for="f-naam">Naam</label></div>
        <div class="field"><input id="f-email" name="email" type="email" required autocomplete="email" placeholder=" "><label for="f-email">E-mailadres</label></div>
        <div class="field"><input id="f-bedrijf" name="bedrijf" type="text" autocomplete="organization" placeholder=" "><label for="f-bedrijf">Bedrijf (optioneel)</label></div>
        <fieldset class="chips"><legend>Waar kunnen we mee helpen?</legend><div class="chips__row">${chips}</div></fieldset>
        <div class="field field--area"><textarea id="f-bericht" name="bericht" required rows="5" placeholder=" "></textarea><label for="f-bericht">Je bericht</label></div>
        <button class="btn btn--solid btn--lg" type="submit"><span>Verstuur</span></button>
        <p class="form__note">Door te versturen ga je akkoord met onze <a class="text-link" href="/privacy/">privacyverklaring</a>.</p>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
      <div class="form-success" hidden>
        <h2 class="form__title">${esc(contact.successTitle)}</h2>
        <p>${esc(contact.successText)}</p>
        <a class="btn btn--ghost" href="/"><span>Terug naar home</span></a>
      </div>
    </div>
  </div>
</section>`;

  return page(ctx, {
    title: 'Contact',
    description: contact.intro,
    path: '/contact/',
    body,
    bodyClass: 'page-contact'
  });
}

export function thanksPage(ctx) {
  const { contact } = ctx;
  const body = `
<section class="phero phero--thanks">
  <div class="container">
    <p class="eyebrow" data-hero-in>contact</p>
    <h1 class="phero__title" data-hero-in>${esc(contact.successTitle)}</h1>
    <p class="phero__lead" data-hero-in>${esc(contact.successText)}</p>
    <a class="btn btn--solid" href="/" data-hero-in><span>Terug naar home</span></a>
  </div>
</section>`;
  return page(ctx, { title: 'Bedankt', path: '/bedankt/', body, bodyClass: 'page-thanks', noindex: true });
}

export function privacyPage(ctx) {
  const { privacy } = ctx;
  const body = `
<section class="phero phero--privacy">
  <div class="container prose">
    <p class="eyebrow" data-hero-in>bijgewerkt: ${esc(privacy.updated)}</p>
    <h1 class="phero__title phero__title--sm" data-hero-in>${esc(privacy.title)}</h1>
    <p class="prose__note" data-hero-in>${esc(privacy.note)}</p>
    ${privacy.sections.map((s) => `<h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>`).join('')}
  </div>
</section>`;
  return page(ctx, { title: privacy.title, path: '/privacy/', body, bodyClass: 'page-privacy' });
}

export function notFoundPage(ctx) {
  const body = `
<section class="phero phero--404">
  <div class="container">
    <p class="eyebrow" data-hero-in>404</p>
    <h1 class="phero__title" data-hero-in>Hier is het nog niet helder.</h1>
    <p class="phero__lead" data-hero-in>Deze pagina bestaat niet (meer). Geen zorgen, vanaf de homepage vind je alles weer.</p>
    <a class="btn btn--solid" href="/" data-hero-in><span>Naar de homepage</span></a>
  </div>
</section>`;
  return page(ctx, { title: 'Pagina niet gevonden', path: '/404.html', body, bodyClass: 'page-404', noindex: true });
}
