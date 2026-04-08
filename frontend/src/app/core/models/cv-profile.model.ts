export type CvTemplate = 'classic' | 'modern' | 'minimal';

export interface CvProfile {
  id: string;
  slug: string;
  name: string;
  template: CvTemplate;
  is_default?: boolean;
  profile_picture?: string;
  cover_picture?: string;
}
