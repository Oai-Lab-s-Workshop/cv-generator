/// <reference path="../pb_data/types.d.ts" />

const OWNER_CREATE_RULE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const OWNER_WRITE_RULE = '@request.auth.id != "" && user = @request.auth.id';

migrate(
  (app) => {
    const jobs = app.findCollectionByNameOrId('jobs');
    jobs.createRule = OWNER_CREATE_RULE;
    jobs.updateRule = OWNER_WRITE_RULE;
    jobs.deleteRule = OWNER_WRITE_RULE;
    app.save(jobs);
  },
  (app) => {
    const jobs = app.findCollectionByNameOrId('jobs');
    jobs.createRule = null;
    jobs.updateRule = null;
    jobs.deleteRule = null;
    app.save(jobs);
  },
);
