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
  groups: [
    { name: 'home', title: 'Homepage', default: true },
    { name: 'pages', title: 'Pagina-titels' },
    { name: 'contact', title: 'Contact & footer' }
  ],
  fields: [
    defineField({ name: 'heroTitle', title: 'Grote titel bovenaan', type: 'string', group: 'home' }),
    defineField({ name: 'heroIntro', title: 'Korte intro onder de titel', type: 'text', rows: 3, group: 'home' }),
    defineField({ name: 'showreel', title: 'Video naast de titel (showreel)', type: 'media', group: 'home', description: 'Korte, snelle montage van jullie werk. Staand of vierkant werkt het mooist (bijv. 4:5). Liefst onder de 8 MB.' }),
    defineField({ name: 'recentTitle', title: 'Titel boven de recente projecten', type: 'string', group: 'home' }),
    defineField({ name: 'servicesTitle', title: 'Titel boven de diensten', type: 'string', group: 'home' }),
    defineField({ name: 'servicesIntro', title: 'Tekst bij de diensten', type: 'text', rows: 2, group: 'home' }),
    defineField({ name: 'clientsTitle', title: 'Titel boven de klantlogo\'s', type: 'string', group: 'home' }),
    defineField({ name: 'ctaTitle', title: 'Contactblok: begin van de zin', type: 'string', group: 'home', description: 'Bijvoorbeeld "Klaar om het".' }),
    defineField({ name: 'ctaWords', title: 'Contactblok: wisselende woorden', type: 'array', of: [{ type: 'string' }], group: 'home', description: 'Bijvoorbeeld "helder", "duidelijk", "Claro".' }),
    defineField({ name: 'ctaEnd', title: 'Contactblok: einde van de zin', type: 'string', group: 'home', description: 'Bijvoorbeeld "te maken?".' }),
    defineField({ name: 'ctaText', title: 'Contactblok: tekst', type: 'text', rows: 2, group: 'home' }),
    defineField({ name: 'ctaLabel', title: 'Tekst van de contactknop', type: 'string', group: 'home' }),
    defineField({ name: 'casesTitle', title: 'Cases-pagina: titel', type: 'string', group: 'pages' }),
    defineField({ name: 'casesIntro', title: 'Cases-pagina: intro', type: 'text', rows: 3, group: 'pages' }),
    defineField({ name: 'servicesPageTitle', title: 'Wat we doen: titel', type: 'string', group: 'pages' }),
    defineField({ name: 'servicesPageIntro', title: 'Wat we doen: intro', type: 'text', rows: 3, group: 'pages' }),
    defineField({ name: 'instagram', title: 'Instagram-link', type: 'url', group: 'contact' }),
    defineField({ name: 'linkedin', title: 'LinkedIn-link', type: 'url', group: 'contact' }),
    defineField({ name: 'email', title: 'E-mailadres', type: 'string', group: 'contact' }),
    defineField({ name: 'phone', title: 'Telefoonnummer', type: 'string', group: 'contact', description: 'Bijvoorbeeld +31 6 12345678.' }),
    defineField({ name: 'kvk', title: 'KvK-nummer', type: 'string', group: 'contact' }),
    defineField({ name: 'byline', title: 'Namen in de footer ("by ...")', type: 'string', group: 'contact' }),
    defineField({ name: 'description', title: 'Beschrijving voor Google', type: 'text', rows: 3, group: 'contact' })
  ],
  preview: { prepare: () => ({ title: 'Website-instellingen' }) }
});

