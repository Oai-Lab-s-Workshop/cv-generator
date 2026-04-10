import { Achievement } from './achievement.model';
import { CvProfile } from './cv-profile.model';
import { Degree } from './degree.model';
import { Hobby } from './hobby.model';
import { Job } from './job.model';
import { Project } from './project.model';
import { Skill } from './skill.model';
import { User } from './user.model';

export interface CvData {
  profile: CvProfile;
  user: User | null;
  jobs: Job[];
  projects: Project[];
  skills: Skill[];
  degrees: Degree[];
  achievements: Achievement[];
  hobbies: Hobby[];
}
