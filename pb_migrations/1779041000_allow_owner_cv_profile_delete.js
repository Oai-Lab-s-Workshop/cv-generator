/// <reference path="../pb_data/types.d.ts" />

const OWNER_DELETE_RULE = '@request.auth.id != "" && user = @request.auth.id';

migrate(
  (app) => {
    const cvProfiles = app.findCollectionByNameOrId("cv_profiles");

    cvProfiles.deleteRule = OWNER_DELETE_RULE;
    app.save(cvProfiles);
  },
  (app) => {
    const cvProfiles = app.findCollectionByNameOrId("cv_profiles");

    cvProfiles.deleteRule = null;
    app.save(cvProfiles);
  },
);
