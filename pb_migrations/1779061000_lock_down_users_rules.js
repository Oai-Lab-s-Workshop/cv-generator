/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';
const OWNER_OR_SERVICE_RULE = '@request.auth.id != "" && (id = @request.auth.id || @request.auth.isMcpServiceAccount = true)';
const OWNER_UPDATE_RULE = '@request.auth.id != "" && id = @request.auth.id';

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId(USERS_COLLECTION_ID);

    users.listRule = OWNER_OR_SERVICE_RULE;
    users.viewRule = OWNER_OR_SERVICE_RULE;
    users.createRule = null;
    users.updateRule = OWNER_UPDATE_RULE;

    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId(USERS_COLLECTION_ID);

    users.listRule = '@request.auth.id != "" && id = @request.auth.id';
    users.viewRule = '@request.auth.id != "" && id = @request.auth.id';
    users.createRule = null;
    users.updateRule = OWNER_UPDATE_RULE;

    app.save(users);
  },
);
