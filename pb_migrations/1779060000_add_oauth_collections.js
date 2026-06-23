/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';
const OAUTH_CLIENTS_COLLECTION_ID = 'oauthclients001';
const OAUTH_AUTHORIZATIONS_COLLECTION_ID = 'oauthauths0001';
const SERVICE_ONLY_RULE = '@request.auth.id != "" && @request.auth.isMcpServiceAccount = true';
const AUTHORIZATION_STATUSES = ['active', 'revoked'];

function findCollectionOrNull(app, nameOrId) {
  try {
    return app.findCollectionByNameOrId(nameOrId);
  } catch (error) {
    return null;
  }
}

function textField(id, name, required, max, pattern = '') {
  return {
    id,
    name,
    type: 'text',
    required,
    max,
    pattern,
  };
}

function jsonField(id, name, required = false) {
  return {
    id,
    name,
    type: 'json',
    required,
    maxSize: 0,
  };
}

function dateField(id, name, required = false) {
  return {
    id,
    name,
    type: 'date',
    required,
  };
}

function autoDateField(id, name, onUpdate) {
  return {
    id,
    name,
    type: 'autodate',
    onCreate: true,
    onUpdate,
  };
}

function createOAuthClientsCollection() {
  return new Collection({
    id: OAUTH_CLIENTS_COLLECTION_ID,
    name: 'oauth_clients',
    type: 'base',
    listRule: SERVICE_ONLY_RULE,
    viewRule: SERVICE_ONLY_RULE,
    createRule: SERVICE_ONLY_RULE,
    updateRule: SERVICE_ONLY_RULE,
    deleteRule: SERVICE_ONLY_RULE,
    fields: [
      textField('textoauthclid01', 'client_id', true, 255),
      textField('textoauthcsec1', 'client_secret_hash', false, 64, '^[a-f0-9]{64}$'),
      textField('textoauthcnam1', 'client_name', true, 255),
      jsonField('jsonoauthred01', 'redirect_uris', true),
      jsonField('jsonoauthgrt01', 'grant_types', true),
      jsonField('jsonoauthscp01', 'scopes', true),
      jsonField('jsonoauthtok01', 'token_settings', true),
      dateField('dateoauthexp01', 'expires_at'),
      autoDateField('autooauthcrt01', 'created', false),
      autoDateField('autooauthupd01', 'updated', true),
    ],
    indexes: [
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients (client_id)',
    ],
  });
}

function createOAuthAuthorizationsCollection() {
  return new Collection({
    id: OAUTH_AUTHORIZATIONS_COLLECTION_ID,
    name: 'oauth_authorizations',
    type: 'base',
    listRule: SERVICE_ONLY_RULE,
    viewRule: SERVICE_ONLY_RULE,
    createRule: SERVICE_ONLY_RULE,
    updateRule: SERVICE_ONLY_RULE,
    deleteRule: SERVICE_ONLY_RULE,
    fields: [
      {
        id: 'reloauthuser01',
        name: 'user',
        type: 'relation',
        required: true,
        collectionId: USERS_COLLECTION_ID,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      },
      textField('textoauthclid02', 'client_id', true, 255),
      jsonField('jsonoauthscp02', 'scopes', true),
      textField('textoauthcode1', 'auth_code_hash', false, 64, '^[a-f0-9]{64}$'),
      textField('textoauthrefr1', 'refresh_token_hash', false, 64, '^[a-f0-9]{64}$'),
      textField('textoauthjti01', 'access_token_jti', false, 255),
      dateField('dateoauthexp02', 'expires_at'),
      {
        id: 'selectoauthst1',
        name: 'status',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: AUTHORIZATION_STATUSES,
      },
      jsonField('jsonoauthstate', 'state', true),
      jsonField('jsonoauthcons1', 'consent'),
      autoDateField('autooauthcrt02', 'created', false),
      autoDateField('autooauthupd02', 'updated', true),
    ],
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_oauth_authorizations_user_client ON oauth_authorizations (user, client_id)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_authorizations_auth_code_hash ON oauth_authorizations (auth_code_hash) WHERE auth_code_hash != ""',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_authorizations_refresh_token_hash ON oauth_authorizations (refresh_token_hash) WHERE refresh_token_hash != ""',
      'CREATE INDEX IF NOT EXISTS idx_oauth_authorizations_access_token_jti ON oauth_authorizations (access_token_jti)',
    ],
  });
}

migrate(
  (app) => {
    if (!findCollectionOrNull(app, 'oauth_clients')) {
      app.save(createOAuthClientsCollection());
    }

    if (!findCollectionOrNull(app, 'oauth_authorizations')) {
      app.save(createOAuthAuthorizationsCollection());
    }
  },
  (app) => {
    const authorizations = findCollectionOrNull(app, 'oauth_authorizations');
    if (authorizations) {
      app.delete(authorizations);
    }

    const clients = findCollectionOrNull(app, 'oauth_clients');
    if (clients) {
      app.delete(clients);
    }
  },
);
