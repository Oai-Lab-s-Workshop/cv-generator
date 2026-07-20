/// <reference path="../pb_data/types.d.ts" />

const STATE_ID_FIELD_ID = 'textoauthstid1';
const STATE_ID_INDEX_NAME = 'idx_oauth_authorizations_state_id';
const STATE_ID_INDEX =
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_authorizations_state_id ON oauth_authorizations (state_id) WHERE state_id != ""';

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('oauth_authorizations');

    if (!collection.fields.getByName('state_id')) {
      collection.fields.add(
        new Field({
          autogeneratePattern: '',
          hidden: false,
          id: STATE_ID_FIELD_ID,
          max: 255,
          min: 0,
          name: 'state_id',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text',
        }),
      );
    }

    const indexes = [...collection.indexes];
    const hasStateIdIndex = indexes.some((index) => index.indexOf(STATE_ID_INDEX_NAME) !== -1);
    if (!hasStateIdIndex) {
      indexes.push(STATE_ID_INDEX);
      collection.indexes = indexes;
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('oauth_authorizations');

    collection.indexes = [...collection.indexes].filter(
      (index) => index.indexOf(STATE_ID_INDEX_NAME) === -1,
    );

    if (collection.fields.getByName('state_id')) {
      collection.fields.removeByName('state_id');
    }

    app.save(collection);
  },
);
