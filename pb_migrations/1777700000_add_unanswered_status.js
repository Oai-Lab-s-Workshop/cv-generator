/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';

migrate(
  (app) => {
    const cvProfilesCollection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    if (!cvProfilesCollection) return;

    const statusField = cvProfilesCollection.fields.getByName('status');
    if (statusField) {
      const currentValues = statusField.values ?? [];
      if (!currentValues.includes('unanswered')) {
        statusField.values = [...currentValues, 'unanswered'];
      }
    }

    app.save(cvProfilesCollection);
  },
  (app) => {
    const cvProfilesCollection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    if (!cvProfilesCollection) return;

    const statusField = cvProfilesCollection.fields.getByName('status');
    if (statusField) {
      statusField.values = (statusField.values ?? []).filter((v) => v !== 'unanswered');
    }

    app.save(cvProfilesCollection);
  },
);
