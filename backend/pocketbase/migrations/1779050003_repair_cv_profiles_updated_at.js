/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';
const UPDATED_AT_FIELD_ID = 'autodate1779050002';

function createUpdatedAtField() {
  return new Field({
    hidden: false,
    id: UPDATED_AT_FIELD_ID,
    name: 'updated_at',
    onCreate: true,
    onUpdate: true,
    presentable: false,
    required: false,
    system: false,
    type: 'autodate',
  });
}

migrate(
  (app) => {
    let collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    // Force-recreate the derived field because production may have the old
    // migration marked as applied while the live schema still rejects sorting.
    if (collection.fields.getByName('updated_at')) {
      collection.fields.removeByName('updated_at');
      app.save(collection);
      collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    }

    collection.fields.add(createUpdatedAtField());
    app.save(collection);

    const records = app.findRecordsByFilter(CV_PROFILES_COLLECTION_ID, '', '', 0, 0);
    for (const record of records) {
      if (!record.get('updated_at')) {
        record.set('updated_at', record.get('updated') || record.get('created') || new Date().toISOString());
        app.save(record);
      }
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    if (collection.fields.getByName('updated_at')) {
      collection.fields.removeByName('updated_at');
      app.save(collection);
    }
  },
);
