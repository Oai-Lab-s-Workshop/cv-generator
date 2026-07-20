/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';
const PROFILE_METADATA_COLLECTION_ID = 'profilemeta01ab';
const OWNER_RULE = '@request.auth.id != "" && user = @request.auth.id';
const OWNER_CREATE_RULE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const USER_OWNER_RULE = '@request.auth.id != "" && id = @request.auth.id';

function createProfileMetadataCollection() {
  return new Collection({
    id: PROFILE_METADATA_COLLECTION_ID,
    name: 'profile_metadata',
    type: 'base',
    listRule: OWNER_RULE,
    viewRule: OWNER_RULE,
    createRule: OWNER_CREATE_RULE,
    updateRule: OWNER_RULE,
    deleteRule: OWNER_RULE,
    fields: [
      {
        id: 'relprofilemet01',
        name: 'user',
        type: 'relation',
        required: true,
        collectionId: USERS_COLLECTION_ID,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      },
      {
        id: 'textprofilem01',
        name: 'writingStyleDescription',
        type: 'text',
        required: false,
        min: 0,
        max: 5000,
      },
      {
        id: 'textprofilem02',
        name: 'writingStyleUrl',
        type: 'text',
        required: false,
        min: 0,
        max: 2000,
      },
      {
        id: 'autoprofilem01',
        name: 'created',
        type: 'autodate',
        onCreate: true,
        onUpdate: false,
      },
      {
        id: 'autoprofilem02',
        name: 'updated',
        type: 'autodate',
        onCreate: true,
        onUpdate: true,
      },
    ],
    indexes: ['CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_metadata_user ON profile_metadata (user)'],
  });
}

function backfillProfileMetadata(app, collection) {
  const users = app.findAllRecords(USERS_COLLECTION_ID);

  for (const user of users) {
    const description = user.getString('writingStyleDescription');
    const url = user.getString('writingStyleUrl');
    if (!description && !url) continue;

    const metadata = new Record(collection);
    metadata.set('user', user.id);
    metadata.set('writingStyleDescription', description);
    metadata.set('writingStyleUrl', url);
    app.save(metadata);
  }
}

migrate(
  (app) => {
    let metadata;
    try {
      metadata = app.findCollectionByNameOrId(PROFILE_METADATA_COLLECTION_ID);
    } catch (_) {
      metadata = createProfileMetadataCollection();
      app.save(metadata);
      backfillProfileMetadata(app, metadata);
    }

    // MCP data operations never require access to auth records.
    const users = app.findCollectionByNameOrId(USERS_COLLECTION_ID);
    users.listRule = USER_OWNER_RULE;
    users.viewRule = USER_OWNER_RULE;
    app.save(users);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId(PROFILE_METADATA_COLLECTION_ID));
    } catch (_) {
      // Collection is already absent.
    }
  },
);
