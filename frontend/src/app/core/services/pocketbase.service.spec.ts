import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { PocketBaseClientService } from './pocketbase-client.service';
import { PocketBaseService } from './pocketbase.service';

jest.mock('../utils/ai-token', () => ({
  generateAiTokenSecret: jest.fn(() => 'resm_mock_secret_value'),
  getAiTokenPrefix: jest.fn((token: string) => token.slice(0, 16)),
  hashAiTokenSecret: jest.fn(async (token: string) => `hash:${token}`),
}));

describe('PocketBaseService', () => {
  let service: PocketBaseService;
  let collections: Record<string, Record<string, jest.Mock>>;
  let currentUserId: string | null;
  let pb: {
    collection: jest.Mock;
    files: { getURL: jest.Mock };
    send: jest.Mock;
  };

  beforeEach(() => {
    currentUserId = 'user-1';
    collections = {};
    pb = {
      collection: jest.fn((name: string) => {
        collections[name] ??= {
          getOne: jest.fn(),
          getFirstListItem: jest.fn(),
          getFullList: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          authWithPassword: jest.fn(),
        };
        return collections[name];
      }),
      files: { getURL: jest.fn((record, filename) => `https://files.test/${record.id}/${filename}`) },
      send: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PocketBaseService,
        { provide: PocketBaseClientService, useValue: { pb } },
        { provide: AuthService, useValue: { getCurrentUserId: () => currentUserId } },
      ],
    });

    service = TestBed.inject(PocketBaseService);
  });

  it('normalizes profiles, expanded users and file fields', async () => {
    collections['cv_profiles'] = {
      getOne: jest.fn().mockResolvedValue({
        id: 'profile-1',
        slug: 'classic--profile-1',
        profileName: 'Jane Doe',
        template: 'classic',
        user: 'user-1',
        profilePicture: 'profile.png',
        coverPicture: 'cover.png',
        expand: {
          user: { id: 'user-1', firstName: 'Jane', profilePicture: 'user.png' },
          profilePictureFile: { id: 'file-1', file: 'portrait.png' },
          coverPictureFile: { id: 'file-2', file: 'banner.png' },
        },
      }),
    } as never;

    const profile = await service.getCvProfileById('profile-1');

    expect(collections['cv_profiles']['getOne']).toHaveBeenCalledWith('profile-1', { expand: 'user,profilePictureFile,coverPictureFile' });
    expect(profile.extra).toEqual({});
    expect(profile.profilePicture).toBe('https://files.test/file-1/portrait.png');
    expect(profile.coverPicture).toBe('https://files.test/file-2/banner.png');
    expect(profile.expand?.user?.profilePicture).toBe('https://files.test/user-1/user.png');
  });

  it('returns null for blank users and normalizes fetched users', async () => {
    expect(await service.getUser('')).toBeNull();
    collections['users'] = { getOne: jest.fn().mockResolvedValue({ id: 'user-1', profilePicture: 'me.png' }) } as never;

    await expect(service.getUser('user-1')).resolves.toMatchObject({ profilePicture: 'https://files.test/user-1/me.png' });
  });

  it('loads ordered related records in the requested order', async () => {
    collections['jobs'] = {
      getFullList: jest.fn().mockResolvedValue([{ id: 'job-2' }, { id: 'job-1' }]),
    } as never;

    await expect(service.getJobs(['job-1', 'missing', 'job-2'])).resolves.toEqual([{ id: 'job-1' }, { id: 'job-2' }]);
    expect(collections['jobs']['getFullList']).toHaveBeenCalledWith({
      filter: 'id="job-1" || id="missing" || id="job-2"',
      sort: '+sortOrder,-startDate',
      expand: undefined,
    });
    await expect(service.getJobs([])).resolves.toEqual([]);
  });

  it('creates, updates and deletes current user CV profiles', async () => {
    jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1234);
    collections['cv_profiles'] = {
      create: jest.fn().mockResolvedValue({ id: 'profile-1', template: 'classic', slug: 'temp', user: 'user-1' }),
      update: jest.fn().mockResolvedValue({ id: 'profile-1', template: 'modern', slug: 'modern--profile-1', user: 'user-1' }),
      getFirstListItem: jest.fn().mockResolvedValue({ id: 'profile-1', template: 'classic', slug: 'classic--profile-1', user: 'user-1' }),
      delete: jest.fn().mockResolvedValue(undefined),
    } as never;

    await expect(service.createCurrentUserCvProfile(' Label ', ' Jane ', ' classic ')).resolves.toMatchObject({
      slug: 'modern--profile-1',
    });
    expect(collections['cv_profiles']['create']).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'profil--user-1--1234',
      label: 'Label',
      profileName: 'Jane',
      template: 'classic',
      user: 'user-1',
    }));
    expect(collections['cv_profiles']['update']).toHaveBeenCalledWith('profile-1', { slug: 'classic--profile-1' });

    await service.setTemplateForCurrentUserCvProfile('profile-1', 'modern', true);
    await service.setPublicForCurrentUserCvProfile('profile-1', false);
    await service.updateCurrentUserCvProfile('profile-1', { profileName: 'Jane Updated' });
    await service.deleteCurrentUserCvProfile('profile-1');

    expect(collections['cv_profiles']['delete']).toHaveBeenCalledWith('profile-1');
  });

  it('validates required CV profile creation fields and authentication', async () => {
    await expect(service.createCurrentUserCvProfile('', 'Jane', 'classic')).rejects.toThrow('Le label est obligatoire.');
    await expect(service.createCurrentUserCvProfile('Label', '', 'classic')).rejects.toThrow('Le nom du profil est obligatoire.');
    await expect(service.createCurrentUserCvProfile('Label', 'Jane', '')).rejects.toThrow('Le template est obligatoire.');

    currentUserId = null;
    await expect(service.getCurrentUserCvProfiles()).rejects.toThrow('Authentication required.');
  });

  it('creates and updates owned material records', async () => {
    for (const name of ['jobs', 'skills', 'skill_categories', 'projects', 'achievements', 'degrees', 'hobbies', 'files']) {
      collections[name] = {
        getFirstListItem: jest.fn().mockResolvedValue({ id: `${name}-1`, user: 'user-1' }),
        getFullList: jest.fn().mockResolvedValue([]),
        create: jest.fn((payload) => Promise.resolve({ id: `${name}-created`, ...formDataToObject(payload) })),
        update: jest.fn((id, payload) => Promise.resolve({ id, ...formDataToObject(payload) })),
      } as never;
    }

    await service.createCurrentUserJob({ label: 'Job', company: 'ACME', position: 'Dev', startDate: '2020-01-01', type: 'work project' });
    await service.updateCurrentUserJob('job-1', { label: 'Job', company: 'ACME', position: 'Dev', startDate: '2020-01-01', type: 'work project' });
    await service.createCurrentUserSkill({ name: 'Angular', category: '', type: 'Framework' });
    await service.updateCurrentUserSkill('skill-1', { name: 'Angular', category: '', type: 'Framework' });
    await service.createCurrentUserAchievement({ title: 'Won' });
    await service.updateCurrentUserAchievement('achievement-1', { title: 'Won' });
    await service.createCurrentUserDegree({ title: 'Degree' });
    await service.updateCurrentUserDegree('degree-1', { title: 'Degree' });
    await service.createCurrentUserHobby({ name: 'Music' });
    await service.updateCurrentUserHobby('hobby-1', { name: 'Music' });

    const picture = new File(['x'], 'picture.png');
    await expect(service.createCurrentUserProject({ name: 'Project', achievements: ['a1'], picture })).resolves.toMatchObject({
      name: 'Project',
      user: 'user-1',
    });
    await service.updateCurrentUserProject('project-1', { name: 'Project' });

    const file = new File(['x'], 'doc.pdf');
    await expect(service.createCurrentUserFile({ name: 'Doc', kind: 'document', file })).resolves.toMatchObject({ user: 'user-1' });
    await service.updateCurrentUserFile('file-1', { name: 'Doc' });

    await expect(service.createCurrentUserFile({ name: 'Doc' })).rejects.toThrow('Le fichier est obligatoire.');
  });

  it('reuses existing skill categories by normalized name', async () => {
    collections['skill_categories'] = {
      getFullList: jest.fn().mockResolvedValue([{ id: 'category-1', name: 'Developpement' }]),
      create: jest.fn(),
    } as never;

    await expect(service.createCurrentUserSkillCategory(' developpement ')).resolves.toMatchObject({ id: 'category-1' });
    await expect(service.createCurrentUserSkillCategory('')).rejects.toThrow('Le nom de la categorie est obligatoire.');
    expect(collections['skill_categories']['create']).not.toHaveBeenCalled();
  });

  it('handles AI tokens and user updates', async () => {
    collections['ai_tokens'] = {
      getFullList: jest.fn().mockResolvedValue([{ id: 'token-1', label: 'Token' }]),
      create: jest.fn().mockResolvedValue({ id: 'token-2', label: 'New token' }),
      getFirstListItem: jest.fn().mockResolvedValue({ id: 'token-1', label: 'Token' }),
    } as never;
    collections['users'] = { update: jest.fn().mockResolvedValue({ id: 'user-1', firstName: 'Jane' }) } as never;
    pb.send.mockResolvedValue(undefined);

    await expect(service.getCurrentUserAiTokens()).resolves.toEqual([{ id: 'token-1', label: 'Token' }]);
    await expect(service.createCurrentUserAiToken({ label: ' API ', expiresAt: '' })).resolves.toMatchObject({
      rawToken: 'resm_mock_secret_value',
      debug: { currentUserId: 'user-1' },
    });
    expect(collections['ai_tokens']['create']).toHaveBeenCalledWith(expect.objectContaining({
      token_hash: 'hash:resm_mock_secret_value',
      token_prefix: 'resm_mock_secret',
      label: 'API',
      expiresAt: null,
    }));
    await expect(service.createCurrentUserAiToken({ label: ' ' })).rejects.toThrow('Le label de la cle API est obligatoire.');
    await service.revokeCurrentUserAiToken('token-1');
    expect(pb.send).toHaveBeenCalledWith('/api/custom/ai-tokens/token-1/revoke', { method: 'PATCH', requestKey: 'revoke-token-1' });
    await expect(service.updateCurrentUser({ firstName: 'Jane' })).resolves.toMatchObject({ id: 'user-1', firstName: 'Jane' });
  });

  it('builds complete CV data and resolves link overrides', async () => {
    jest.spyOn(service, 'getCvProfileById').mockResolvedValue({
      id: 'profile-1',
      user: 'user-1',
      jobs: ['job-1'],
      projects: ['project-1'],
      skills: ['skill-1'],
      degrees: ['degree-1'],
      achievements: ['achievement-1'],
      hobbies: ['hobby-1'],
      linkOverrides: { github: 'https://github.test/override' },
    } as never);
    jest.spyOn(service, 'getUser').mockResolvedValue({ id: 'user-1', github: 'https://github.test/original' } as never);
    jest.spyOn(service, 'getJobs').mockResolvedValue([{ id: 'job-1' }] as never);
    jest.spyOn(service, 'getProjects').mockResolvedValue([{ id: 'project-1' }] as never);
    jest.spyOn(service, 'getSkills').mockResolvedValue([{ id: 'skill-1' }] as never);
    jest.spyOn(service, 'getDegrees').mockResolvedValue([{ id: 'degree-1' }] as never);
    jest.spyOn(service, 'getAchievements').mockResolvedValue([{ id: 'achievement-1' }] as never);
    jest.spyOn(service, 'getHobbies').mockResolvedValue([{ id: 'hobby-1' }] as never);

    const data = await service.getCvDataByProfileId('profile-1');

    expect(data.user?.github).toBe('https://github.test/override');
    expect(data.jobs).toHaveLength(1);
    expect(service.resolveUserLinks({ linkOverrides: { website: 'https://site.test' } } as never, null)).toBeNull();
  });

  it('parses date strings safely', () => {
    expect(service.toDate()).toBeUndefined();
    expect(service.toDate('2024-01-02 03:04:05')?.getFullYear()).toBe(2024);
  });

  function formDataToObject(payload: unknown): Record<string, unknown> {
    if (!(payload instanceof FormData)) {
      return payload as Record<string, unknown>;
    }

    return Object.fromEntries((payload as FormData & { entries: () => Iterable<[string, FormDataEntryValue]> }).entries());
  }
});
