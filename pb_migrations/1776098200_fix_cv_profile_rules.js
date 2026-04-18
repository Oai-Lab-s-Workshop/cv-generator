/// <reference path="../pb_data/types.d.ts" />

const CV_PROFILES_COLLECTION_ID = "cvprofile001abc";
const OWNER_CAN_LIST_CV_PROFILE_RULE = "@request.auth.id != \"\" && user = @request.auth.id";
const PUBLIC_OR_OWNER_CAN_VIEW_CV_PROFILE_RULE = "public = true || (@request.auth.id != \"\" && user = @request.auth.id)";
const AUTHENTICATED_CAN_CREATE_CV_PROFILE_RULE = "@request.auth.id != \"\"";
const OWNER_CAN_UPDATE_CV_PROFILE_RULE = "@request.auth.id != \"\" && user = @request.auth.id";

migrate((app) => {
  const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

  collection.listRule = OWNER_CAN_LIST_CV_PROFILE_RULE;
  collection.viewRule = PUBLIC_OR_OWNER_CAN_VIEW_CV_PROFILE_RULE;
  collection.createRule = AUTHENTICATED_CAN_CREATE_CV_PROFILE_RULE;
  collection.updateRule = OWNER_CAN_UPDATE_CV_PROFILE_RULE;

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);

  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = null;
  collection.updateRule = OWNER_CAN_UPDATE_CV_PROFILE_RULE;

  return app.save(collection);
})
