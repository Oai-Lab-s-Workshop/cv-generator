import { User } from './user.model';

export type CvProfileExtraValue = string | number | boolean | string[] | null;
export type CvProfileExtraByTemplate = Record<string, Record<string, CvProfileExtraValue>>;

export interface CvProfile {
  id: string;
  slug: string;
  label?: string;
  profileName: string;
  template?: string;
  public?: boolean;
  user: string;
  professionalSummary?: string;
  achievements?: string[];
  projects?: string[];
  hobbies?: string[];
  jobs?: string[];
  degrees?: string[];
  skills?: string[];
  profilePicture?: string;
  coverPicture?: string;
  extra?: CvProfileExtraByTemplate;
  expand?: {
    user?: User;
  };
}
