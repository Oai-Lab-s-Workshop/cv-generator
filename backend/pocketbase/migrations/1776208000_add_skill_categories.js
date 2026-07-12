/// <reference path="../pb_data/types.d.ts" />

const USERS_COLLECTION_ID = '_pb_users_auth_';
const SKILLS_COLLECTION_ID = 'skills00000001ab';
const SKILL_CATEGORIES_COLLECTION_ID = 'skillcats001abc';
const SKILL_CATEGORY_VALUES = ['Frontend', 'Backend', 'DevOps', 'E-commerce', 'Design', 'Mobile', 'Motion', 'Project Management'];
const OWNER_RULE = '@request.auth.id != "" && user = @request.auth.id';
const OWNER_CREATE_RULE = '@request.auth.id != "" && @request.body.user = @request.auth.id';

function findCollectionOrNull(app, nameOrId) {
  try {
    return app.findCollectionByNameOrId(nameOrId);
  } catch (error) {
    return null;
  }
}

function normalizeCategoryName(name) {
  return String(name || '').trim().toLowerCase();
}

function createSkillCategoriesCollection() {
  return new Collection({
    id: SKILL_CATEGORIES_COLLECTION_ID,
    name: 'skill_categories',
    type: 'base',
    listRule: OWNER_RULE,
    viewRule: OWNER_RULE,
    createRule: OWNER_CREATE_RULE,
    updateRule: OWNER_RULE,
    deleteRule: OWNER_RULE,
    fields: [
      {
        id: 'textskillcat01',
        name: 'name',
        type: 'text',
        required: true,
        min: 1,
        max: 120,
      },
      {
        id: 'relskillcatusr',
        name: 'user',
        type: 'relation',
        required: true,
        collectionId: USERS_COLLECTION_ID,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      },
      {
        id: 'autodateskc01',
        name: 'created',
        type: 'autodate',
        onCreate: true,
        onUpdate: false,
      },
      {
        id: 'autodateskc02',
        name: 'updated',
        type: 'autodate',
        onCreate: true,
        onUpdate: true,
      },
    ],
    indexes: ['CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_categories_user_name ON skill_categories (user, lower(name))'],
  });
}

function createSkillCategoryRecord(app, collection, userId, name) {
  const record = new Record(collection);
  record.set('user', userId);
  record.set('name', name);
  app.save(record);

  return record;
}

function replaceSkillCategoryFieldWithRelation(app) {
  const skills = app.findCollectionByNameOrId(SKILLS_COLLECTION_ID);

  if (skills.fields.getByName('category')) {
    skills.fields.removeByName('category');
  }

  skills.fields.addAt(1, new Field({
    hidden: false,
    id: 'relskillcat001',
    name: 'category',
    presentable: false,
    required: false,
    system: false,
    type: 'relation',
    collectionId: SKILL_CATEGORIES_COLLECTION_ID,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
  }));

  app.save(skills);
}

function replaceSkillCategoryFieldWithSelect(app) {
  const skills = app.findCollectionByNameOrId(SKILLS_COLLECTION_ID);

  if (skills.fields.getByName('category')) {
    skills.fields.removeByName('category');
  }

  skills.fields.addAt(1, new Field({
    hidden: false,
    id: 'select2335270972',
    maxSelect: 1,
    name: 'category',
    presentable: false,
    required: false,
    system: false,
    type: 'select',
    values: SKILL_CATEGORY_VALUES,
  }));

  app.save(skills);
}

migrate(
  (app) => {
    const existingCategoryValuesBySkillId = new Map();
    const skills = app.findAllRecords(SKILLS_COLLECTION_ID);

    for (const skill of skills) {
      existingCategoryValuesBySkillId.set(skill.id, {
        name: skill.getString('category'),
        userId: skill.getString('user'),
      });
    }

    if (!findCollectionOrNull(app, SKILL_CATEGORIES_COLLECTION_ID)) {
      app.save(createSkillCategoriesCollection());
    }

    replaceSkillCategoryFieldWithRelation(app);

    const categories = app.findCollectionByNameOrId(SKILL_CATEGORIES_COLLECTION_ID);
    const categoryByOwnerAndName = new Map();

    for (const category of app.findAllRecords(SKILL_CATEGORIES_COLLECTION_ID)) {
      categoryByOwnerAndName.set(`${category.getString('user')}::${normalizeCategoryName(category.getString('name'))}`, category);
    }

    for (const skill of app.findAllRecords(SKILLS_COLLECTION_ID)) {
      const previousCategory = existingCategoryValuesBySkillId.get(skill.id);
      const name = String(previousCategory?.name || '').trim();
      const userId = previousCategory?.userId || skill.getString('user');

      if (!name || !userId) {
        skill.set('category', '');
        app.save(skill);
        continue;
      }

      const key = `${userId}::${normalizeCategoryName(name)}`;
      let category = categoryByOwnerAndName.get(key);

      if (!category) {
        category = createSkillCategoryRecord(app, categories, userId, name);
        categoryByOwnerAndName.set(key, category);
      }

      skill.set('category', category.id);
      app.save(skill);
    }
  },
  (app) => {
    const skillCategoryNameBySkillId = new Map();
    const categoryNameById = new Map();

    if (findCollectionOrNull(app, SKILL_CATEGORIES_COLLECTION_ID)) {
      for (const category of app.findAllRecords(SKILL_CATEGORIES_COLLECTION_ID)) {
        categoryNameById.set(category.id, category.getString('name'));
      }
    }

    for (const skill of app.findAllRecords(SKILLS_COLLECTION_ID)) {
      const categoryId = skill.getString('category');
      const categoryName = categoryNameById.get(categoryId) || '';
      skillCategoryNameBySkillId.set(skill.id, SKILL_CATEGORY_VALUES.includes(categoryName) ? categoryName : '');
    }

    replaceSkillCategoryFieldWithSelect(app);

    for (const skill of app.findAllRecords(SKILLS_COLLECTION_ID)) {
      skill.set('category', skillCategoryNameBySkillId.get(skill.id) || '');
      app.save(skill);
    }

    const categories = findCollectionOrNull(app, SKILL_CATEGORIES_COLLECTION_ID);
    if (categories) {
      app.delete(categories);
    }
  },
);
