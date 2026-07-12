/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';
const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';

migrate(
  (app) => {
    // 1. Allow authenticated users to update their own user record
    const usersCollection = app.findCollectionByNameOrId(USERS_COLLECTION_ID);
    if (usersCollection) {
      usersCollection.updateRule = "@request.auth.id != '' && id = @request.auth.id";
      app.save(usersCollection);
    }

    // 2. Add linkOverrides JSON field to cv_profiles
    const cvProfilesCollection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    if (cvProfilesCollection) {
      if (!cvProfilesCollection.fields.getByName('linkOverrides')) {
        cvProfilesCollection.fields.add(
          new Field({
            hidden: false,
            id: 'json1776300001',
            maxSize: 0,
            name: 'linkOverrides',
            presentable: false,
            required: false,
            system: false,
            type: 'json',
          }),
        );
      }

      // 3. Add status select field to cv_profiles
      if (!cvProfilesCollection.fields.getByName('status')) {
        cvProfilesCollection.fields.add(
          new Field({
            hidden: false,
            id: 'select1776300002',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['unsent', 'sent', 'rejected', 'responded'],
          }),
        );
      }

      app.save(cvProfilesCollection);
    }
  },
  (app) => {
    // Revert: restore users updateRule to null
    const usersCollection = app.findCollectionByNameOrId(USERS_COLLECTION_ID);
    if (usersCollection) {
      usersCollection.updateRule = null;
      app.save(usersCollection);
    }

    // Remove linkOverrides and status from cv_profiles
    const cvProfilesCollection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    if (cvProfilesCollection) {
      if (cvProfilesCollection.fields.getByName('linkOverrides')) {
        cvProfilesCollection.fields.removeByName('linkOverrides');
      }
      if (cvProfilesCollection.fields.getByName('status')) {
        cvProfilesCollection.fields.removeByName('status');
      }
      app.save(cvProfilesCollection);
    }
  },
);
