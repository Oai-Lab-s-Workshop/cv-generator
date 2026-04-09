import { CvTemplate } from '../models/cv-profile.model';

export interface ParsedCvSlug {
  template: CvTemplate;
  cvProfileId: string;
}

const SLUG_PATTERN = /^(classic|modern|minimal)--([A-Za-z0-9_-]+)$/;

export function parseCvSlug(slug: string): ParsedCvSlug | null {
  const match = SLUG_PATTERN.exec(slug.trim());

  if (!match) {
    return null;
  }

  const [, template, cvProfileId] = match;

  return {
    template: template as CvTemplate,
    cvProfileId,
  };
}
