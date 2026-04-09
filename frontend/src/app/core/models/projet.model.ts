import { MediaFile } from './file.model';

export interface Projet {
  id: string;
  cv_profile: string;
  name: string;
  description?: string;
  url?: string;
  date?: string;
  file?: string;
  sort_order?: number;
  expand?: {
    file?: MediaFile;
  };
}
