import { Injectable, inject } from '@angular/core';
import { Achievement } from '../models/achievement.model';
import { CvData } from '../models/cv-data.model';
import { CvProfile } from '../models/cv-profile.model';
import { Degree } from '../models/degree.model';
import { Hobby } from '../models/hobby.model';
import { Job } from '../models/job.model';
import { Project } from '../models/project.model';
import { Skill } from '../models/skill.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { PocketBaseClientService } from './pocketbase-client.service';

@Injectable({ providedIn: 'root' })
export class PocketBaseService {
  private readonly pocketBaseClient = inject(PocketBaseClientService);
  private readonly authService = inject(AuthService);
  private readonly pb = this.pocketBaseClient.pb;

  async getCvProfileById(cvProfileId: string): Promise<CvProfile> {
    return this.pb.collection<CvProfile>('cv_profiles').getOne(cvProfileId, {
      expand: 'user',
    });
  }

  async getCvProfileBySlug(slug: string): Promise<CvProfile> {
    return this.pb.collection<CvProfile>('cv_profiles').getFirstListItem(`slug="${slug}"`, {
      expand: 'user',
    });
  }

  async getUser(userId: string): Promise<User | null> {
    if (!userId) {
      return null;
    }

    return this.pb.collection<User>('users').getOne(userId);
  }

  async getJobs(jobIds: string[]): Promise<Job[]> {
    return this.getOrderedRecords<Job>('jobs', jobIds, '+sortOrder,-startDate');
  }

  async getProjects(projectIds: string[]): Promise<Project[]> {
    return this.getOrderedRecords<Project>('projects', projectIds, '+sortOrder,-date', 'file');
  }

  async getSkills(skillIds: string[]): Promise<Skill[]> {
    return this.getOrderedRecords<Skill>('skills', skillIds, '+sortOrder,+name');
  }

  async getDegrees(degreeIds: string[]): Promise<Degree[]> {
    return this.getOrderedRecords<Degree>('degrees', degreeIds, '+sortOrder,-year');
  }

  async getAchievements(achievementIds: string[]): Promise<Achievement[]> {
    return this.getOrderedRecords<Achievement>('achievements', achievementIds, '+sortOrder,+title');
  }

  async getHobbies(hobbyIds: string[]): Promise<Hobby[]> {
    return this.getOrderedRecords<Hobby>('hobbies', hobbyIds, '+sortOrder,+name');
  }

  async getAllCvProfiles(): Promise<CvProfile[]> {
    return this.pb.collection<CvProfile>('cv_profiles').getFullList({
      sort: '+profileName',
      expand: 'user',
    });
  }

  async getCurrentUserCvProfiles(): Promise<CvProfile[]> {
    const currentUserId = this.requireCurrentUserId();

    return this.pb.collection<CvProfile>('cv_profiles').getFullList({
      filter: `user="${currentUserId}"`,
      sort: '+profileName',
      expand: 'user',
    });
  }

  async setTemplateForCurrentUserCvProfile(profileId: string, template: string, isPublic: boolean): Promise<CvProfile> {
    const currentUserId = this.requireCurrentUserId();
    const profile = await this.pb
      .collection<CvProfile>('cv_profiles')
      .getFirstListItem(`id="${profileId}" && user="${currentUserId}"`);

    return this.pb.collection<CvProfile>('cv_profiles').update(profile.id, {
      template,
      public: isPublic,
      slug: `${template}--${profile.id}`,
    });
  }

  async setPublicForCurrentUserCvProfile(profileId: string, isPublic: boolean): Promise<CvProfile> {
    const currentUserId = this.requireCurrentUserId();
    const profile = await this.pb
      .collection<CvProfile>('cv_profiles')
      .getFirstListItem(`id="${profileId}" && user="${currentUserId}"`);

    return this.pb.collection<CvProfile>('cv_profiles').update(profile.id, {
      public: isPublic,
    });
  }

  async getCvDataByProfileId(cvProfileId: string): Promise<CvData> {
    const profile = await this.getCvProfileById(cvProfileId);
    const user = profile.expand?.user ?? (await this.getUser(profile.user));
    const [jobs, projects, skills, degrees, achievements, hobbies] = await Promise.all([
      this.getJobs(profile.jobs ?? []),
      this.getProjects(profile.projects ?? []),
      this.getSkills(profile.skills ?? []),
      this.getDegrees(profile.degrees ?? []),
      this.getAchievements(profile.achievements ?? []),
      this.getHobbies(profile.hobbies ?? []),
    ]);

    return {
      profile,
      user,
      jobs,
      projects,
      skills,
      degrees,
      achievements,
      hobbies,
    };
  }

  private async getOrderedRecords<T extends { id: string }>(
    collectionName: string,
    recordIds: string[],
    sort: string,
    expand?: string,
  ): Promise<T[]> {
    if (recordIds.length === 0) {
      return [];
    }

    const records = await this.pb.collection<T>(collectionName).getFullList({
      filter: recordIds.map((recordId) => `id="${recordId}"`).join(' || '),
      sort,
      expand,
    });

    const recordsById = new Map(records.map((record) => [record.id, record]));

    return recordIds.map((recordId) => recordsById.get(recordId)).filter((record): record is T => !!record);
  }

  private requireCurrentUserId(): string {
    const currentUserId = this.authService.getCurrentUserId();

    if (!currentUserId) {
      throw new Error('Authentication required.');
    }

    return currentUserId;
  }

  public toDate(value?: string | null): Date | undefined {
    if (!value) {
      return undefined;
    }
    const isoValue = value.replace(' ', 'T');
    const date = new Date(isoValue);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
}
