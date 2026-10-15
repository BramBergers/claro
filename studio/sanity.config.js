import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes/index.js';

// Deze documenten bestaan maar één keer ("singletons")
const singletons = [
  { id: 'siteSettings', title: 'Website-instellingen' },
  { id: 'aboutPage', title: 'Pagina: Over Claro' },
  { id: 'contactPage', title: 'Pagina: Contact' }
];

export default defineConfig({
  name: 'claro',
  title: 'Claro',
  projectId: 'hv6kxjar',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Inhoud')
          .items([
            ...singletons.map((s) => S.listItem().title(s.title).id(s.id).child(S.document().schemaType(s.id).documentId(s.id))),
            S.divider(),
            S.documentTypeListItem('service').title('Diensten'),
            S.documentTypeListItem('client').title('Klanten (logo\'s)')
          ])
    })
  ],
  schema: {
    types: schemaTypes,
    // singletons kunnen niet worden aangemaakt of verwijderd, alleen aangepast
    templates: (templates) => templates.filter(({ schemaType }) => !singletons.some((s) => s.id === schemaType))
  },
  document: {
    actions: (input, context) =>
      singletons.some((s) => s.id === context.schemaType)
        ? input.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : input
  }
});
