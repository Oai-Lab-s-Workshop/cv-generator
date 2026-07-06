/// <reference path="../pb_data/types.d.ts" />

const BASELINE_MIGRATION_FILE = '001_cv_schema.js';

const HISTORICAL_JS_MIGRATIONS = [
  '001_cv_schema.js',
  '1776069675_updated_skills.js',
  '1776069696_updated_skills.js',
  '1776090809_update_job_dates.js',
  '1776096800_add_user_ownership.js',
  '1776098200_fix_cv_profile_rules.js',
  '1776120000_add_ai_tokens_and_mcp_service_user.js',
  '1776121000_add_mcp_project_achievement_create_rules.js',
  '1776130000_fix_ai_tokens_rules_use_mcp_service_flag.js',
  '1776131000_simplify_ai_tokens_and_remove_mcp_write_rules.js',
  '1776132000_remove_legacy_ai_token_fields_by_name.js',
  '1776133000_remove_legacy_ai_token_fields_with_remove_by_name.js',
  '1776134000_restore_ai_tokens_read_for_mcp_service_user.js',
  '1776140000_add_project_picture_and_type.js',
  '1776200000_fix_cv_profiles_rules_use_mcp_service_flag.js',
  '1776201000_restore_ai_tokens_service_updates.js',
  '1776202000_add_job_bullet_point_summary.js',
  '1776203000_add_cv_profile_extra.js',
  '1776204000_allow_owner_job_writes.js',
  '1776205000_allow_owner_skill_writes.js',
  '1776206000_allow_owner_material_writes.js',
  '1776207000_add_cv_profile_image_asset_relations.js',
  '1776208000_add_skill_categories.js',
  '1776300000_add_profile_enhancements.js',
  '1777700000_add_unanswered_status.js',
  '1777700001_add_writing_style_fields.js',
  '1779040000_relax_cv_profiles_create_rule_for_hook_enforcement.js',
  '1779041000_allow_owner_cv_profile_delete.js',
  '1779050001_remove_generated_at_from_cv_profiles.js',
  '1779050002_add_updated_at_to_cv_profiles.js',
  '1779050003_repair_cv_profiles_updated_at.js',
  '1779060000_add_oauth_collections.js',
  '1779061000_lock_down_users_rules.js',
  '1779062000_add_unique_state_id_index.js',
  '1779063000_add_oauth_authorization_record_type.js',
];

