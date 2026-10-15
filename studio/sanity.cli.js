import { defineCliConfig } from 'sanity/cli';

// Vul hier je Sanity projectId in (te vinden op sanity.io/manage)
export default defineCliConfig({
  api: { projectId: 'VUL_HIER_JE_PROJECT_ID_IN', dataset: 'production' }
});
