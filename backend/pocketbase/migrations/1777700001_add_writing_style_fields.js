/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';

migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId(USERS_COLLECTION_ID);
    if (!usersCollection) return;

    // Free-form writing/style description guidance for MCP-generated content
    if (!usersCollection.fields.getByName('writingStyleDescription')) {
      usersCollection.fields.add(
        new Field({
          hidden: false,
          id: 'text1777700101',
          max: 5000,
          min: 0,
          name: 'writingStyleDescription',
          pattern: '',
          presentable: false,
          required: false,
          system: false,
          type: 'text',
        }),
      );
    }

    // Optional style reference URL. PocketBase migration `url` type is not
    // reliably available in this version, so persist as text (max 2000) and
    // rely on frontend validation / URL input type.
    if (!usersCollection.fields.getByName('writingStyleUrl')) {
      usersCollection.fields.add(
        new Field({
          hidden: false,
          id: 'text1777700102',
          max: 2000,
          min: 0,
          name: 'writingStyleUrl',
          pattern: '',
          presentable: false,
          required: false,
          system: false,
          type: 'text',
        }),
      );
    }

    app.save(usersCollection);
  },
  (app) => {
    const usersCollection = app.findCollectionByNameOrId(USERS_COLLECTION_ID);
    if (!usersCollection) return;

    if (usersCollection.fields.getByName('writingStyleDescription')) {
      usersCollection.fields.removeByName('writingStyleDescription');
    }
    if (usersCollection.fields.getByName('writingStyleUrl')) {
      usersCollection.fields.removeByName('writingStyleUrl');
    }

    app.save(usersCollection);
  },
);
