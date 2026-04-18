import { MediaFile } from './file.model';

export interface Project {
  id: string;
  user?: string;
  name: string;
  description?: string;
  url?: string;
  date?: string;
  file?: string;
  sortOrder?: number;
  achievements?: string[];
  expand?: {
    file?: MediaFile;
  };
}
