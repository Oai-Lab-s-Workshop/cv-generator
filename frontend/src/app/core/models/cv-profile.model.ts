import { MediaFile } from './file.model';
import { User } from './user.model';

export type CvProfileStatus = 'unsent' | 'sent' | 'rejected' | 'responded';
export type CvProfileExtraValue = string | number | boolean | string[] | null;
export type CvProfileExtraByTemplate = Record<string, Record<string, CvProfileExtraValue>>;

export interface CvProfileLinkOverrides {
  linkedin?: string;
  github?: string;
  website?: string;
}

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
  profilePictureFile?: string;
  coverPictureFile?: string;
  extra?: CvProfileExtraByTemplate;
  linkOverrides?: CvProfileLinkOverrides;
  status?: CvProfileStatus;
  updated_at?: string;
  expand?: {
    user?: User;
    profilePictureFile?: MediaFile;
    coverPictureFile?: MediaFile;
  };
}
