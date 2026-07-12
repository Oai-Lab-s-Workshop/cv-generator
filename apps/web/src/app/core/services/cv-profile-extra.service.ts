import { Injectable } from '@angular/core';
import { CvProfile, CvProfileExtraValue } from '../models/cv-profile.model';

@Injectable({ providedIn: 'root' })
export class CvProfileExtraService {
  get(profile: CvProfile | null | undefined, key: string): CvProfileExtraValue | undefined {
    const templateId = profile?.template;

    if (!templateId) {
      return undefined;
    }

    return profile.extra?.[templateId]?.[key];
  }

  text(profile: CvProfile | null | undefined, key: string): string | null {
    const value = this.get(profile, key);
    return typeof value === 'string' ? value : null;
  }

  boolean(profile: CvProfile | null | undefined, key: string): boolean {
    return this.get(profile, key) === true;
  }

  stringArray(profile: CvProfile | null | undefined, key: string): string[] {
    const value = this.get(profile, key);
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
  }
}
