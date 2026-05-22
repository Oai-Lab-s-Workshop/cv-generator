import { isKnownCvTemplate } from './cv-template-registry';

describe('cv-template-registry', () => {
  it('recognizes known templates', () => {
    expect(isKnownCvTemplate('classic')).toBe(true);
    expect(isKnownCvTemplate('bento')).toBe(true);
    expect(isKnownCvTemplate('modern')).toBe(true);
    expect(isKnownCvTemplate('supa')).toBe(true);
    expect(isKnownCvTemplate('minimal')).toBe(true);
  });

  it('rejects unknown and falsy templates', () => {
    expect(isKnownCvTemplate('unknown')).toBe(false);
    expect(isKnownCvTemplate(null)).toBe(false);
    expect(isKnownCvTemplate(undefined)).toBe(false);
    expect(isKnownCvTemplate('')).toBe(false);
  });
});