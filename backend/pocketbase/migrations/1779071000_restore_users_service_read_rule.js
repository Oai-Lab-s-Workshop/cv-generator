/// <reference path="../pb_data/types.d.ts" />

// Re-assert the users read rule so the MCP service account can resolve a user
// record. 1779061000 already set this, but the rule can drift if edited from the
// admin UI, and losing the service-account clause silently breaks the MCP
// listProfileMaterial tool (GET /api/collections/users/records/{id} returns 404
// for the service account). This forward migration converges any drifted database
// back to the intended rule and is a no-op on a correctly-configured one.

const USERS_COLLECTION_ID = '_pb_users_auth_';
const OWNER_OR_SERVICE_RULE = '@request.auth.id != "" && (id = @request.auth.id || @request.auth.isMcpServiceAccount = true)';
const OWNER_UPDATE_RULE = '@request.auth.id != "" && id = @request.auth.id';

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId(USERS_COLLECTION_ID);
    users.listRule = OWNER_OR_SERVICE_RULE;
    users.viewRule = OWNER_OR_SERVICE_RULE;
    users.updateRule = OWNER_UPDATE_RULE;
    app.save(users);
  },
  (app) => {
    // Intentionally irreversible: reverting would reintroduce the MCP breakage.
    // Leave the rule in the corrected state on down-migration.
  },
);
