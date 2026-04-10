export interface MediaFile {
  id: string;
  name?: string;
  file: string;
  alt?: string;
  kind?: 'image' | 'video' | 'document' | 'other';
  sortOrder?: number;
}
