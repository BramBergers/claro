// Haalt de inhoud op: uit Sanity (als SANITY_PROJECT_ID is ingesteld) of uit src/content/content.json.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { recolorSvg } from './svg.mjs';

const API_VERSION = '2024-10-01';

const mediaProjection = `{ "url": file.asset->url, "mime": file.asset->mimeType, "poster": poster.asset->url }`;

const QUERY = `{
  "site": *[_type == "siteSettings"][0]{
    heroTitle, ctaLabel, servicesTitle, clientsTitle, marquee,
    instagram, linkedin, email, kvk, byline, description,
    "heroVideo": heroVideo${mediaProjection}
  },
  "services": *[_type == "service"] | order(order asc, title asc){
    title, "slug": slug.current, tags, intro, offer[]{ title, text },
    "media": media${mediaProjection},
    cases[]{ title, client, year, description, "media": media[]${mediaProjection} }
  },
  "clients": *[_type == "client"] | order(order asc, name asc){ name, "url": logo.asset->url },
  "about": *[_type == "aboutPage"][0]{
    title, statement, intro, story, stepsTitle, steps[]{ title, text }, teamTitle,
    team[]{ name, role, bio, "photo": photo.asset->url }
  },
  "contact": *[_type == "contactPage"][0]{ title, intro, formTitle, successTitle, successText }
}`;

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);
const strip = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => !isEmpty(v)));

/** {url, mime, poster} uit Sanity -> {type, src, poster} */
function toMedia(m) {
  if (!m) return null;
  if (m.src) return { type: guessType(m.src), src: m.src, poster: m.poster || null };
  if (!m.url) return null;
  const type = (m.mime || '').startsWith('image/') ? 'image' : guessType(m.url);
  return { type, src: m.url, poster: m.poster || null };
}

function guessType(src = '') {
  return /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(src) ? 'image' : 'video';
}

function normalizeMedia(obj) {
  return toMedia(obj);
}

async function fetchSanity(projectId, dataset) {
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(QUERY)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity gaf status ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return json.result;
}

export async function loadContent(root) {
  const local = JSON.parse(await readFile(path.join(root, 'src/content/content.json'), 'utf8'));
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';

  let remote = null;
  if (projectId) {
    // Bij een fout laten we de build bewust mislukken: Netlify houdt dan de vorige werkende versie online.
    remote = await fetchSanity(projectId, dataset);
  }

  const site = { ...local.site, ...strip(remote?.site) };
  site.heroVideo = normalizeMedia(remote?.site?.heroVideo) || normalizeMedia(local.site.heroVideo);

  const remoteServices = (remote?.services || []).filter((s) => s.title && s.slug);
  const services = (remoteServices.length ? remoteServices : local.services).map((s) => ({
    title: s.title,
    slug: s.slug,
    tags: s.tags || [],
    intro: s.intro || '',
    offer: s.offer || [],
    media: normalizeMedia(s.media),
    cases: (s.cases || []).map((c) => ({
      title: c.title,
      client: c.client || '',
      year: c.year || '',
      description: c.description || '',
      media: (c.media || []).map(normalizeMedia).filter(Boolean)
    }))
  }));

  // klantlogo's: SVG-tekst ophalen (uit Sanity) of lezen (lokaal) en inline zetten
  const remoteClients = (remote?.clients || []).filter((c) => c.url);
  const clientSources = remoteClients.length ? remoteClients : local.clients;
  const clients = [];
  for (const c of clientSources) {
    try {
      let raw;
      if (c.url) {
        const r = await fetch(c.url);
        if (!r.ok) throw new Error(`status ${r.status}`);
        raw = await r.text();
      } else {
        raw = await readFile(path.join(root, c.file), 'utf8');
      }
      clients.push({ name: c.name, svg: recolorSvg(raw, { label: c.name }) });
    } catch (err) {
      console.warn(`⚠ Klantlogo "${c.name}" overgeslagen: ${err.message}`);
    }
  }

  const about = { ...local.about, ...strip(remote?.about) };
  const contact = { ...local.contact, ...strip(remote?.contact) };

  return {
    source: projectId ? `Sanity (${projectId}/${dataset})` : 'lokale inhoud',
    site,
    services,
    clients,
    about,
    contact,
    privacy: local.privacy
  };
}
