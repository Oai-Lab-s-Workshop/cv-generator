/// <reference path="../pb_data/types.d.ts" />

// Security fix: the CV material collections were created in 001_cv_schema.js with
// listRule/viewRule = "" (public in PocketBase), which let any unauthenticated
// client enumerate every user's résumé data across the whole instance.
// Restrict reads to the record owner and the MCP service account. Public CV
// rendering is unaffected: it goes through the custom /api/custom/cv-data/by-slug
// hook, which reads via $app.findRecordById in a superuser context and bypasses
// collection rules.

const OWNER_OR_SERVICE_READ_RULE =
  '@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true)';

const MATERIAL_COLLECTIONS = ['achievements', 'hobbies', 'skills', 'projects', 'jobs', 'degrees', 'files'];

migrate(
  (app) => {
    for (const collectionName of MATERIAL_COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(collectionName);
      collection.listRule = OWNER_OR_SERVICE_READ_RULE;
      collection.viewRule = OWNER_OR_SERVICE_READ_RULE;
      app.save(collection);
    }
  },
  (app) => {
    for (const collectionName of MATERIAL_COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(collectionName);
      collection.listRule = '';
      collection.viewRule = '';
      app.save(collection);
    }
  },
);
