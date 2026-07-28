/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';

// Emails used by the two bootstrap paths that provision the MCP service account:
// - apps/desktop/src/bun/sidecars/pocketbase-bootstrap.ts (desktop sidecar)
// - scripts/make_helpers.sh (docker / make)
const MCP_SERVICE_ACCOUNT_EMAILS = [
  'local-mcp-service@resumate.local',
  'mcp-service@cv-generator.local',
];

function findUserByEmail(app, email) {
  const records = app.findRecordsByFilter(
    USERS_COLLECTION_ID,
    'email = {:email}',
    '',
    1,
    0,
    { email: email },
  );

  return records.length > 0 ? records[0] : null;
}

function setMcpServiceAccountFlag(app, expected) {
  for (const email of MCP_SERVICE_ACCOUNT_EMAILS) {
    const user = findUserByEmail(app, email);

    if (!user) {
      console.log('[1779072200] no user found for ' + email + ', skipping');
      continue;
    }

    if (user.get('isMcpServiceAccount') === expected) {
      console.log('[1779072200] ' + email + ' already has isMcpServiceAccount=' + expected + ', skipping');
      continue;
    }

    user.set('isMcpServiceAccount', expected);
    app.save(user);

    console.log('[1779072200] set isMcpServiceAccount=' + expected + ' for ' + email);
  }
}

migrate(
  (app) => {
    setMcpServiceAccountFlag(app, true);
  },
  (app) => {
    setMcpServiceAccountFlag(app, false);
  },
);
