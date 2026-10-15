import { defineField, defineType } from 'sanity';

/* Beeld of video: MP4, PNG, JPG of WebP. Voor video kun je optioneel een stilstaand plaatje (poster) kiezen. */
export const media = defineType({
  name: 'media',
  title: 'Beeld of video',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'Bestand',
      type: 'file',
      description: 'MP4, PNG, JPG of WebP. Tip: video onder de 8 MB, afbeeldingen onder de 500 KB.',
      options: { accept: 'video/mp4,image/png,image/jpeg,image/webp' },
      validation: (r) => r.required()
    }),
    defineField({
      name: 'poster',
      title: 'Voorbeeldplaatje (alleen voor video, optioneel)',
      type: 'image',
      description: 'Dit plaatje is te zien terwijl de video laadt.'
    })
  ],
  preview: { select: { title: 'file.asset.originalFilename' } }
});

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Website-instellingen',
  type: 'document',
  fields: [
    defineField({ name: 'heroVideo', title: 'Header-video (homepage, desktop)', type: 'media' }),
    defineField({ name: 'heroVideoMobile', title: 'Header-video (homepage, mobiel, staand)', type: 'media', description: 'Optioneel. Staande video (9:16) voor telefoons. Leeg laten? Dan gebruikt de telefoon de desktopvideo.' }),
    defineField({ name: 'heroTitle', title: 'Kop in de intro', type: 'string', description: 'Het eerste woord wordt lichtpaars, de punt aan het eind ook.' }),
    defineField({ name: 'marquee', title: 'Streamer onder de video', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'servicesTitle', title: 'Titel boven de diensten', type: 'string' }),
    defineField({ name: 'clientsTitle', title: 'Titel boven de klanten', type: 'string' }),
    defineField({ name: 'ctaLabel', title: 'Tekst van de contactknop', type: 'string' }),
    defineField({ name: 'instagram', title: 'Instagram-link', type: 'url' }),
    defineField({ name: 'linkedin', title: 'LinkedIn-link', type: 'url' }),
    defineField({ name: 'email', title: 'E-mailadres', type: 'string' }),
    defineField({ name: 'kvk', title: 'KvK-nummer', type: 'string' }),
    defineField({ name: 'byline', title: 'Namen in de footer ("by ...")', type: 'string' }),
    defineField({ name: 'description', title: 'Beschrijving voor Google', type: 'text', rows: 3 })
  ],
  preview: { prepare: () => ({ title: 'Website-instellingen' }) }
});

export const service = defineType({
  name: 'service',
  title: 'Dienst',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Naam', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Adres', type: 'slug', options: { source: 'title', maxLength: 60 }, validation: (r) => r.required(), description: 'Wordt het webadres, bijvoorbeeld /werk/motion/' }),
    defineField({ name: 'order', title: 'Volgorde', type: 'number', description: 'Laagste nummer staat bovenaan.' }),
    defineField({ name: 'tags', title: 'Kernwoorden (rechts in de lijst)', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'media', title: 'Voorbeeld bij hover en bovenaan de pagina', type: 'media', description: 'Dit beeld verschijnt schuin als je over de dienst beweegt en vult het scherm bij een klik.' }),
    defineField({ name: 'intro', title: 'Inleiding op de dienstpagina', type: 'text', rows: 4 }),
    defineField({
      name: 'offer',
      title: 'Wat we doen (blokjes)',
      type: 'array',
      of: [{ type: 'object', fields: [defineField({ name: 'title', title: 'Titel', type: 'string' }), defineField({ name: 'text', title: 'Tekst', type: 'text', rows: 2 })], preview: { select: { title: 'title', subtitle: 'text' } } }]
    }),
    defineField({
      name: 'cases',
      title: 'Cases',
      type: 'array',
      of: [{
        type: 'object',
        name: 'case',
        fields: [
          defineField({ name: 'title', title: 'Titel', type: 'string' }),
          defineField({ name: 'client', title: 'Klant', type: 'string' }),
          defineField({ name: 'year', title: 'Jaar', type: 'string' }),
          defineField({ name: 'description', title: 'Beschrijving', type: 'text', rows: 4 }),
          defineField({ name: 'media', title: 'Beelden en video\'s (de eerste is de grote)', type: 'array', of: [{ type: 'media' }] })
        ],
        preview: { select: { title: 'title', subtitle: 'client' } }
      }]
    })
  ],
  orderings: [{ title: 'Volgorde', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'slug.current' } }
});

export const client = defineType({
  name: 'client',
  title: 'Klant',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Naam', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'logo',
      title: 'Logo (SVG)',
      type: 'file',
      options: { accept: 'image/svg+xml' },
      description: 'Upload het logo als SVG. De kleur wordt automatisch lichtpaars, ongeacht de kleur van je bestand (wit is prima).',
      validation: (r) => r.required()
    }),
    defineField({ name: 'order', title: 'Volgorde', type: 'number' })
  ],
  preview: { select: { title: 'name' } }
});

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'Pagina: Over Claro',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Kleine titel boven de kop', type: 'string' }),
    defineField({ name: 'statement', title: 'Grote kop', type: 'string' }),
    defineField({ name: 'intro', title: 'Korte inleiding', type: 'text', rows: 3 }),
    defineField({ name: 'story', title: 'Ons verhaal (alinea\'s)', type: 'array', of: [{ type: 'text', rows: 4 }] }),
    defineField({ name: 'stepsTitle', title: 'Titel bij de stappen', type: 'string' }),
    defineField({
      name: 'steps',
      title: 'Stappen ("Zo werken we")',
      type: 'array',
      of: [{ type: 'object', fields: [defineField({ name: 'title', title: 'Titel', type: 'string' }), defineField({ name: 'text', title: 'Tekst', type: 'text', rows: 2 })], preview: { select: { title: 'title', subtitle: 'text' } } }]
    }),
    defineField({ name: 'teamTitle', title: 'Titel bij het team', type: 'string' }),
    defineField({
      name: 'team',
      title: 'Team',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'name', title: 'Naam', type: 'string' }),
          defineField({ name: 'role', title: 'Functie', type: 'string' }),
          defineField({ name: 'bio', title: 'Korte tekst', type: 'text', rows: 3 }),
          defineField({ name: 'photo', title: 'Foto (optioneel)', type: 'image', options: { hotspot: true } })
        ],
        preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } }
      }]
    })
  ],
  preview: { prepare: () => ({ title: 'Pagina: Over Claro' }) }
});

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Pagina: Contact',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Kop', type: 'string' }),
    defineField({ name: 'intro', title: 'Inleiding', type: 'text', rows: 3 }),
    defineField({ name: 'formTitle', title: 'Titel boven het formulier', type: 'string' }),
    defineField({ name: 'successTitle', title: 'Titel na versturen', type: 'string' }),
    defineField({ name: 'successText', title: 'Tekst na versturen', type: 'text', rows: 2 })
  ],
  preview: { prepare: () => ({ title: 'Pagina: Contact' }) }
});

export const schemaTypes = [media, siteSettings, service, client, aboutPage, contactPage];
