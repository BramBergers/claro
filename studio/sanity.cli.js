import { defineCliConfig } from 'sanity/cli';

// Vul hier je Sanity projectId in (te vinden op sanity.io/manage)
export default defineCliConfig({
  api: { projectId: 'hv6kxjar', dataset: 'production' }
});
