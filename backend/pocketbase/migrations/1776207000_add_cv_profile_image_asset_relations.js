/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';
const FILES_COLLECTION_ID = 'files00000001ab';

function addImageAssetRelation(collection, fieldName, fieldId) {
  if (collection.fields.getByName(fieldName)) {
    return;
  }

  collection.fields.add(
    new Field({
      hidden: false,
      id: fieldId,
      name: fieldName,
      presentable: false,
      required: false,
      system: false,
      type: 'relation',
      collectionId: FILES_COLLECTION_ID,
      cascadeDelete: false,
      minSelect: 0,
      maxSelect: 1,
    }),
  );
}

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    addImageAssetRelation(collection, 'profilePictureFile', 'relation1776207001');
    addImageAssetRelation(collection, 'coverPictureFile', 'relation1776207002');

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    if (collection.fields.getByName('profilePictureFile')) {
      collection.fields.removeByName('profilePictureFile');
    }

    if (collection.fields.getByName('coverPictureFile')) {
      collection.fields.removeByName('coverPictureFile');
    }

    return app.save(collection);
  },
);