const BASELINE_COLLECTIONS = [
  {
    id: '_pb_users_auth_',
    name: 'users',
    type: 'auth',
    rules: {
      listRule: "@request.auth.id != '' && id = @request.auth.id",
      viewRule: "@request.auth.id != '' && id = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
    },
    fields: [
      { name: 'firstName', type: 'text', required: true },
      { name: 'lastName', type: 'text', required: true },
      { name: 'linkedin', type: 'url' },
      { name: 'github', type: 'url' },
      { name: 'website', type: 'url' },
      { name: 'phone', type: 'text' },
      { name: 'profilePicture', type: 'file', maxSelect: 1 },
      { name: 'coverPicture', type: 'file', maxSelect: 1 },
    ],
  },
  {
    id: 'files00000001ab',
    name: 'files',
    type: 'base',
    fields: [
      { name: 'name', type: 'text' },
      { name: 'file', type: 'file', maxSelect: 1, required: true },
      { name: 'alt', type: 'text' },
      { name: 'kind', type: 'select', values: ['image', 'video', 'document', 'other'], maxSelect: 1 },
      { name: 'sortOrder', type: 'number' },
    ],
  },
  {
    id: 'achievements1ab',
    name: 'achievements',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'editor' },
      { name: 'sortOrder', type: 'number' },
    ],
  },
  {
    id: 'hobbies000001ab',
    name: 'hobbies',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'editor' },
      { name: 'sortOrder', type: 'number' },
    ],
  },
  {
    id: 'skills00000001ab',
    name: 'skills',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'category', type: 'select', values: ['Frontend', 'Backend', 'DevOps', 'E-commerce', 'Design', 'Mobile', 'Motion', 'Project Management'], maxSelect: 1 },
      { name: 'type', type: 'select', values: ['Technical', 'Professional', 'Language'], maxSelect: 1 },
      { name: 'level', type: 'number' },
      { name: 'sortOrder', type: 'number' },
    ],
  },
  {
    id: 'projects000001ab',
    name: 'projects',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'editor' },
      { name: 'url', type: 'url' },
      { name: 'date', type: 'text' },
      { name: 'picture', type: 'file', maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'] },
      { name: 'type', type: 'select', values: ['freelance', 'sideproject', 'work project'], maxSelect: 1 },
      { name: 'file', type: 'relation', collectionId: 'files00000001ab', maxSelect: 1 },
      { name: 'achievements', type: 'relation', collectionId: 'achievements1ab', maxSelect: 999 },
      { name: 'sortOrder', type: 'number' },
    ],
  },
  {
    id: 'jobs0000000001ab',
    name: 'jobs',
    type: 'base',
    fields: [
      { name: 'label', type: 'text', required: true },
      { name: 'company', type: 'text', required: true },
      { name: 'position', type: 'text', required: true },
      { name: 'location', type: 'text' },
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date' },
      { name: 'responsibilities', type: 'editor' },
      { name: 'sortOrder', type: 'number' },
      { name: 'type', type: 'select', required: true, values: ['freelance', 'sideproject', 'work project'], maxSelect: 1 },
      { name: 'skills', type: 'relation', collectionId: 'skills00000001ab', maxSelect: 999 },
      { name: 'projects', type: 'relation', collectionId: 'projects000001ab', maxSelect: 999 },
      { name: 'achievements', type: 'relation', collectionId: 'achievements1ab', maxSelect: 999 },
    ],
  },
  {
    id: 'degrees0000001ab',
    name: 'degrees',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'school', type: 'text' },
      { name: 'year', type: 'text' },
      { name: 'level', type: 'text' },
      { name: 'sortOrder', type: 'number' },
    ],
  },
  {
    id: 'cvprofile001abc',
    name: 'cv_profiles',
    type: 'base',
    rules: {
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: 'public = true || (@request.auth.id != "" && user = @request.auth.id)',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
    },
    fields: [
      { name: 'slug', type: 'text', required: true },
      { name: 'profileName', type: 'text', required: true },
      { name: 'template', type: 'text' },
      { name: 'public', type: 'bool' },
      { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', required: true, maxSelect: 1 },
      { name: 'professionalSummary', type: 'editor' },
      { name: 'achievements', type: 'relation', collectionId: 'achievements1ab', maxSelect: 999 },
      { name: 'projects', type: 'relation', collectionId: 'projects000001ab', maxSelect: 999 },
      { name: 'hobbies', type: 'relation', collectionId: 'hobbies000001ab', maxSelect: 999 },
      { name: 'jobs', type: 'relation', collectionId: 'jobs0000000001ab', maxSelect: 999 },
      { name: 'degrees', type: 'relation', collectionId: 'degrees0000001ab', maxSelect: 999 },
      { name: 'skills', type: 'relation', collectionId: 'skills00000001ab', maxSelect: 999 },
      { name: 'profilePicture', type: 'file', maxSelect: 1 },
      { name: 'coverPicture', type: 'file', maxSelect: 1 },
    ],
  },
];

function findCollection(app, descriptor) {
  try {
    return app.findCollectionByNameOrId(descriptor.id);
  } catch (_) {
    try {
      return app.findCollectionByNameOrId(descriptor.name);
    } catch (_) {
      return null;
    }
  }
}

function getField(collection, name) {
  try {
    return collection.fields.getByName(name);
  } catch (_) {
    return null;
  }
}

function recordCount(app, collectionIdOrName) {
  return app.findRecordsByFilter(collectionIdOrName, '', '', 1, 0).length;
}

function assertSameValue(collectionName, fieldName, property, actual, expected) {
  if (expected === undefined || expected === null) return;
  if (actual !== expected) {
    throw new Error(`${collectionName}.${fieldName}.${property} is ${actual}, expected ${expected}. Manual schema repair required.`);
  }
}

function fieldValue(field, property) {
  const value = field[property];
  if (typeof value === 'function') {
    return value.call(field);
  }

  return value;
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return Array.from(value);
  } catch (_) {
    return [];
  }
}

function ensureSelectValues(collectionName, existingField, expectedField) {
  if (!expectedField.values) return false;

  const existingValues = normalizeArray(fieldValue(existingField, 'values'));
  const missingValues = expectedField.values.filter((value) => !existingValues.includes(value));
  if (missingValues.length === 0) return false;

  existingField.values = existingValues.concat(missingValues);
  return true;
}

function validateExistingField(collectionName, existingField, expectedField) {
  assertSameValue(collectionName, expectedField.name, 'type', fieldValue(existingField, 'type'), expectedField.type);
  assertSameValue(collectionName, expectedField.name, 'collectionId', fieldValue(existingField, 'collectionId'), expectedField.collectionId);
  assertSameValue(collectionName, expectedField.name, 'maxSelect', fieldValue(existingField, 'maxSelect'), expectedField.maxSelect);
}

function createField(expectedField) {
  return new Field({
    required: false,
    ...expectedField,
  });
}

