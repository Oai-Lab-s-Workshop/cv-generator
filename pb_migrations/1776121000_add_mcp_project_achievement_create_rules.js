/// <reference path="../pb_data/types.d.ts" />

const MCP_CREATE_ONLY_RULE = '@request.auth.id != "" && @request.auth.isMcpServiceAccount = true';

function updateCreateOnlyRule(app, collectionName) {
  const collection = app.findCollectionByNameOrId(collectionName);
  collection.createRule = MCP_CREATE_ONLY_RULE;
  collection.updateRule = null;
  collection.deleteRule = null;
  return app.save(collection);
}

migrate((app) => {
  updateCreateOnlyRule(app, 'projects');
  updateCreateOnlyRule(app, 'achievements');
}, (app) => {
  const projects = app.findCollectionByNameOrId('projects');
  projects.createRule = null;
  projects.updateRule = null;
  projects.deleteRule = null;
  app.save(projects);

  const achievements = app.findCollectionByNameOrId('achievements');
  achievements.createRule = null;
  achievements.updateRule = null;
  achievements.deleteRule = null;
  app.save(achievements);
});
