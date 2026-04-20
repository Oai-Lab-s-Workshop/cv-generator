/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';
const AI_TOKENS_COLLECTION_ID = 'aitokens001abc';
const MCP_SERVICE_ACCOUNT_FIELD_ID = 'boolmcpservice01';
const ACTIVE_AI_TOKEN_STATUSES = ['active', 'revoked', 'expired'];
const ALLOWED_TEMPLATE_IDS = ['classic', 'modern', 'minimal'];
const OWNER_OR_SERVICE_RULE = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true)';
const AUTHENTICATED_USER_RULE = '@request.auth.id != ""';
const OWNER_ONLY_DELETE_RULE = '@request.auth.id != "" && user = @request.auth.id';

function createAiTokensCollection() {
  return new Collection({
    id: AI_TOKENS_COLLECTION_ID,
    name: 'ai_tokens',
    type: 'base',
    listRule: OWNER_OR_SERVICE_RULE,
    viewRule: OWNER_OR_SERVICE_RULE,
    createRule: AUTHENTICATED_USER_RULE,
    updateRule: OWNER_OR_SERVICE_RULE,
    deleteRule: OWNER_ONLY_DELETE_RULE,
    fields: [
      {
        id: 'texttokhash001',
        name: 'token_hash',
        type: 'text',
        required: true,
        min: 64,
        max: 64,
        pattern: '^[a-f0-9]{64}$',
      },
      {
        id: 'texttokpref001',
        name: 'token_prefix',
        type: 'text',
        required: true,
        min: 8,
        max: 24,
      },
      {
        id: 'relationaitok1',
        name: 'user',
        type: 'relation',
        required: true,
        collectionId: USERS_COLLECTION_ID,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      },
      {
        id: 'textailabel001',
        name: 'label',
        type: 'text',
        required: true,
        min: 1,
        max: 120,
      },
      {
        id: 'selectstatus01',
        name: 'status',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: ACTIVE_AI_TOKEN_STATUSES,
      },
      {
        id: 'dateexpires001',
        name: 'expiresAt',
        type: 'date',
        required: false,
      },
      {
        id: 'boolchoose001',
        name: 'canChooseTemplate',
        type: 'bool',
        required: false,
      },
      {
        id: 'selecttmpl001',
        name: 'allowedTemplates',
        type: 'select',
        required: false,
        maxSelect: 999,
        values: ALLOWED_TEMPLATE_IDS,
      },
      {
        id: 'numberquota001',
        name: 'maxProfileCreates',
        type: 'number',
        required: false,
        onlyInt: true,
        min: 0,
      },
      {
        id: 'numbercount001',
        name: 'profileCreatesCount',
        type: 'number',
        required: false,
        onlyInt: true,
        min: 0,
      },
      {
        id: 'datelastused001',
        name: 'lastUsedAt',
        type: 'date',
        required: false,
      },
      {
        id: 'autodateaitok01',
        name: 'created',
        type: 'autodate',
        onCreate: true,
        onUpdate: false,
      },
      {
        id: 'autodateaitok02',
        name: 'updated',
        type: 'autodate',
        onCreate: true,
        onUpdate: true,
      },
    ],
    indexes: [
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_tokens_hash ON ai_tokens (token_hash)',
    ],
  });
}

function ensureMcpServiceField(app) {
  const users = app.findCollectionByNameOrId(USERS_COLLECTION_ID);

  if (users.fields.getByName('isMcpServiceAccount')) {
    return;
  }

  users.fields.add(new Field({
    hidden: false,
    id: MCP_SERVICE_ACCOUNT_FIELD_ID,
    name: 'isMcpServiceAccount',
    presentable: false,
    required: false,
    system: false,
    type: 'bool',
  }));

  app.save(users);
}

function findCollectionOrNull(app, nameOrId) {
  try {
    return app.findCollectionByNameOrId(nameOrId);
  } catch (error) {
    return null;
  }
}

migrate(
  (app) => {
    ensureMcpServiceField(app);

    if (!findCollectionOrNull(app, 'ai_tokens')) {
      app.save(createAiTokensCollection());
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId(USERS_COLLECTION_ID);

    if (users.fields.getByName('isMcpServiceAccount')) {
      users.fields.removeById(MCP_SERVICE_ACCOUNT_FIELD_ID);
      app.save(users);
    }

    const aiTokens = findCollectionOrNull(app, 'ai_tokens');
    if (aiTokens) {
      app.delete(aiTokens);
    }
  },
);
