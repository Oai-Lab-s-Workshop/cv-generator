import { MediaFile } from './file.model';

export interface Project {
  id: string;
  user?: string;
  name: string;
  description?: string;
  url?: string;
  date?: string;
  picture?: string;
  type?: 'freelance' | 'sideproject' | 'work project';
  file?: string;
  sortOrder?: number;
  achievements?: string[];
  expand?: {
    file?: MediaFile;
  };
}
