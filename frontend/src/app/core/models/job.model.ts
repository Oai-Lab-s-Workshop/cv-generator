export interface Job {
  id: string;
  user?: string;
  label: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  responsibilities?: string;
  sortOrder?: number;
  type: 'freelance' | 'sideproject' | 'work project';
  skills?: string[];
  projects?: string[];
  achievements?: string[];
}
