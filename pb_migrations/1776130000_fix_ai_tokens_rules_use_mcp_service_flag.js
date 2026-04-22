/// <reference path="../pb_data/types.d.ts" />

const OWNER_OR_SERVICE_RULE = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true)';
const AUTHENTICATED_USER_RULE = '@request.auth.id != ""';
const OWNER_ONLY_DELETE_RULE = '@request.auth.id != "" && user = @request.auth.id';

migrate(
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    aiTokens.listRule = OWNER_OR_SERVICE_RULE;
    aiTokens.viewRule = OWNER_OR_SERVICE_RULE;
    aiTokens.updateRule = OWNER_OR_SERVICE_RULE;
    aiTokens.deleteRule = OWNER_ONLY_DELETE_RULE;

    app.save(aiTokens);
  },
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    aiTokens.listRule = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.id = "mcpservice00001")';
    aiTokens.viewRule = aiTokens.listRule;
    aiTokens.updateRule = aiTokens.listRule;
    aiTokens.deleteRule = OWNER_ONLY_DELETE_RULE;

    app.save(aiTokens);
  },
);