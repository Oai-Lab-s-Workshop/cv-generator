/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cvprofile001abc');

    if (!collection.fields.getByName('updated_at')) {
      collection.fields.add(
        new Field({
          hidden: false,
          id: 'autodate1779050002',
          name: 'updated_at',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          required: false,
          system: false,
          type: 'autodate',
        }),
      );
      app.save(collection);
    }

    const records = app.findRecordsByFilter('cvprofile001abc', '', '', 0, 0);
    for (const record of records) {
      if (!record.get('updated_at')) {
        record.set('updated_at', record.get('created') || new Date().toISOString());
        app.save(record);
      }
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cvprofile001abc');
    if (collection.fields.getByName('updated_at')) {
      collection.fields.removeByName('updated_at');
      app.save(collection);
    }
  },
);
