export interface MediaFile {
  id: string;
  cv_profile: string;
  name?: string;
  file: string;
  alt?: string;
  kind?: 'image' | 'video' | 'document' | 'other';
  sort_order?: number;
}
