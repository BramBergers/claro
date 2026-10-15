// Hulpjes om SVG's te verwerken: het logo (met losse kleur voor de punt)
// en klantlogo's (die allemaal dezelfde paarse kleur krijgen).
import { readFile } from 'node:fs/promises';

const SHAPE = /<(path|circle|ellipse|rect|polygon|polyline|line)\b[^>]*?\/>/g;

/** Eerste getal in een vorm, gebruikt om de letters van links naar rechts te sorteren. */
function xKey(tag) {
  const d = tag.match(/\sd="\s*M\s*(-?[\d.]+)/i);
  if (d) return parseFloat(d[1]);
  const c = tag.match(/\s(?:cx|x)="(-?[\d.]+)"/);
  return c ? parseFloat(c[1]) : 0;
}

/**
 * Leest het logo-SVG en maakt er een kleurbare versie van.
 * - Alle vormen krijgen de kleur van de tekst (currentColor).
 * - De vorm met id="dot" is de punt en krijgt een eigen kleur (accent).
 */
export async function loadLogo(file) {
  const raw = await readFile(file, 'utf8');
  const open = raw.match(/<svg[^>]*>/)?.[0] ?? '<svg>';
  const viewBox = open.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100';
  const inner = raw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const tags = [...inner.matchAll(SHAPE)].map((m) => m[0]);

  const order = tags.map((t, i) => ({ i, x: xKey(t) })).sort((a, b) => a.x - b.x);
  const rank = new Map(order.map((o, n) => [o.i, n]));

  const shapes = tags.map((tag, i) => {
    const isDot = /\sid="dot"/i.test(tag);
    const clean = tag.replace(/\sfill="(?!none)[^"]*"/g, '').replace(/\sid="[^"]*"/g, '');
    const cls = isDot ? 'logo__shape logo__dot' : 'logo__shape';
    return clean.replace(/^<(\w+)/, `<$1 class="${cls}" style="--i:${rank.get(i)}"`);
  });

  return { viewBox, shapes: shapes.join('') };
}

/** Zet het logo als inline SVG neer. variant: "default" (witte letters, paarse punt) of "mono" (alles één kleur). */
export function renderLogo(logo, { variant = 'default', className = '' } = {}) {
  const cls = `logo logo--${variant}${className ? ' ' + className : ''}`;
  return `<svg class="${cls}" viewBox="${logo.viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Claro">${logo.shapes}</svg>`;
}

let uid = 0;

/**
 * Maakt van een geüpload klantlogo (wit, paars of een andere kleur) een inline SVG
 * die de kleur van de omringende tekst volgt. Onveilige onderdelen worden verwijderd.
 */
export function recolorSvg(raw, { label = '' } = {}) {
  let svg = raw
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\s(?:xlink:)?href="\s*javascript:[^"]*"/gi, '')
    .trim();

  // unieke id's, zodat meerdere inline logo's elkaar niet in de weg zitten
  const n = ++uid;
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    svg = svg.split(`id="${id}"`).join(`id="${id}-${n}"`).split(`#${id})`).join(`#${id}-${n})`);
  }

  // kleuren overnemen van de tekstkleur
  svg = svg
    .replace(/\sfill="(?!none|url)[^"]*"/g, ' fill="currentColor"')
    .replace(/\sstroke="(?!none|url)[^"]*"/g, ' stroke="currentColor"');

  // root-element opschonen
  svg = svg.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    const clean = attrs.replace(/\s(?:width|height|class|role|aria-label|fill)="[^"]*"/g, '');
    return `<svg${clean} class="client-logo__svg" role="img" aria-label="${label.replace(/"/g, '&quot;')}" fill="currentColor" focusable="false">`;
  });
  return svg;
}
