/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';
const EXTRA_FIELD_ID = 'json1776203001';

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    if (collection.fields.getByName('extra')) {
      return app.save(collection);
    }

    collection.fields.add(
      new Field({
        hidden: false,
        id: EXTRA_FIELD_ID,
        maxSize: 0,
        name: 'extra',
        presentable: false,
        required: false,
        system: false,
        type: 'json',
      }),
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    if (collection.fields.getByName('extra')) {
      collection.fields.removeByName('extra');
    }

    return app.save(collection);
  },
);
