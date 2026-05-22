import { CvProfileExtraService } from './cv-profile-extra.service';

describe('CvProfileExtraService', () => {
  const service = new CvProfileExtraService();
  const profile = {
    template: 'classic',
    extra: {
      classic: {
        title: 'Lead Developer',
        visible: true,
        tags: ['Angular', 'Bun'],
        badTags: ['Angular', 42],
      },
    },
  } as never;

  it('reads values from the active template namespace', () => {
    expect(service.get(profile, 'title')).toBe('Lead Developer');
    expect(service.text(profile, 'title')).toBe('Lead Developer');
    expect(service.boolean(profile, 'visible')).toBe(true);
    expect(service.stringArray(profile, 'tags')).toEqual(['Angular', 'Bun']);
  });

  it('returns safe defaults for missing or incorrectly typed values', () => {
    expect(service.get(null, 'title')).toBeUndefined();
    expect(service.get({ template: '' } as never, 'title')).toBeUndefined();
    expect(service.text(profile, 'visible')).toBeNull();
    expect(service.boolean(profile, 'title')).toBe(false);
    expect(service.stringArray(profile, 'badTags')).toEqual([]);
    expect(service.stringArray(profile, 'missing')).toEqual([]);
  });
});
