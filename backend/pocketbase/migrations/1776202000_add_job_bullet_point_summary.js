/// <reference path="../pb_data/types.d.ts" />

const JOBS_COLLECTION_ID = 'jobs0000000001ab';
const BULLET_POINT_SUMMARY_FIELD_ID = 'text1776202001';

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId(JOBS_COLLECTION_ID);

    if (collection.fields.getByName('bulletPointSummary')) {
      return app.save(collection);
    }

    collection.fields.addAt(
      7,
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: BULLET_POINT_SUMMARY_FIELD_ID,
        max: 0,
        min: 0,
        name: 'bulletPointSummary',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
      }),
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId(JOBS_COLLECTION_ID);

    if (collection.fields.getByName('bulletPointSummary')) {
      collection.fields.removeByName('bulletPointSummary');
    }

    return app.save(collection);
  },
);
