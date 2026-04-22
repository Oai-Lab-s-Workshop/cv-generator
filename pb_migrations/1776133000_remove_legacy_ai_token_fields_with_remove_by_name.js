/// <reference path="../pb_data/types.d.ts" />

const LEGACY_AI_TOKEN_FIELD_NAMES = [
  'canChooseTemplate',
  'allowedTemplates',
  'maxProfileCreates',
  'profileCreatesCount',
];

migrate(
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    for (const fieldName of LEGACY_AI_TOKEN_FIELD_NAMES) {
      aiTokens.fields.removeByName(fieldName);
    }

    app.save(aiTokens);
  },
  (app) => {
    const aiTokens = app.findCollectionByNameOrId('ai_tokens');

    if (!aiTokens.fields.getByName('canChooseTemplate')) {
      aiTokens.fields.add(new Field({
        id: 'boolchoose001',
        name: 'canChooseTemplate',
        type: 'bool',
        required: false,
        system: false,
        hidden: false,
        presentable: false,
      }));
    }

    if (!aiTokens.fields.getByName('allowedTemplates')) {
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
    }

    if (!aiTokens.fields.getByName('maxProfileCreates')) {
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
    }

    if (!aiTokens.fields.getByName('profileCreatesCount')) {
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
    }

    app.save(aiTokens);
  },
);
