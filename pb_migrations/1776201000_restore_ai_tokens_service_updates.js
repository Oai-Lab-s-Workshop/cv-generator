/// <reference path="../pb_data/types.d.ts" />

const OWNER_ONLY_RULE = '@request.auth.id != "" && user = @request.auth.id';
const OWNER_OR_SERVICE_RULE = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true)';

migrate(
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    aiTokens.listRule = OWNER_OR_SERVICE_RULE;
    aiTokens.viewRule = OWNER_OR_SERVICE_RULE;
    aiTokens.updateRule = OWNER_OR_SERVICE_RULE;
    aiTokens.deleteRule = OWNER_ONLY_RULE;

    app.save(aiTokens);
  },
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    aiTokens.listRule = OWNER_OR_SERVICE_RULE;
    aiTokens.viewRule = OWNER_OR_SERVICE_RULE;
    aiTokens.updateRule = OWNER_ONLY_RULE;
    aiTokens.deleteRule = OWNER_ONLY_RULE;

    app.save(aiTokens);
  },
);
