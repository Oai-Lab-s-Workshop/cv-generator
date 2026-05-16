/// <reference path="../pb_data/types.d.ts" />

const OWNER_CREATE_RULE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const OWNER_WRITE_RULE = '@request.auth.id != "" && user = @request.auth.id';
const MATERIAL_COLLECTIONS = ['projects', 'achievements', 'degrees', 'hobbies', 'files'];

migrate(
  (app) => {
    for (const collectionName of MATERIAL_COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(collectionName);
      collection.createRule = OWNER_CREATE_RULE;
      collection.updateRule = OWNER_WRITE_RULE;
      collection.deleteRule = OWNER_WRITE_RULE;
      app.save(collection);
    }
  },
  (app) => {
    for (const collectionName of MATERIAL_COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(collectionName);
      collection.createRule = null;
      collection.updateRule = null;
      collection.deleteRule = null;
      app.save(collection);
    }
  },
);
