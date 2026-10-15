// Maakt een importbestand voor Sanity met alle huidige inhoud uit src/content/content.json,
// inclusief de beelden en video's. Gebruik:  node scripts/make-sanity-import.mjs
// Resultaat: claro-sanity-import.tar.gz (importeer met: npx sanity dataset import <bestand> production --missing)
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'sanity-import');
const bundle = path.join(out, 'claro-import');
const content = JSON.parse(await readFile(path.join(root, 'src/content/content.json'), 'utf8'));

await rm(out, { recursive: true, force: true });
await mkdir(path.join(bundle, 'files'), { recursive: true });
await mkdir(path.join(bundle, 'images'), { recursive: true });

// bestanden die al in het project staan naar het importpakket kopiëren
const used = new Map();
async function asset(kind, src) {
  const rel = src.startsWith('/') ? path.join(root, 'public', src) : path.join(root, src);
  const name = path.basename(rel);
  const dir = kind === 'image' ? 'images' : 'files';
  if (!used.has(name)) {
    await copyFile(rel, path.join(bundle, dir, name));
    used.set(name, true);
  }
  return { _type: kind === 'image' ? 'image' : 'file', _sanityAsset: `${kind}@file://./${dir}/${name}` };
}

let keyN = 0;
const key = () => `k${++keyN}`;

async function media(m) {
  if (!m) return undefined;
  const obj = { _type: 'media', _key: key(), file: await asset('file', m.src) };
  if (m.poster) obj.poster = await asset('image', m.poster);
  return obj;
}

const docs = [];
const s = content.site;

docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  heroVideo: await media(s.heroVideo),
  heroVideoMobile: await media(s.heroVideoMobile),
  heroTitle: s.heroTitle,
  marquee: s.marquee,
  servicesTitle: s.servicesTitle,
  clientsTitle: s.clientsTitle,
  ctaLabel: s.ctaLabel,
  instagram: s.instagram,
  linkedin: s.linkedin,
  email: s.email,
  kvk: s.kvk,
  byline: s.byline,
  description: s.description
});

for (const [i, svc] of content.services.entries()) {
  const cases = [];
  for (const c of svc.cases || []) {
    cases.push({
      _type: 'case',
      _key: key(),
      title: c.title,
      client: c.client,
      year: c.year,
      description: c.description,
      media: await Promise.all((c.media || []).map(media))
    });
  }
  docs.push({
    _id: `service-${svc.slug}`,
    _type: 'service',
    title: svc.title,
    slug: { _type: 'slug', current: svc.slug },
    order: i + 1,
    tags: svc.tags,
    media: await media(svc.media),
    intro: svc.intro,
    offer: (svc.offer || []).map((o) => ({ _key: key(), title: o.title, text: o.text })),
    cases
  });
}

for (const [i, c] of content.clients.entries()) {
  docs.push({
    _id: `client-${i + 1}`,
    _type: 'client',
    name: c.name,
    logo: await asset('file', c.file),
    order: i + 1
  });
}

const a = content.about;
docs.push({
  _id: 'aboutPage',
  _type: 'aboutPage',
  title: a.title,
  statement: a.statement,
  intro: a.intro,
  story: a.story,
  stepsTitle: a.stepsTitle,
  steps: a.steps.map((x) => ({ _key: key(), title: x.title, text: x.text })),
  teamTitle: a.teamTitle,
  team: a.team.map((p) => ({ _key: key(), name: p.name, role: p.role, bio: p.bio }))
});

docs.push({ _id: 'contactPage', _type: 'contactPage', ...content.contact });

const only = process.argv[2]; // optioneel: alleen dit document (_id) exporteren
const selected = only ? docs.filter((d) => d._id === only) : docs;
if (only && !selected.length) throw new Error(`Geen document met _id "${only}"`);
const clean = (v) => JSON.parse(JSON.stringify(v)); // laat lege velden weg
await writeFile(path.join(bundle, 'data.ndjson'), selected.map((d) => JSON.stringify(clean(d))).join('\n') + '\n');

const archive = path.join(root, only ? `claro-sanity-import-${only}.tar.gz` : 'claro-sanity-import.tar.gz');
execFileSync('tar', ['-czf', archive, '-C', out, 'claro-import']);
await rm(out, { recursive: true, force: true });

console.log(`✓ ${selected.length} documenten, ${used.size} bestanden → ${path.basename(archive)}`);
