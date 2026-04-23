import { Injectable, inject } from '@angular/core';
import { RecordModel } from 'pocketbase';
import { Achievement } from '../models/achievement.model';
import { AiToken, CreateAiTokenInput, CreatedAiTokenResult } from '../models/ai-token.model';
import { CvData } from '../models/cv-data.model';
import { CvProfile } from '../models/cv-profile.model';
import { Degree } from '../models/degree.model';
import { Hobby } from '../models/hobby.model';
import { Job } from '../models/job.model';
import { Project } from '../models/project.model';
import { Skill } from '../models/skill.model';
import { User } from '../models/user.model';
import { generateAiTokenSecret, getAiTokenPrefix, hashAiTokenSecret } from '../utils/ai-token';
import { AuthService } from './auth.service';
import { PocketBaseClientService } from './pocketbase-client.service';

export interface CurrentUserCvProfileEditorData {
  profile: CvProfile;
  availableJobs: Job[];
  availableProjects: Project[];
  availableSkills: Skill[];
  availableDegrees: Degree[];
  availableAchievements: Achievement[];
  availableHobbies: Hobby[];
}

@Injectable({ providedIn: 'root' })
export class PocketBaseService {
  private readonly pocketBaseClient = inject(PocketBaseClientService);
  private readonly authService = inject(AuthService);
  private readonly pb = this.pocketBaseClient.pb;

  async getCvProfileById(cvProfileId: string): Promise<CvProfile> {
    const profile = await this.pb.collection<CvProfile>('cv_profiles').getOne(cvProfileId, {
      expand: 'user',
    });

    return this.normalizeCvProfile(profile);
  }

  async getCvProfileBySlug(slug: string): Promise<CvProfile> {
    const profile = await this.pb.collection<CvProfile>('cv_profiles').getFirstListItem(`slug="${slug}"`, {
      expand: 'user',
    });

    return this.normalizeCvProfile(profile);
  }

  async getUser(userId: string): Promise<User | null> {
    if (!userId) {
      return null;
    }

    const user = await this.pb.collection<User>('users').getOne(userId);

    return this.normalizeUser(user);
  }

  async getJobs(jobIds: string[]): Promise<Job[]> {
    return this.getOrderedRecords<Job>('jobs', jobIds, '+sortOrder,-startDate');
  }

  async getProjects(projectIds: string[]): Promise<Project[]> {
    const projects = await this.getOrderedRecords<Project>('projects', projectIds, '+sortOrder,-date', 'file');

    return projects.map((project) => this.normalizeProject(project));
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
    const profiles = await this.pb.collection<CvProfile>('cv_profiles').getFullList({
      sort: '+profileName',
      expand: 'user',
    });

    return profiles.map((profile) => this.normalizeCvProfile(profile));
  }

  async getCurrentUserCvProfiles(): Promise<CvProfile[]> {
    const currentUserId = this.requireCurrentUserId();

    const profiles = await this.pb.collection<CvProfile>('cv_profiles').getFullList({
      filter: `user="${currentUserId}"`,
      sort: '+profileName',
      expand: 'user',
    });

    return profiles.map((profile) => this.normalizeCvProfile(profile));
  }

  async getCurrentUserCvProfileById(profileId: string): Promise<CvProfile> {
    const currentUserId = this.requireCurrentUserId();
    const profile = await this.pb
      .collection<CvProfile>('cv_profiles')
      .getFirstListItem(`id="${profileId}" && user="${currentUserId}"`, {
        expand: 'user',
      });

    return this.normalizeCvProfile(profile);
  }

  async createCurrentUserCvProfile(profileName: string): Promise<CvProfile> {
    const currentUserId = this.requireCurrentUserId();
    const trimmedProfileName = profileName.trim();

    if (!trimmedProfileName) {
      throw new Error('Le nom du profil est obligatoire.');
    }

    const now = new Date();
    const created = await this.pb.collection<CvProfile>('cv_profiles').create({
      slug: `brouillon--${currentUserId}--${now.getTime()}`,
      profileName: trimmedProfileName,
      template: '',
      public: false,
      user: currentUserId,
      achievements: [],
      projects: [],
      hobbies: [],
      jobs: [],
      degrees: [],
      skills: [],
    });

    return this.normalizeCvProfile(created);
  }

  async setTemplateForCurrentUserCvProfile(profileId: string, template: string, isPublic: boolean): Promise<CvProfile> {
    const profile = await this.getCurrentUserCvProfileById(profileId);

    const updated = await this.pb.collection<CvProfile>('cv_profiles').update(profile.id, {
      template,
      public: isPublic,
      slug: `${template}--${profile.id}`,
    });

    return this.normalizeCvProfile(updated);
  }

  async setPublicForCurrentUserCvProfile(profileId: string, isPublic: boolean): Promise<CvProfile> {
    const profile = await this.getCurrentUserCvProfileById(profileId);

    const updated = await this.pb.collection<CvProfile>('cv_profiles').update(profile.id, {
      public: isPublic,
    });

    return this.normalizeCvProfile(updated);
  }

  async updateCurrentUserCvProfile(
    profileId: string,
    payload: Partial<Pick<CvProfile, 'profileName' | 'public' | 'template' | 'jobs' | 'projects' | 'skills' | 'degrees' | 'achievements' | 'hobbies'>>,
  ): Promise<CvProfile> {
    const profile = await this.getCurrentUserCvProfileById(profileId);
    const template = payload.template ?? profile.template ?? '';
    const updated = await this.pb.collection<CvProfile>('cv_profiles').update(profile.id, {
      ...payload,
      slug: template ? `${template}--${profile.id}` : profile.slug,
    });

    return this.normalizeCvProfile(updated);
  }

