onRecordCreateRequest((e) => {
  try {
    if (!e.auth) {
      throw new UnauthorizedError('Authentication required.');
    }

    const hasSuperuserAccess = e.hasSuperuserAuth();
    const record = e.record;
    if (!record) {
      throw new BadRequestError('CV profile record is missing.');
    }

    const requestedOwnerId = record.getString('user');
    const isMcpServiceAccount = e.auth.getBool('isMcpServiceAccount');
    const assertImageAssetsBelongToOwner = () => {
      const ownerId = record.getString('user');

      for (const fieldName of ['profilePictureFile', 'coverPictureFile']) {
        const fileId = record.getString(fieldName);

        if (!fileId) {
          continue;
        }

        let file;
        try {
          file = $app.findRecordById('files', fileId);
        } catch {
          throw new ForbiddenError('CV profile image assets must belong to the profile owner.');
        }

        if (!file || file.getString('user') !== ownerId) {
          throw new ForbiddenError('CV profile image assets must belong to the profile owner.');
        }
      }
    };

    if (hasSuperuserAccess) {
      return e.next();
    }

    if (isMcpServiceAccount && requestedOwnerId) {
      assertImageAssetsBelongToOwner();
      return e.next();
    }

    record.set('user', e.auth.id);
    assertImageAssetsBelongToOwner();
    return e.next();
  } catch (error) {
    console.error('[cv_profiles] Create hook failed:', error?.message || error);
    throw error;
  }
}, 'cv_profiles');

onRecordUpdateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const hasSuperuserAccess = e.hasSuperuserAuth();
  const record = e.record;
  if (!record) {
    throw new BadRequestError('CV profile record is missing.');
  }

  const currentOwnerId = record.getString('user');
  const isMcpServiceAccount = e.auth.getBool('isMcpServiceAccount');

  if (!hasSuperuserAccess && !isMcpServiceAccount && currentOwnerId && currentOwnerId !== e.auth.id) {
    throw new ForbiddenError('You cannot edit another user\'s CV profile.');
  }

  if (!hasSuperuserAccess && !isMcpServiceAccount) {
    record.set('user', e.auth.id);
  }
  const ownerId = record.getString('user');

  for (const fieldName of ['profilePictureFile', 'coverPictureFile']) {
    const fileId = record.getString(fieldName);

    if (!fileId) {
      continue;
    }

    let file;
    try {
      file = $app.findRecordById('files', fileId);
    } catch {
      throw new ForbiddenError('CV profile image assets must belong to the profile owner.');
    }

    if (!file || file.getString('user') !== ownerId) {
      throw new ForbiddenError('CV profile image assets must belong to the profile owner.');
    }
  }

  return e.next();
}, 'cv_profiles');

onRecordCreateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('API key record is missing.');
  }

  if (e.hasSuperuserAuth()) {
    return e.next();
  }

  record.set('user', e.auth.id);
  record.set('lastUsedAt', null);
  return e.next();
}, 'ai_tokens');

onRecordUpdateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('API key record is missing.');
  }

  const currentOwnerId = record.getString('user');
  const isMcpServiceAccount = e.auth.getBool('isMcpServiceAccount');

  if (!e.hasSuperuserAuth() && !isMcpServiceAccount && currentOwnerId && currentOwnerId !== e.auth.id) {
    throw new ForbiddenError('You cannot edit another user\'s API key.');
  }

  if (!e.hasSuperuserAuth() && !isMcpServiceAccount) {
    record.set('user', e.auth.id);
  }
  return e.next();
}, 'ai_tokens');

onRecordCreateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('Project record is missing.');
  }

  if (e.hasSuperuserAuth()) {
    return e.next();
  }

  record.set('user', e.auth.id);
  return e.next();
}, 'projects');

onRecordUpdateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  if (e.hasSuperuserAuth()) {
    return e.next();
  }

  return e.next();
}, 'projects');

onRecordCreateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('Achievement record is missing.');
  }

  if (e.hasSuperuserAuth()) {
    return e.next();
  }

  record.set('user', e.auth.id);
  return e.next();
}, 'achievements');

onRecordUpdateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  if (e.hasSuperuserAuth()) {
    return e.next();
  }

  return e.next();
}, 'achievements');

