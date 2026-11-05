// Bouwt de hele website naar de map "dist".  Gebruik:  node scripts/build.mjs
// Geen installatie nodig, alleen Node 20 of nieuwer.
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadContent } from './lib/content.mjs';
import { loadLogo } from './lib/svg.mjs';
import * as T from './lib/templates.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const exists = (p) => access(p).then(() => true, () => false);
const hash = (buf) => createHash('md5').update(buf).digest('hex').slice(0, 8);

const started = Date.now();

// 1. schone dist-map met alles uit /public (video's, lettertypen, favicon)
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });

// 2. CSS en JS met een hash in de bestandsnaam (zo zien bezoekers direct de nieuwste versie)
const css = await readFile(path.join(root, 'src/styles/main.css'));
const js = await readFile(path.join(root, 'src/scripts/main.js'));
const cssName = `main.${hash(css)}.css`;
const jsName = `main.${hash(js)}.js`;
await mkdir(path.join(dist, 'assets'), { recursive: true });
await writeFile(path.join(dist, 'assets', cssName), css);
await writeFile(path.join(dist, 'assets', jsName), js);

// 3. lettertypen: eigen bestanden in public/fonts (Inter en Inter Display, SIL Open Font License); Instrument Serif via Google Fonts
const fontFaces = [
  ['Display', 'InterDisplay-Black', 900, 'normal'],
  ['Display', 'InterDisplay-ExtraBold', 800, 'normal'],
  ['Text', 'Inter-Regular', 400, 'normal'],
  ['Text', 'Inter-Medium', 500, 'normal'],
  ['Text', 'Inter-SemiBold', 600, 'normal'],
];
const fonts = `<link rel="preload" href="/fonts/InterDisplay-Black.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="/fonts/Inter-Regular.woff" as="font" type="font/woff" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap">
<style>${fontFaces.map(([fam, file, w, st]) => `@font-face{font-family:'${fam}';src:url('/fonts/${file}.woff') format('woff');font-weight:${w};font-style:${st};font-display:swap}`).join('')}</style>`;

// 4. inhoud en logo
const content = await loadContent(root);
const logo = await loadLogo(path.join(root, 'src/assets/logo.svg'));

const ctx = { ...content, logo, fonts, assets: { css: `/assets/${cssName}`, js: `/assets/${jsName}` } };

// 5. pagina's schrijven
const pages = [];
async function write(rel, html) {
  const out = path.join(dist, rel);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, html);
  pages.push(rel);
}

await write('index.html', T.homePage(ctx));
await write('cases/index.html', T.casesPage(ctx));
for (const [i, p] of ctx.projects.entries()) {
  const next = ctx.projects[(i + 1) % ctx.projects.length];
  await write(`cases/${p.slug}/index.html`, T.casePage(ctx, p, ctx.projects.length > 1 ? next : null));
}
await write('wat-we-doen/index.html', T.servicesPage(ctx));
for (const s of ctx.services) {
  await write(`wat-we-doen/${s.slug}/index.html`, T.servicePage(ctx, s));
}
await write('over-ons/index.html', T.aboutPage(ctx));
await write('contact/index.html', T.contactPage(ctx));
await write('bedankt/index.html', T.thanksPage(ctx));
await write('privacy/index.html', T.privacyPage(ctx));
await write('404.html', T.notFoundPage(ctx));

// 6. sitemap en robots
const base = ctx.site.url.replace(/\/$/, '');
const urls = ['/', '/cases/', ...ctx.projects.map((p) => `/cases/${p.slug}/`), '/wat-we-doen/', ...ctx.services.map((s) => `/wat-we-doen/${s.slug}/`), '/over-ons/', '/contact/', '/privacy/'];
await writeFile(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${base}${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);

console.log(`✓ ${pages.length} pagina's gebouwd in ${Date.now() - started} ms`);
console.log(`  inhoud: ${content.source} · ${ctx.projects.length} projecten · ${ctx.services.length} diensten · ${ctx.clients.length} klantlogo's`);
