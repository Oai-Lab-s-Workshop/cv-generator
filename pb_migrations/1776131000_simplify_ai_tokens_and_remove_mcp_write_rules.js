/// <reference path="../pb_data/types.d.ts" />

const OWNER_ONLY_RULE = '@request.auth.id != "" && user = @request.auth.id';

migrate(
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');
    aiTokens.listRule = OWNER_ONLY_RULE;
    aiTokens.viewRule = OWNER_ONLY_RULE;
    aiTokens.updateRule = OWNER_ONLY_RULE;
    aiTokens.deleteRule = OWNER_ONLY_RULE;
    aiTokens.fields.removeById('boolchoose001');
    aiTokens.fields.removeById('selecttmpl001');
    aiTokens.fields.removeById('numberquota001');
    aiTokens.fields.removeById('numbercount001');
    app.save(aiTokens);

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
  },
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');
    aiTokens.listRule = '@request.auth.id != "" && (user = @request.auth.id || @request.auth.isMcpServiceAccount = true)';
    aiTokens.viewRule = aiTokens.listRule;
    aiTokens.updateRule = aiTokens.listRule;
    aiTokens.deleteRule = OWNER_ONLY_RULE;
    aiTokens.fields.add(new Field({
      id: 'boolchoose001',
      name: 'canChooseTemplate',
      type: 'bool',
      required: false,
      system: false,
      hidden: false,
      presentable: false,
    }));
    aiTokens.fields.add(new Field({
      id: 'selecttmpl001',
      name: 'allowedTemplates',
      type: 'select',
      required: false,
      maxSelect: 999,
      values: ['classic', 'modern', 'minimal'],
      system: false,
      hidden: false,
      presentable: false,
    }));
    aiTokens.fields.add(new Field({
      id: 'numberquota001',
      name: 'maxProfileCreates',
      type: 'number',
      required: false,
      onlyInt: true,
      min: 0,
      system: false,
      hidden: false,
      presentable: false,
    }));
    aiTokens.fields.add(new Field({
      id: 'numbercount001',
      name: 'profileCreatesCount',
      type: 'number',
      required: false,
      onlyInt: true,
      min: 0,
      system: false,
      hidden: false,
      presentable: false,
    }));
    app.save(aiTokens);

    const projects = app.findCollectionByNameOrId('projects');
    projects.createRule = '@request.auth.id != "" && @request.auth.isMcpServiceAccount = true';
    projects.updateRule = null;
    projects.deleteRule = null;
    app.save(projects);

    const achievements = app.findCollectionByNameOrId('achievements');
    achievements.createRule = '@request.auth.id != "" && @request.auth.isMcpServiceAccount = true';
    achievements.updateRule = null;
    achievements.deleteRule = null;
    app.save(achievements);
  },
);
