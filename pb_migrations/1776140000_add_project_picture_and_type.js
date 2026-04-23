/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('projects');

    collection.fields.addAt(
      4,
      new Field({
        hidden: false,
        id: 'file1776140001',
        maxSelect: 1,
        maxSize: 0,
        mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'],
        name: 'picture',
        presentable: false,
        protected: false,
        required: false,
        system: false,
        thumbs: null,
        type: 'file',
      }),
    );

    collection.fields.addAt(
      5,
      new Field({
        hidden: false,
        id: 'select1776140002',
        maxSelect: 1,
        name: 'type',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['freelance', 'sideproject', 'work project'],
      }),
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('projects');

    collection.fields.removeById('file1776140001');
    collection.fields.removeById('select1776140002');

    return app.save(collection);
  },
);
