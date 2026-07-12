/// <reference path="../pb_data/types.d.ts" />

const OWNER_OR_SERVICE_RULE = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true)';
const PUBLIC_OR_OWNER_OR_SERVICE_RULE = 'public = true || (@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true))';
const CREATE_OWNER_OR_SERVICE_RULE = '@request.auth.id != "" && (@request.auth.isMcpServiceAccount = true || @request.body.user = @request.auth.id)';

migrate(
  (app) => {
    const cvProfiles = app.findCollectionByNameOrId('cv_profiles');

    cvProfiles.listRule = OWNER_OR_SERVICE_RULE;
    cvProfiles.viewRule = PUBLIC_OR_OWNER_OR_SERVICE_RULE;
    cvProfiles.createRule = CREATE_OWNER_OR_SERVICE_RULE;
    cvProfiles.updateRule = OWNER_OR_SERVICE_RULE;

    app.save(cvProfiles);
  },
  (app) => {
    const cvProfiles = app.findCollectionByNameOrId('cv_profiles');

    cvProfiles.listRule = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.id = "mcpservice00001")';
    cvProfiles.viewRule = 'public = true || (@request.auth.id != "" && (user = @request.auth.id || @request.auth.id = "mcpservice00001"))';
    cvProfiles.createRule = '@request.auth.id != "" && (@request.auth.id = "mcpservice00001" || @request.body.user = @request.auth.id)';
    cvProfiles.updateRule = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.id = "mcpservice00001")';

    app.save(cvProfiles);
  },
);
