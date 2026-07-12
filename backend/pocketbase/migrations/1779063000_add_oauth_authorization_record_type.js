/// <reference path="../pb_data/types.d.ts" />

const RECORD_TYPE_FIELD_ID = 'selectoauthrt1';
const CONSENT_UNIQUE_INDEX_NAME = 'idx_oauth_authorizations_consent_user_client';
const CONSENT_UNIQUE_INDEX =
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_authorizations_consent_user_client ON oauth_authorizations (user, client_id) WHERE record_type = 'consent'";

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('oauth_authorizations');

    if (!collection.fields.getByName('record_type')) {
      collection.fields.add(
        new Field({
          hidden: false,
          id: RECORD_TYPE_FIELD_ID,
          maxSelect: 1,
          name: 'record_type',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: ['authorization', 'consent'],
        }),
      );
    }

    const indexes = [...collection.indexes];
    if (!indexes.some((index) => index.indexOf(CONSENT_UNIQUE_INDEX_NAME) !== -1)) {
      indexes.push(CONSENT_UNIQUE_INDEX);
      collection.indexes = indexes;
    }

    app.save(collection);
    app.db().newQuery("UPDATE oauth_authorizations SET record_type = 'authorization' WHERE record_type = '' OR record_type IS NULL").execute();
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('oauth_authorizations');

    collection.indexes = [...collection.indexes].filter(
      (index) => index.indexOf(CONSENT_UNIQUE_INDEX_NAME) === -1,
    );

    if (collection.fields.getByName('record_type')) {
      collection.fields.removeByName('record_type');
    }

    app.save(collection);
  },
);
