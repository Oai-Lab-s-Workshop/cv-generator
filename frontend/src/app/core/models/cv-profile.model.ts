export type CvTemplate = 'classic' | 'modern' | 'minimal';

export interface CvProfile {
  id: string;
  slug: string;
  name: string;
  template: CvTemplate;
  is_default?: boolean;
}
