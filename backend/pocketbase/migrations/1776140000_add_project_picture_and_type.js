/// <reference path="../pb_data/types.d.ts" />

function getFieldType(field) {
  return field && (typeof field.type === 'function' ? field.type() : field.type);
}

function getFieldId(field) {
  return field && (typeof field.getId === 'function' ? field.getId() : field.id);
}

function ensureFieldAbsentOrType(collection, fieldName, expectedType) {
  const field = collection.fields.getByName(fieldName);
  if (field && getFieldType(field) !== expectedType) {
    throw new Error(`Unexpected projects.${fieldName} field type; expected ${expectedType}.`);
  }
  return !!field;
}

function removeFieldByNameAndId(collection, fieldName, fieldId) {
  const field = collection.fields.getByName(fieldName);
  if (field && getFieldId(field) === fieldId) {
    collection.fields.removeById(fieldId);
  }
}

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('projects');

    if (!ensureFieldAbsentOrType(collection, 'picture', 'file')) {
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
    }

    if (!ensureFieldAbsentOrType(collection, 'type', 'select')) {
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
    }

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('projects');

    removeFieldByNameAndId(collection, 'picture', 'file1776140001');
    removeFieldByNameAndId(collection, 'type', 'select1776140002');

    return app.save(collection);
  },
);
