/// <reference path="../pb_data/types.d.ts" />

const OWNER_OR_SERVICE_READ_RULE = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true)';
const OWNER_ONLY_RULE = '@request.auth.id != "" && user = @request.auth.id';

migrate(
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    aiTokens.listRule = OWNER_OR_SERVICE_READ_RULE;
    aiTokens.viewRule = OWNER_OR_SERVICE_READ_RULE;
    aiTokens.updateRule = OWNER_ONLY_RULE;
    aiTokens.deleteRule = OWNER_ONLY_RULE;

    app.save(aiTokens);
  },
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    aiTokens.listRule = OWNER_ONLY_RULE;
    aiTokens.viewRule = OWNER_ONLY_RULE;
    aiTokens.updateRule = OWNER_ONLY_RULE;
    aiTokens.deleteRule = OWNER_ONLY_RULE;

    app.save(aiTokens);
  },
);