const revokeAiTokenHandler = (e) => {
  const id = e.request.pathValue('id');
  const auth = e.auth;
  if (!auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  let record;
  try {
    record = $app.findRecordById('ai_tokens', id);
  } catch (_) {
    throw new NotFoundError('API key not found.');
  }

  const ownerId = record.getString('user');
  if (ownerId !== auth.id && !e.hasSuperuserAuth()) {
    throw new ForbiddenError('Not your API key.');
  }

  if (record.getString('status') === 'revoked') {
    return e.json(200, { id: record.id, status: 'revoked', message: 'Already revoked.' });
  }

  record.set('status', 'revoked');

  try {
    $app.save(record);
  } catch (saveError) {
    console.error('[ai-tokens] Revoke save failed:', saveError?.message || saveError);
    throw new BadRequestError('Failed to revoke API key: ' + (saveError?.message || 'unknown error'));
  }

  const saved = $app.findRecordById('ai_tokens', id);
  const savedStatus = saved.getString('status');
  if (savedStatus !== 'revoked') {
    console.error('[ai-tokens] Revoke verification failed: status=' + savedStatus);
    throw new BadRequestError('Revoke did not persist. Current status: ' + savedStatus);
  }

  console.log('[ai-tokens] API key revoked successfully:', id);
  return e.json(200, { id: record.id, status: 'revoked' });
};

routerAdd('POST', '/api/custom/ai-tokens/{id}/revoke', revokeAiTokenHandler);
routerAdd('PATCH', '/api/custom/ai-tokens/{id}/revoke', revokeAiTokenHandler);

const getPublicCvDataBySlugHandler = (e) => {
  const toArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    try {
      return Array.from(value);
    } catch (_) {
      return [];
    }
  };

  const serializeRecord = (record, fieldNames) => {
    const result = { id: record.id };

    for (const fieldName of fieldNames) {
      result[fieldName] = record.get(fieldName);
    }

    return result;
  };

  const findLinkedRecords = (collectionName, ids, fieldNames, ownerId) => {
    const records = [];

    for (const id of ids) {
      try {
        const record = $app.findRecordById(collectionName, id);
        const recordOwnerId = record.getString('user');

        if (recordOwnerId && recordOwnerId !== ownerId) continue;

        records.push(serializeRecord(record, fieldNames));
      } catch (_) {
        // Keep public rendering resilient to stale relation ids.
      }
    }

    return records;
  };

  const slug = e.request.pathValue('slug');
  let profileRecord;

  try {
    profileRecord = $app.findFirstRecordByFilter('cv_profiles', 'slug={:slug}', { slug });
  } catch (_) {
    throw new NotFoundError('CV profile not found.');
  }

  const ownerId = profileRecord.getString('user');
  const isOwner = !!e.auth && e.auth.id === ownerId;
  const isPublic = profileRecord.getBool('public');

  if (!isPublic && !isOwner) {
    if (!e.auth) {
      throw new UnauthorizedError('Authentication required.');
    }

    throw new ForbiddenError('Not your CV profile.');
  }

  const profile = serializeRecord(profileRecord, [
    'slug',
    'label',
    'profileName',
    'template',
    'public',
    'user',
    'professionalSummary',
    'achievements',
    'projects',
    'hobbies',
    'jobs',
    'degrees',
    'skills',
    'profilePicture',
    'coverPicture',
    'profilePictureFile',
    'coverPictureFile',
    'extra',
    'linkOverrides',
    'status',
    'updated_at',
  ]);

  profile.expand = {};
  for (const fieldName of ['profilePictureFile', 'coverPictureFile']) {
    if (!profile[fieldName]) continue;

    try {
      const fileRecord = $app.findRecordById('files', profile[fieldName]);
      if (fileRecord.getString('user') !== ownerId) continue;

      profile.expand[fieldName] = serializeRecord(fileRecord, ['user', 'name', 'file', 'alt', 'kind', 'sortOrder']);
    } catch (_) {
      // Missing image relations should not block rendering the rest of the CV.
    }
  }

  let user = null;
  try {
    const userRecord = $app.findRecordById('users', ownerId);
    user = serializeRecord(userRecord, ['firstName', 'lastName', 'linkedin', 'github', 'website', 'email', 'phone', 'profilePicture', 'coverPicture']);
  } catch (_) {
    user = null;
  }

  return e.json(200, {
    profile,
    user,
    jobs: findLinkedRecords('jobs', toArray(profile.jobs), [
      'user',
      'label',
      'company',
      'position',
      'location',
      'startDate',
      'endDate',
      'responsibilities',
      'bulletPointSummary',
      'sortOrder',
      'type',
      'skills',
      'projects',
      'achievements',
    ], ownerId),
    projects: findLinkedRecords('projects', toArray(profile.projects), [
      'user',
      'name',
      'description',
      'url',
      'date',
      'picture',
      'type',
      'file',
      'sortOrder',
      'achievements',
    ], ownerId),
    skills: findLinkedRecords('skills', toArray(profile.skills), ['user', 'name', 'category', 'type', 'level', 'sortOrder', 'icon'], ownerId),
    degrees: findLinkedRecords('degrees', toArray(profile.degrees), ['user', 'title', 'school', 'year', 'level', 'sortOrder'], ownerId),
    achievements: findLinkedRecords('achievements', toArray(profile.achievements), ['user', 'title', 'description', 'sortOrder'], ownerId),
    hobbies: findLinkedRecords('hobbies', toArray(profile.hobbies), ['user', 'name', 'description', 'sortOrder'], ownerId),
  });
};

routerAdd('GET', '/api/custom/cv-data/by-slug/{slug}', getPublicCvDataBySlugHandler);

onRecordsListRequest((e) => {
  try {
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = new Date(Date.now() - twoWeeksMs);

    for (const record of e.records ?? []) {
      if (record.getString('status') !== 'sent') continue;

      const updatedAt = record.getDateTime('updated_at');
      if (!updatedAt) continue;

      const updatedAtDate = new Date(updatedAt);
      if (Number.isNaN(updatedAtDate.getTime()) || updatedAtDate >= twoWeeksAgo) continue;

      record.set('status', 'unanswered');
      try {
        $app.save(record);
        console.log('[cv_profiles] Auto-transitioned to unanswered:', record.id);
      } catch (err) {
        console.error('[cv_profiles] Auto-transition failed for', record.id, ':', err?.message || err);
      }
    }
  } catch (err) {
    console.error('[cv_profiles] Auto-transition hook error:', err?.message || err);
  }

  return e.next();
}, 'cv_profiles');
