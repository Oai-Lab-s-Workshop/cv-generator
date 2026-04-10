const fs = require('fs');
const path = require('path');

const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@cv-generator.local';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'changeme123!';
const DEFAULT_USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'changeme123!';
const ALLOW_NONEMPTY = process.env.ALLOW_NONEMPTY === '1';

const seedPath = path.join(__dirname, '..', 'pb_data', 'seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const idMaps = {
  users: new Map(),
  achievements: new Map(),
  hobbies: new Map(),
  skills: new Map(),
  projects: new Map(),
  jobs: new Map(),
  degrees: new Map(),
  files: new Map(),
  cv_profiles: new Map(),
};

async function request(pathname, options = {}) {
  const response = await fetch(`${PB_URL}${pathname}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function authenticate() {
  const auth = await request('/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: PB_ADMIN_EMAIL,
      password: PB_ADMIN_PASSWORD,
    }),
  });

  return auth.token;
}

async function getTotalItems(token, collection) {
  const result = await request(`/api/collections/${collection}/records?page=1&perPage=1`, {
    headers: { Authorization: token },
  });

  return result.totalItems;
}

async function ensureEmptyCollections(token) {
  const collections = ['users', 'achievements', 'hobbies', 'skills', 'projects', 'jobs', 'degrees', 'cv_profiles'];
  const nonEmpty = [];

  for (const collection of collections) {
    const totalItems = await getTotalItems(token, collection);
    if (totalItems > 0) {
      nonEmpty.push(`${collection} (${totalItems})`);
    }
  }

  if (nonEmpty.length > 0 && !ALLOW_NONEMPTY) {
    throw new Error(`Import aborted because collections are not empty: ${nonEmpty.join(', ')}. Set ALLOW_NONEMPTY=1 to bypass.`);
  }
}

async function createRecord(token, collection, body) {
  return request(`/api/collections/${collection}/records`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function updateRecord(token, collection, recordId, body) {
  return request(`/api/collections/${collection}/records/${recordId}`, {
    method: 'PATCH',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function mapRelationIds(collection, ids) {
  return (ids || []).map((id) => {
    const mappedId = idMaps[collection].get(id);
    if (!mappedId) {
      throw new Error(`Missing mapped id for ${collection}:${id}`);
    }
    return mappedId;
  });
}

async function importUsers(token) {
  for (const user of seed.users || []) {
    const created = await createRecord(token, 'users', {
      email: user.email,
      password: DEFAULT_USER_PASSWORD,
      passwordConfirm: DEFAULT_USER_PASSWORD,
      verified: true,
      emailVisibility: false,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      linkedin: user.linkedin,
      github: user.github,
      website: user.website,
      phone: user.phone,
    });

    idMaps.users.set(user.id, created.id);
  }
}

async function importSimpleCollection(token, collection) {
  for (const record of seed[collection] || []) {
    const { id, ...body } = record;
    const created = await createRecord(token, collection, body);
    idMaps[collection].set(id, created.id);
  }
}

async function importProjects(token) {
  for (const project of seed.projects || []) {
    const created = await createRecord(token, 'projects', {
      name: project.name,
      description: project.description,
      url: project.url,
      date: project.date,
      sortOrder: project.sortOrder,
      achievements: mapRelationIds('achievements', project.achievements),
    });

    idMaps.projects.set(project.id, created.id);
  }
}

async function importJobs(token) {
  for (const job of seed.jobs || []) {
    const created = await createRecord(token, 'jobs', {
      label: job.label,
      company: job.company,
      position: job.position,
      location: job.location,
      startDate: job.startDate,
      endDate: job.endDate,
      responsibilities: job.responsibilities,
      sortOrder: job.sortOrder,
      type: job.type,
      skills: mapRelationIds('skills', job.skills),
      projects: mapRelationIds('projects', job.projects),
      achievements: mapRelationIds('achievements', job.achievements),
    });

    idMaps.jobs.set(job.id, created.id);
  }
}

async function importCvProfiles(token) {
  for (const [index, profile] of (seed.cv_profiles || []).entries()) {
    const created = await createRecord(token, 'cv_profiles', {
      slug: `${profile.template}--seed-${index + 1}`,
      profileName: profile.profileName,
      template: profile.template,
      user: idMaps.users.get(profile.user),
      professionalSummary: profile.professionalSummary,
      achievements: mapRelationIds('achievements', profile.achievements),
      projects: mapRelationIds('projects', profile.projects),
      hobbies: mapRelationIds('hobbies', profile.hobbies),
      jobs: mapRelationIds('jobs', profile.jobs),
      degrees: mapRelationIds('degrees', profile.degrees),
      skills: mapRelationIds('skills', profile.skills),
    });

    await updateRecord(token, 'cv_profiles', created.id, {
      slug: `${created.template}--${created.id}`,
    });

    idMaps.cv_profiles.set(profile.id, created.id);
  }
}

async function main() {
  const token = await authenticate();
  await ensureEmptyCollections(token);

  await importUsers(token);
  await importSimpleCollection(token, 'achievements');
  await importSimpleCollection(token, 'hobbies');
  await importSimpleCollection(token, 'skills');
  await importProjects(token);
  await importJobs(token);
  await importSimpleCollection(token, 'degrees');
  await importCvProfiles(token);

  console.log('Seed import completed successfully via PocketBase API.');
  console.log(
    JSON.stringify(
      Object.fromEntries(Object.entries(idMaps).map(([key, value]) => [key, Object.fromEntries(value)])),
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
