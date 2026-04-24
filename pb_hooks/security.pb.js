onRecordCreateRequest((e) => {
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

  if (hasSuperuserAccess || (isMcpServiceAccount && requestedOwnerId)) {
    return e.next();
  }

  record.set('user', e.auth.id);
  return e.next();
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

routerAdd('PATCH', '/api/custom/ai-tokens/{id}/revoke', (e) => {
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
});
