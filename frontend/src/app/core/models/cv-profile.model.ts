import { User } from './user.model';

export interface CvProfile {
  id: string;
  slug: string;
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
  expand?: {
    user?: User;
  };
}
