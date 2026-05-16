/// <reference path="../pb_data/types.d.ts" />

const OWNER_CREATE_RULE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const OWNER_WRITE_RULE = '@request.auth.id != "" && user = @request.auth.id';

migrate(
  (app) => {
    const skills = app.findCollectionByNameOrId('skills');
    skills.createRule = OWNER_CREATE_RULE;
    skills.updateRule = OWNER_WRITE_RULE;
    skills.deleteRule = OWNER_WRITE_RULE;
    app.save(skills);
  },
  (app) => {
    const skills = app.findCollectionByNameOrId('skills');
    skills.createRule = null;
    skills.updateRule = null;
    skills.deleteRule = null;
    app.save(skills);
  },
);