function reconcileFields(app, collection, descriptor) {
  const hasRecords = recordCount(app, descriptor.id) > 0;
  let changed = false;

  for (const expectedField of descriptor.fields) {
    const existingField = getField(collection, expectedField.name);

    if (!existingField) {
      if (expectedField.required && hasRecords) {
        throw new Error(`${descriptor.name}.${expectedField.name} is required by baseline schema but missing on a non-empty collection.`);
      }

      collection.fields.add(createField(expectedField));
      changed = true;
      continue;
    }

    validateExistingField(descriptor.name, existingField, expectedField);

    if (ensureSelectValues(descriptor.name, existingField, expectedField)) {
      changed = true;
    }
  }

  return changed;
}

function reconcileRules(collection, descriptor) {
  if (!descriptor.rules) return false;

  let changed = false;
  for (const key of ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule']) {
    if (collection[key] !== descriptor.rules[key]) {
      collection[key] = descriptor.rules[key];
      changed = true;
    }
  }

  return changed;
}

function reconcileCollection(app, descriptor) {
  const collection = findCollection(app, descriptor);
  if (!collection) return false;

  if (collection.type !== descriptor.type) {
    throw new Error(`${descriptor.name} collection type is ${collection.type}, expected ${descriptor.type}. Manual schema repair required.`);
  }

  const fieldsChanged = false;
  const rulesChanged = reconcileRules(collection, descriptor);

  if (fieldsChanged || rulesChanged) {
    app.save(collection);
  }

  return true;
}

function evolvedSchemaExists(app) {
  return Boolean(
    findCollection(app, { id: 'ai_tokens', name: 'ai_tokens' }) ||
      findCollection(app, { id: 'skill_categories', name: 'skill_categories' }) ||
      findCollection(app, { id: 'oauth_clients', name: 'oauth_clients' }),
  );
}

function createUpdatedAtField() {
  return new Field({
    hidden: false,
    id: 'autodate1779050002',
    name: 'updated_at',
    onCreate: true,
    onUpdate: true,
    presentable: false,
    required: false,
    system: false,
    type: 'autodate',
  });
}

function repairCvProfilesUpdatedAt(app) {
  let collection = app.findCollectionByNameOrId('cvprofile001abc');

  if (getField(collection, 'updated_at')) {
    collection.fields.removeByName('updated_at');
    app.save(collection);
    collection = app.findCollectionByNameOrId('cvprofile001abc');
  }

  collection.fields.add(createUpdatedAtField());
  app.save(collection);

  const records = app.findRecordsByFilter('cvprofile001abc', '', '', 0, 0);
  for (const record of records) {
    if (!record.get('updated_at')) {
      record.set('updated_at', record.get('updated') || record.get('created') || new Date().toISOString());
      app.save(record);
    }
  }
}

function existingBaselineCollectionCount(app) {
  let count = 0;
  for (const descriptor of BASELINE_COLLECTIONS) {
    if (findCollection(app, descriptor)) count += 1;
  }
  return count;
}

function existingNonSystemBaselineCollectionCount(app) {
  let count = 0;
  for (const descriptor of BASELINE_COLLECTIONS) {
    if (descriptor.name !== 'users' && findCollection(app, descriptor)) count += 1;
  }
  return count;
}

function markMigrationApplied(app, file) {
  app.db()
    .newQuery('INSERT OR IGNORE INTO _migrations (file, applied) VALUES ({:file}, {:applied})')
    .bind({
      file,
      applied: new Date().toISOString(),
    })
    .execute();
}

function markHistoricalJsMigrationsApplied(app) {
  for (const file of HISTORICAL_JS_MIGRATIONS) {
    markMigrationApplied(app, file);
  }
}

migrate(
  (app) => {
    const existingCount = existingBaselineCollectionCount(app);
    const existingNonSystemCount = existingNonSystemBaselineCollectionCount(app);

    // PocketBase initializes the users auth collection on fresh databases before
    // app migrations run. Treat "users only" as fresh so 001 can create the app
    // schema normally.
    if (existingCount === 0 || existingNonSystemCount === 0) {
      return;
    }

    if (existingCount !== BASELINE_COLLECTIONS.length) {
      throw new Error(
        `Partial baseline schema detected: found ${existingCount}/${BASELINE_COLLECTIONS.length} baseline collections. Manual schema repair required.`,
      );
    }

    for (const descriptor of BASELINE_COLLECTIONS) {
      reconcileCollection(app, descriptor);
    }

    if (evolvedSchemaExists(app)) {
      repairCvProfilesUpdatedAt(app);
      markHistoricalJsMigrationsApplied(app);
      return;
    }

    markMigrationApplied(app, BASELINE_MIGRATION_FILE);
  },
  () => {
    // Intentionally no-op: this migration only reconciles existing databases and
    // records a historical baseline marker. Reverting it could make old schemas
    // try to recreate already-existing collections on the next startup.
  },
);