export const service = defineType({
  name: 'service',
  title: 'Dienst',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Naam', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Adres', type: 'slug', options: { source: 'title', maxLength: 60 }, validation: (r) => r.required(), description: 'Wordt het webadres, bijvoorbeeld /wat-we-doen/motion/' }),
    defineField({ name: 'order', title: 'Volgorde', type: 'number', description: 'Laagste nummer staat bovenaan.' }),
    defineField({ name: 'short', title: 'Korte omschrijving (één zin)', type: 'string', description: 'Staat bij de dienst op de homepage en op "Wat we doen".' }),
    defineField({ name: 'intro', title: 'Intro op de dienstpagina', type: 'text', rows: 4 }),
    defineField({
      name: 'offer',
      title: 'Wat we doen (blokjes)',
      type: 'array',
      of: [{ type: 'object', fields: [defineField({ name: 'title', title: 'Titel', type: 'string' }), defineField({ name: 'text', title: 'Tekst', type: 'text', rows: 2 })], preview: { select: { title: 'title', subtitle: 'text' } } }]
    }),
    defineField({
      name: 'cases',
      title: 'Oude cases (niet meer gebruiken)',
      type: 'array',
      hidden: ({ value }) => !value || !value.length,
      readOnly: true,
      description: 'Deze cases staan nog op de site zolang er geen projecten zijn. Zet ze over naar "Projecten" en verwijder ze hier daarna.',
      of: [{
        type: 'object',
        name: 'case',
        fields: [
          defineField({ name: 'title', title: 'Titel', type: 'string' }),
          defineField({ name: 'client', title: 'Klant', type: 'string' }),
          defineField({ name: 'year', title: 'Jaar', type: 'string' }),
          defineField({ name: 'description', title: 'Beschrijving', type: 'text', rows: 4 }),
          defineField({ name: 'media', title: 'Beelden en video\'s', type: 'array', of: [{ type: 'media' }] })
        ],
        preview: { select: { title: 'title', subtitle: 'client' } }
      }]
    })
  ],
  orderings: [{ title: 'Volgorde', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'short' } }
});

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'client', title: 'Bedrijf', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'title', title: 'Titel van de case', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Adres', type: 'slug', options: { source: (doc) => `${doc.client || ''} ${doc.title || ''}`, maxLength: 70 }, validation: (r) => r.required(), description: 'Wordt het webadres, bijvoorbeeld /cases/hekoned-huisstijl/' }),
    defineField({ name: 'date', title: 'Datum', type: 'date', description: 'De nieuwste projecten staan bovenaan en de drie nieuwste komen op de homepage.', validation: (r) => r.required() }),
    defineField({ name: 'services', title: 'Diensten (tags)', type: 'array', of: [{ type: 'reference', to: [{ type: 'service' }] }], description: 'Het project verschijnt automatisch op de pagina van elke gekozen dienst.' }),
    defineField({ name: 'intro', title: 'Korte intro', type: 'text', rows: 3 }),
    defineField({ name: 'body', title: 'Verhaal (alinea\'s)', type: 'array', of: [{ type: 'text', rows: 4 }], description: 'Optioneel. Bijvoorbeeld: de vraag, onze aanpak en het resultaat.' }),
    defineField({ name: 'media', title: 'Beelden en video\'s', type: 'array', of: [{ type: 'media' }], description: 'Het eerste beeld is de grote afbeelding in de overzichten.', validation: (r) => r.min(1) })
  ],
  orderings: [{ title: 'Nieuwste eerst', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'client' } }
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
      description: 'Upload het logo als SVG. De kleur wordt automatisch aangepast aan de website, ongeacht de kleur van je bestand.',
      validation: (r) => r.required()
    }),
    defineField({ name: 'order', title: 'Volgorde', type: 'number' })
  ],
  preview: { select: { title: 'name' } }
});

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'Pagina: Over ons',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Kleine titel boven de kop', type: 'string' }),
    defineField({ name: 'statement', title: 'Grote kop', type: 'string' }),
    defineField({ name: 'intro', title: 'Korte inleiding', type: 'text', rows: 3 }),
    defineField({ name: 'pillarsTitle', title: 'Titel: waar staan we voor', type: 'string' }),
    defineField({
      name: 'pillars',
      title: 'Waar staan we voor (2 tot 4 punten)',
      type: 'array',
      of: [{ type: 'object', fields: [defineField({ name: 'title', title: 'Titel', type: 'string' }), defineField({ name: 'text', title: 'Tekst', type: 'text', rows: 2 })], preview: { select: { title: 'title', subtitle: 'text' } } }]
    }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 3 }),
    defineField({ name: 'quoteAuthor', title: 'Van wie is de quote', type: 'string' }),
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
  preview: { prepare: () => ({ title: 'Pagina: Over ons' }) }
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

export const schemaTypes = [media, siteSettings, project, service, client, aboutPage, contactPage];
