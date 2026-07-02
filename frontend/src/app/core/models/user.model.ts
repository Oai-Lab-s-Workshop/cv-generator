export interface User {
  id: string;
  firstName: string;
  lastName: string;
  linkedin?: string;
  github?: string;
  website?: string;
  email?: string;
  phone?: string;
  writingStyleDescription?: string | null;
  writingStyleUrl?: string | null;
  profilePicture?: string;
  coverPicture?: string;
}
