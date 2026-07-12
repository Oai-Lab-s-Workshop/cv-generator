import { SkillCategory } from './skill-category.model';

export interface Skill {
  id: string;
  user?: string;
  name: string;
  category?: string;
  type?: string;
  level?: number;
  sortOrder?: number;
  icon?: string;
  expand?: {
    category?: SkillCategory;
  };
}
