export interface Emploi {
  id: string;
  cv_profile: string;
  company: string;
  position: string;
  location?: string;
  date_start?: string;
  date_end?: string;
  responsibilities?: string;
  sort_order?: number;
}
