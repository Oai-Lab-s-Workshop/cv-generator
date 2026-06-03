/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cvprofile001abc');
    if (collection.fields.getByName('generated_at')) {
      collection.fields.removeByName('generated_at');
      app.save(collection);
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cvprofile001abc');
    if (!collection.fields.getByName('generated_at')) {
      collection.fields.add(
        new Field({
          hidden: false,
          id: 'autodate1779050001',
          name: 'generated_at',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          required: false,
          system: false,
          type: 'autodate',
        }),
      );
      app.save(collection);
    }
  },
);
