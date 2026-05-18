/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = 'cvprofile001abc';

const AUTHENTICATED_CREATE_RULE = '@request.auth.id != ""';
const OWNER_OR_SERVICE_CREATE_RULE = '@request.auth.id != "" && (@request.auth.isMcpServiceAccount = true || @request.body.user = @request.auth.id)';

migrate(
  (app) => {
    const cvProfiles = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    cvProfiles.createRule = AUTHENTICATED_CREATE_RULE;

    app.save(cvProfiles);
  },
  (app) => {
    const cvProfiles = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

    cvProfiles.createRule = OWNER_OR_SERVICE_CREATE_RULE;

    app.save(cvProfiles);
  },
);
