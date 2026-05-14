import { Type } from '@angular/core';
import { ClassicCvPage } from '../../pages/templates/classic-cv-page/classic-cv-page';
import { BentoCvPage } from '../../pages/templates/bento-cv-page/bento-cv-page';
import { MinimalCvPage } from '../../pages/templates/minimal-cv-page/minimal-cv-page';
import { ModernCvPage } from '../../pages/templates/modern-cv-page/modern-cv-page';
import { SupaCVPage } from '../../pages/templates/supa-cv-page/supa-cv-page';

export interface CvTemplateOption {
  id: string;
  label: string;
  component: Type<unknown>;
  extraSchema?: CvTemplateExtraField[];
}

export type CvTemplateExtraFieldType = 'text' | 'textarea' | 'boolean' | 'color' | 'select' | 'multi_select';
export type CvTemplateExtraFieldSource = 'projects' | 'jobs' | 'skills' | 'degrees' | 'achievements' | 'hobbies';

export interface CvTemplateExtraFieldOption {
  label: string;
  value: string;
}

export interface CvTemplateExtraField {
  id: string;
  label: string;
  type: CvTemplateExtraFieldType;
  description: string;
  required?: boolean;
  source?: CvTemplateExtraFieldSource;
  options?: CvTemplateExtraFieldOption[];
}

export const CV_TEMPLATE_OPTIONS: CvTemplateOption[] = [
  { id: 'classic', label: 'Classic', component: ClassicCvPage },
  { id: 'bento', label: 'Bento', component: BentoCvPage },
  {
    id: 'modern',
    label: 'Modern',
    component: ModernCvPage,
    extraSchema: [
      {
        id: 'headline',
        label: 'Headline',
        type: 'text',
        description: 'Short role-focused line displayed near the candidate name.',
      },
      {
        id: 'accentColor',
        label: 'Accent color',
        type: 'color',
        description: 'Main visual accent color for this profile.',
      },
    ],
  },
  {
    id: 'supa',
    label: 'Supa (Figma)',
    component: SupaCVPage,
    extraSchema: [
      {
        id: 'featuredProjectIds',
        label: 'Featured projects',
        type: 'multi_select',
        source: 'projects',
        description: 'Project IDs to emphasize in the compact Supa layout. Choose projects most relevant to the target role.',
      },
      {
        id: 'compactMode',
        label: 'Compact mode',
        type: 'boolean',
        description: 'Whether the template should aggressively reduce spacing to fit more content on one A4 page.',
      },
    ],
  },
  { id: 'minimal', label: 'Minimal', component: MinimalCvPage },
];

export const CV_TEMPLATE_OPTIONS_BY_ID = new Map(CV_TEMPLATE_OPTIONS.map((template) => [template.id, template]));

export function isKnownCvTemplate(templateId: string | null | undefined): templateId is string {
  return !!templateId && CV_TEMPLATE_OPTIONS_BY_ID.has(templateId);
}
