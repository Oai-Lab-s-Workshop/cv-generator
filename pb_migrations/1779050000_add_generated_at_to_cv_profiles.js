/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';
const GENERATED_AT_FIELD_ID = 'autodate1779050001';

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    if (!collection.fields.getByName('generated_at')) {
      collection.fields.add(
        new Field({
          hidden: false,
          id: GENERATED_AT_FIELD_ID,
          name: 'generated_at',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          required: false,
          system: false,
          type: 'autodate',
        }),
      );
    }

    app.save(collection);

    // Backfill existing records: set generated_at to created.
    const records = app.findRecordsByFilter(CV_PROFILES_COLLECTION_ID, '', '', 0, 0);

    for (const record of records) {
      const created = record.get('created');
      if (created && !record.get('generated_at')) {
        record.set('generated_at', created);
        app.save(record);
      }
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    if (collection.fields.getByName('generated_at')) {
      collection.fields.removeByName('generated_at');
    }

    return app.save(collection);
  },
);
