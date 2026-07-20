/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';
const OWNER_FIELD_ID_BY_COLLECTION = {
  achievements: 'relation1776096801',
  hobbies: 'relation1776096802',
  skills: 'relation1776096803',
  projects: 'relation1776096804',
  jobs: 'relation1776096805',
  degrees: 'relation1776096806',
  files: 'relation1776096807',
};

function addOwnerField(collectionName) {
  return new Field({
    hidden: false,
    id: OWNER_FIELD_ID_BY_COLLECTION[collectionName],
    name: 'user',
    presentable: false,
    required: false,
    system: false,
    type: 'relation',
    collectionId: USERS_COLLECTION_ID,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
  });
}

function ensureOwnerField(app, collectionName) {
  const collection = app.findCollectionByNameOrId(collectionName);

  if (!collection.fields.getByName('user')) {
    collection.fields.add(addOwnerField(collectionName));
    app.save(collection);
  }
}

function assignOwnerToRecords(app, collectionName, recordIds, ownerId) {
  for (const recordId of recordIds || []) {
    const record = app.findRecordById(collectionName, recordId);

    if (!record) {
      continue;
    }

    record.set('user', ownerId);
    app.save(record);
  }
}

function backfillOwners(app) {
  const profiles = app.findAllRecords('cv_profiles');

  for (const profile of profiles) {
    const ownerId = profile.getString('user');

    if (!ownerId) {
      continue;
    }

    assignOwnerToRecords(app, 'achievements', profile.getStringSlice('achievements'), ownerId);
    assignOwnerToRecords(app, 'projects', profile.getStringSlice('projects'), ownerId);
    assignOwnerToRecords(app, 'hobbies', profile.getStringSlice('hobbies'), ownerId);
    assignOwnerToRecords(app, 'jobs', profile.getStringSlice('jobs'), ownerId);
    assignOwnerToRecords(app, 'degrees', profile.getStringSlice('degrees'), ownerId);
    assignOwnerToRecords(app, 'skills', profile.getStringSlice('skills'), ownerId);
  }
}

migrate(
  (app) => {
    ensureOwnerField(app, 'achievements');
    ensureOwnerField(app, 'hobbies');
    ensureOwnerField(app, 'skills');
    ensureOwnerField(app, 'projects');
    ensureOwnerField(app, 'jobs');
    ensureOwnerField(app, 'degrees');
    ensureOwnerField(app, 'files');
    backfillOwners(app);
  },
  (app) => {
    const collections = ['achievements', 'hobbies', 'skills', 'projects', 'jobs', 'degrees', 'files'];

    for (const collectionName of collections) {
      const collection = app.findCollectionByNameOrId(collectionName);
      const ownerFieldId = OWNER_FIELD_ID_BY_COLLECTION[collectionName];

      if (ownerFieldId) {
        collection.fields.removeById(ownerFieldId);
        app.save(collection);
      }
    }
  },
);
