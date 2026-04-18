import { Achievement } from '../models/achievement.model';
import { CvData } from '../models/cv-data.model';
import { CvProfile } from '../models/cv-profile.model';
import { Degree } from '../models/degree.model';
import { Hobby } from '../models/hobby.model';
import { Job } from '../models/job.model';
import { Project } from '../models/project.model';
import { Skill } from '../models/skill.model';
import { User } from '../models/user.model';

export type TemplatePreviewSeedData = {
  users: User[];
  achievements: Achievement[];
  hobbies: Hobby[];
  skills: Skill[];
  projects: Project[];
  jobs: Job[];
  degrees: Degree[];
  cv_profiles: CvProfile[];
};

function mapByIds<T extends { id: string }>(items: T[], ids: string[] | undefined): T[] {
  if (!ids?.length) {
    return [];
  }

  const itemMap = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => itemMap.get(id)).filter((item): item is T => !!item);
}

export function getTemplatePreviewData(seed: TemplatePreviewSeedData, templateId: string): CvData {
  const defaultProfile = seed.cv_profiles[0];
  const defaultUser = seed.users.find((user) => user.id === defaultProfile?.user) ?? null;

  if (!defaultProfile) {
    throw new Error('Aucune donnee de previsualisation disponible.');
  }

  return {
    profile: {
      ...defaultProfile,
      id: `${defaultProfile.id}-${templateId}`,
      slug: `${templateId}--apercu`,
      template: templateId,
      public: false,
    },
    user: defaultUser,
    achievements: mapByIds(seed.achievements, defaultProfile.achievements),
    hobbies: mapByIds(seed.hobbies, defaultProfile.hobbies),
    skills: mapByIds(seed.skills, defaultProfile.skills),
    projects: mapByIds(seed.projects, defaultProfile.projects),
    jobs: mapByIds(seed.jobs, defaultProfile.jobs),
    degrees: mapByIds(seed.degrees, defaultProfile.degrees),
  };
}
