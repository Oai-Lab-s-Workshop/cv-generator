import { getTemplatePreviewData } from './template-preview-fr.data';

describe('getTemplatePreviewData', () => {
  const seed = {
    users: [{ id: 'user-1', firstName: 'Jane', lastName: 'Doe' }],
    achievements: [{ id: 'achievement-1', title: 'Award' }],
    hobbies: [{ id: 'hobby-1', name: 'Music' }],
    skills: [{ id: 'skill-1', name: 'Angular' }],
    projects: [{ id: 'project-1', name: 'Resumate' }],
    jobs: [{ id: 'job-1', label: 'Engineer' }],
    degrees: [{ id: 'degree-1', title: 'Master' }],
    cv_profiles: [
      {
        id: 'profile-1',
        user: 'user-1',
        profileName: 'Jane Doe',
        template: 'classic',
        achievements: ['achievement-1', 'missing'],
        hobbies: ['hobby-1'],
        skills: ['skill-1'],
        projects: ['project-1'],
        jobs: ['job-1'],
        degrees: ['degree-1'],
      },
    ],
  } as never;

  it('builds preview data for the requested template', () => {
    const preview = getTemplatePreviewData(seed, 'modern');

    expect(preview.profile.id).toBe('profile-1-modern');
    expect(preview.profile.slug).toBe('modern--apercu');
    expect(preview.profile.template).toBe('modern');
    expect(preview.profile.public).toBe(false);
    expect(preview.user?.id).toBe('user-1');
    expect(preview.achievements).toHaveLength(1);
    expect(preview.hobbies[0].id).toBe('hobby-1');
    expect(preview.skills[0].id).toBe('skill-1');
    expect(preview.projects[0].id).toBe('project-1');
    expect(preview.jobs[0].id).toBe('job-1');
    expect(preview.degrees[0].id).toBe('degree-1');
  });

  it('throws when no profile seed exists', () => {
    const emptySeed = { ...(seed as object), cv_profiles: [] } as never;

    expect(() => getTemplatePreviewData(emptySeed, 'classic')).toThrow(
      'Aucune donnee de previsualisation disponible.',
    );
  });
});
