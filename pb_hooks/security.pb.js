onRecordCreateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('CV profile record is missing.');
  }

  const requestedOwnerId = record.getString('user');
  const isMcpServiceAccount = e.auth.getBool('isMcpServiceAccount');

  if (isMcpServiceAccount && requestedOwnerId) {
    return;
  }

  record.set('user', e.auth.id);
}, 'cv_profiles');

onRecordUpdateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('CV profile record is missing.');
  }

  const currentOwnerId = record.getString('user');
  const isMcpServiceAccount = e.auth.getBool('isMcpServiceAccount');

  if (!isMcpServiceAccount && currentOwnerId && currentOwnerId !== e.auth.id) {
    throw new ForbiddenError('You cannot edit another user\'s CV profile.');
  }

  if (!isMcpServiceAccount) {
    record.set('user', e.auth.id);
  }
}, 'cv_profiles');

onRecordCreateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('AI token record is missing.');
  }

  if (e.auth.getBool('isMcpServiceAccount')) {
    return;
  }

  record.set('user', e.auth.id);
  record.set('profileCreatesCount', 0);
  record.set('lastUsedAt', null);
}, 'ai_tokens');

onRecordUpdateRequest((e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const record = e.record;
  if (!record) {
    throw new BadRequestError('AI token record is missing.');
  }

  const currentOwnerId = record.getString('user');
  const isMcpServiceAccount = e.auth.getBool('isMcpServiceAccount');

  if (!isMcpServiceAccount && currentOwnerId && currentOwnerId !== e.auth.id) {
    throw new ForbiddenError('You cannot edit another user\'s AI token.');
  }

  if (!isMcpServiceAccount) {
    record.set('user', e.auth.id);
  }
}, 'ai_tokens');

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
    throw new NotFoundError('Token not found.');
  }

  const ownerId = record.getString('user');
  if (ownerId !== auth.id && !auth.getBool('isMcpServiceAccount')) {
    throw new ForbiddenError('Not your token.');
  }

  if (record.getString('status') === 'revoked') {
    return e.json(200, { id: record.id, status: 'revoked', message: 'Already revoked.' });
  }

  record.set('status', 'revoked');

  try {
    $app.save(record);
  } catch (saveError) {
    console.error('[ai-tokens] Revoke save failed:', saveError?.message || saveError);
    throw new BadRequestError('Failed to revoke token: ' + (saveError?.message || 'unknown error'));
  }

  const saved = $app.findRecordById('ai_tokens', id);
  const savedStatus = saved.getString('status');
  if (savedStatus !== 'revoked') {
    console.error('[ai-tokens] Revoke verification failed: status=' + savedStatus);
    throw new BadRequestError('Revoke did not persist. Current status: ' + savedStatus);
  }

  console.log('[ai-tokens] Token revoked successfully:', id);
  return e.json(200, { id: record.id, status: 'revoked' });
});