  async updateCurrentUserCvProfilePictures(
    profileId: string,
    pictures: { profilePicture?: File | null; coverPicture?: File | null },
  ): Promise<CvProfile> {
    const profile = await this.getCurrentUserCvProfileById(profileId);
    const formData = new FormData();

    if (pictures.profilePicture) {
      formData.set('profilePicture', pictures.profilePicture);
    }

    if (pictures.coverPicture) {
      formData.set('coverPicture', pictures.coverPicture);
    }

    const updated = await this.pb.collection<CvProfile>('cv_profiles').update(profile.id, formData);

    return this.normalizeCvProfile(updated);
  }

  async getCurrentUserCvProfileEditorData(profileId: string): Promise<CurrentUserCvProfileEditorData> {
    const profile = await this.getCurrentUserCvProfileById(profileId);
    const [availableJobs, availableProjects, availableSkills, availableDegrees, availableAchievements, availableHobbies] =
      await Promise.all([
        this.getCurrentUserOwnedRecords<Job>('jobs', '+sortOrder,-startDate'),
        this.getCurrentUserOwnedRecords<Project>('projects', '+sortOrder,-date', 'file'),
        this.getCurrentUserOwnedRecords<Skill>('skills', '+sortOrder,+name'),
        this.getCurrentUserOwnedRecords<Degree>('degrees', '+sortOrder,-year'),
        this.getCurrentUserOwnedRecords<Achievement>('achievements', '+sortOrder,+title'),
        this.getCurrentUserOwnedRecords<Hobby>('hobbies', '+sortOrder,+name'),
      ]);

    return {
      profile,
      availableJobs,
      availableProjects: availableProjects.map((project) => this.normalizeProject(project)),
      availableSkills,
      availableDegrees,
      availableAchievements,
      availableHobbies,
    };
  }

  async getCurrentUserAiTokens(): Promise<AiToken[]> {
    const currentUserId = this.requireCurrentUserId();
    const tokens = await this.pb.collection<AiToken>('ai_tokens').getFullList({
      filter: `user="${currentUserId}"`,
      sort: '-created',
    });

    return tokens.map((token) => this.normalizeAiToken(token));
  }

  async createCurrentUserAiToken(input: CreateAiTokenInput): Promise<CreatedAiTokenResult> {
    const currentUserId = this.requireCurrentUserId();
    const rawToken = generateAiTokenSecret();
    const tokenHash = await hashAiTokenSecret(rawToken);
    const label = input.label.trim();

    if (!label) {
      throw new Error('Le label de la cle API est obligatoire.');
    }

    const created = await this.pb.collection<AiToken>('ai_tokens').create({
      token_hash: tokenHash,
      token_prefix: getAiTokenPrefix(rawToken),
      user: currentUserId,
      label,
      status: 'active',
      expiresAt: input.expiresAt || null,
      lastUsedAt: null,
    });

    return {
      record: this.normalizeAiToken(created),
      rawToken,
      debug: {
        currentUserId,
      },
    };
  }

  async revokeCurrentUserAiToken(tokenId: string): Promise<void> {
    await this.pb.send(`/api/custom/ai-tokens/${tokenId}/revoke`, {
      method: 'PATCH',
      requestKey: `revoke-${tokenId}`,
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

  private async getCurrentUserOwnedRecords<T extends { id: string }>(
    collectionName: string,
    sort: string,
    expand?: string,
  ): Promise<T[]> {
    const currentUserId = this.requireCurrentUserId();
    return this.pb.collection<T>(collectionName).getFullList({
      filter: `user="${currentUserId}"`,
      sort,
      expand,
    });
  }

  private normalizeCvProfile(profile: CvProfile | null): CvProfile {
    if (!profile) {
      throw new Error('CV profile not found.');
    }

    return {
      ...profile,
      profilePicture: this.getFileFieldUrl(profile as unknown as RecordModel, profile.profilePicture),
      coverPicture: this.getFileFieldUrl(profile as unknown as RecordModel, profile.coverPicture),
      expand: profile.expand
        ? {
            ...profile.expand,
            user: profile.expand.user ? this.normalizeUser(profile.expand.user as User & RecordModel) ?? undefined : undefined,
          }
        : undefined,
    };
  }

  private normalizeUser(user: User | null): User | null {
    if (!user) {
      return null;
    }

    return {
      ...user,
      profilePicture: this.getFileFieldUrl(user as unknown as RecordModel, user.profilePicture),
      coverPicture: this.getFileFieldUrl(user as unknown as RecordModel, user.coverPicture),
    };
  }

  private normalizeProject(project: Project | null): Project {
    if (!project) {
      throw new Error('Project not found.');
    }

    return {
      ...project,
      picture: this.getFileFieldUrl(project as unknown as RecordModel, project.picture),
    };
  }

  private async getCurrentUserAiTokenById(tokenId: string): Promise<AiToken> {
    const currentUserId = this.requireCurrentUserId();
    const token = await this.pb
      .collection<AiToken>('ai_tokens')
      .getFirstListItem(`id="${tokenId}" && user="${currentUserId}"`);

    return this.normalizeAiToken(token);
  }

  private normalizeAiToken(token: AiToken | null): AiToken {
    if (!token) {
      throw new Error('API key not found.');
    }

    return { ...token };
  }

  private getFileFieldUrl(record: RecordModel, filename: string | undefined): string | undefined {
    if (!filename) {
      return undefined;
    }

    return this.pb.files.getURL(record, filename);
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
