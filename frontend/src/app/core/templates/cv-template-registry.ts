import { Type } from '@angular/core';
import { ClassicCvPage } from '../../pages/templates/classic-cv-page/classic-cv-page';
import { MinimalCvPage } from '../../pages/templates/minimal-cv-page/minimal-cv-page';
import { ModernCvPage } from '../../pages/templates/modern-cv-page/modern-cv-page';
import { SupaCVPage } from '../../pages/templates/supa-cv-page/supa-cv-page';

export interface CvTemplateOption {
  id: string;
  label: string;
  component: Type<unknown>;
}

export const CV_TEMPLATE_OPTIONS: CvTemplateOption[] = [
  { id: 'classic', label: 'Classic', component: ClassicCvPage },
  { id: 'modern', label: 'Modern', component: ModernCvPage },
  { id: 'supa', label: 'Supa (Figma)', component: SupaCVPage },
  { id: 'minimal', label: 'Minimal', component: MinimalCvPage },
];

export const CV_TEMPLATE_OPTIONS_BY_ID = new Map(CV_TEMPLATE_OPTIONS.map((template) => [template.id, template]));

export function isKnownCvTemplate(templateId: string | null | undefined): templateId is string {
  return !!templateId && CV_TEMPLATE_OPTIONS_BY_ID.has(templateId);
}
