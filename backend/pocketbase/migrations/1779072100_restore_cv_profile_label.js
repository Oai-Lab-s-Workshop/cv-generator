/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';
const LABEL_FIELD_ID = 'textcvlabel001';

migrate(
  (app) => {
    let collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    if (!collection.fields.getByName('label')) {
      collection.fields.add(
        new Field({
          id: LABEL_FIELD_ID,
          name: 'label',
          type: 'text',
          required: false,
          min: 0,
          max: 120,
        }),
      );
      app.save(collection);

      for (const profile of app.findAllRecords(CV_PROFILES_COLLECTION_ID)) {
        profile.set('label', profile.getString('profileName') || profile.getString('slug') || 'Profile');
        app.save(profile);
      }

      collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
      collection.fields.getByName('label').required = true;
      app.save(collection);
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    const label = collection.fields.getByName('label');
    if (label && (typeof label.getId === 'function' ? label.getId() : label.id) === LABEL_FIELD_ID) {
      collection.fields.removeById(LABEL_FIELD_ID);
      app.save(collection);
    }
  },
);
