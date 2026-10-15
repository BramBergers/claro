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

// 3. lettertype: eigen bestand als dat er is, anders Google Fonts
const localFont = path.join(root, 'public/fonts/Unbounded.woff2');
const fonts = (await exists(localFont))
  ? `<link rel="preload" href="/fonts/Unbounded.woff2" as="font" type="font/woff2" crossorigin>
<style>@font-face{font-family:'Unbounded';src:url('/fonts/Unbounded.woff2') format('woff2');font-weight:200 900;font-style:normal;font-display:swap}</style>`
  : `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@200..900&display=swap">`;

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
for (const [i, s] of ctx.services.entries()) {
  await write(`werk/${s.slug}/index.html`, T.servicePage(ctx, s, i));
}
await write('over-claro/index.html', T.aboutPage(ctx));
await write('contact/index.html', T.contactPage(ctx));
await write('bedankt/index.html', T.thanksPage(ctx));
await write('privacy/index.html', T.privacyPage(ctx));
await write('404.html', T.notFoundPage(ctx));

// 6. sitemap en robots
const base = ctx.site.url.replace(/\/$/, '');
const urls = ['/', ...ctx.services.map((s) => `/werk/${s.slug}/`), '/over-claro/', '/contact/', '/privacy/'];
await writeFile(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${base}${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);

console.log(`✓ ${pages.length} pagina's gebouwd in ${Date.now() - started} ms`);
console.log(`  inhoud: ${content.source} · ${ctx.services.length} diensten · ${ctx.clients.length} klantlogo's`);
console.log(`  lettertype: ${(await exists(localFont)) ? 'eigen bestand (public/fonts)' : 'Google Fonts'}`);
