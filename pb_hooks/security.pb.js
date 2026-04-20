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
