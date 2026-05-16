import { Injectable, inject } from '@angular/core';
import { RecordModel } from 'pocketbase';
import { Achievement } from '../models/achievement.model';
import { AiToken, CreateAiTokenInput, CreatedAiTokenResult } from '../models/ai-token.model';
import { CvData } from '../models/cv-data.model';
import { CvProfile } from '../models/cv-profile.model';
import { Degree } from '../models/degree.model';
import { Hobby } from '../models/hobby.model';
import { Job } from '../models/job.model';
import { MediaFile } from '../models/file.model';
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

export interface CurrentUserProfileMaterialData {
  jobs: Job[];
  skills: Skill[];
  projects: Project[];
  achievements: Achievement[];
  degrees: Degree[];
  hobbies: Hobby[];
  files: MediaFile[];
}

export type SaveCurrentUserJobInput = Pick<Job, 'label' | 'company' | 'position' | 'startDate' | 'type'> &
  Partial<Pick<Job, 'location' | 'endDate' | 'responsibilities' | 'sortOrder'>>;
export type SaveCurrentUserSkillInput = Pick<Skill, 'name'> & Partial<Pick<Skill, 'category' | 'type' | 'level' | 'sortOrder'>>;
export type SaveCurrentUserProjectInput = Pick<Project, 'name'> &
  Partial<Pick<Project, 'description' | 'url' | 'date' | 'type' | 'file' | 'sortOrder' | 'achievements'>> & { picture?: File | null };
export type SaveCurrentUserAchievementInput = Pick<Achievement, 'title'> & Partial<Pick<Achievement, 'description' | 'sortOrder'>>;
export type SaveCurrentUserDegreeInput = Pick<Degree, 'title'> & Partial<Pick<Degree, 'school' | 'year' | 'level' | 'sortOrder'>>;
export type SaveCurrentUserHobbyInput = Pick<Hobby, 'name'> & Partial<Pick<Hobby, 'description' | 'sortOrder'>>;
export type SaveCurrentUserFileInput = Partial<Pick<MediaFile, 'name' | 'alt' | 'kind' | 'sortOrder'>> & { file?: File | null };

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
      sort: '+label',
      expand: 'user',
    });

    return profiles.map((profile) => this.normalizeCvProfile(profile));
  }

  async getCurrentUserCvProfiles(): Promise<CvProfile[]> {
    const currentUserId = this.requireCurrentUserId();

    const profiles = await this.pb.collection<CvProfile>('cv_profiles').getFullList({
      filter: `user="${currentUserId}"`,
      sort: '+label',
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

  async createCurrentUserCvProfile(label: string, profileName: string, template: string): Promise<CvProfile> {
    const currentUserId = this.requireCurrentUserId();
    const trimmedLabel = label.trim();
    const trimmedProfileName = profileName.trim();
    const trimmedTemplate = template.trim();

    if (!trimmedLabel) {
      throw new Error('Le label est obligatoire.');
    }

    if (!trimmedProfileName) {
      throw new Error('Le nom du profil est obligatoire.');
    }

    if (!trimmedTemplate) {
      throw new Error('Le template est obligatoire.');
    }

    const now = new Date();
    const created = await this.pb.collection<CvProfile>('cv_profiles').create({
      slug: `profil--${currentUserId}--${now.getTime()}`,
      label: trimmedLabel,
      profileName: trimmedProfileName,
      template: trimmedTemplate,
      public: false,
      user: currentUserId,
      achievements: [],
      projects: [],
      hobbies: [],
      jobs: [],
      degrees: [],
      skills: [],
    });

    const updated = await this.pb.collection<CvProfile>('cv_profiles').update(created.id, {
      slug: `${trimmedTemplate}--${created.id}`,
    });

    return this.normalizeCvProfile(updated);
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
    payload: Partial<Pick<CvProfile, 'label' | 'profileName' | 'public' | 'template' | 'jobs' | 'projects' | 'skills' | 'degrees' | 'achievements' | 'hobbies' | 'extra'>>,
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

  async getCurrentUserProfileMaterialData(): Promise<CurrentUserProfileMaterialData> {
    const [jobs, skills, projects, achievements, degrees, hobbies, files] = await Promise.all([
      this.getCurrentUserOwnedRecords<Job>('jobs', '+sortOrder,-startDate'),
      this.getCurrentUserOwnedRecords<Skill>('skills', '+sortOrder,+name'),
      this.getCurrentUserOwnedRecords<Project>('projects', '+sortOrder,-date', 'file'),
      this.getCurrentUserOwnedRecords<Achievement>('achievements', '+sortOrder,+title'),
      this.getCurrentUserOwnedRecords<Degree>('degrees', '+sortOrder,-year'),
      this.getCurrentUserOwnedRecords<Hobby>('hobbies', '+sortOrder,+name'),
      this.getCurrentUserOwnedRecords<MediaFile>('files', '+sortOrder,+name'),
    ]);

    return {
      jobs,
      skills,
      projects: projects.map((project) => this.normalizeProject(project)),
      achievements,
      degrees,
      hobbies,
      files: files.map((file) => this.normalizeMediaFile(file)),
    };
  }

  async createCurrentUserJob(input: SaveCurrentUserJobInput): Promise<Job> {
    const currentUserId = this.requireCurrentUserId();
    return this.pb.collection<Job>('jobs').create({
      ...input,
      user: currentUserId,
    });
  }

  async updateCurrentUserJob(jobId: string, input: SaveCurrentUserJobInput): Promise<Job> {
    const currentUserId = this.requireCurrentUserId();
    const job = await this.pb.collection<Job>('jobs').getFirstListItem(`id="${jobId}" && user="${currentUserId}"`);

    return this.pb.collection<Job>('jobs').update(job.id, input);
  }

  async createCurrentUserSkill(input: SaveCurrentUserSkillInput): Promise<Skill> {
    const currentUserId = this.requireCurrentUserId();
    return this.pb.collection<Skill>('skills').create({
      ...input,
      user: currentUserId,
    });
  }

  async updateCurrentUserSkill(skillId: string, input: SaveCurrentUserSkillInput): Promise<Skill> {
    const currentUserId = this.requireCurrentUserId();
    const skill = await this.pb.collection<Skill>('skills').getFirstListItem(`id="${skillId}" && user="${currentUserId}"`);

    return this.pb.collection<Skill>('skills').update(skill.id, input);
  }

  async createCurrentUserProject(input: SaveCurrentUserProjectInput): Promise<Project> {
    const currentUserId = this.requireCurrentUserId();
    const created = await this.pb.collection<Project>('projects').create(this.toProjectFormData(input, currentUserId));

    return this.normalizeProject(created);
  }

  async updateCurrentUserProject(projectId: string, input: SaveCurrentUserProjectInput): Promise<Project> {
    const currentUserId = this.requireCurrentUserId();
    const project = await this.pb.collection<Project>('projects').getFirstListItem(`id="${projectId}" && user="${currentUserId}"`);
    const updated = await this.pb.collection<Project>('projects').update(project.id, this.toProjectFormData(input));

    return this.normalizeProject(updated);
  }

  async createCurrentUserAchievement(input: SaveCurrentUserAchievementInput): Promise<Achievement> {
    const currentUserId = this.requireCurrentUserId();
    return this.pb.collection<Achievement>('achievements').create({
      ...input,
      user: currentUserId,
    });
  }

  async updateCurrentUserAchievement(achievementId: string, input: SaveCurrentUserAchievementInput): Promise<Achievement> {
    const currentUserId = this.requireCurrentUserId();
    const achievement = await this.pb.collection<Achievement>('achievements').getFirstListItem(`id="${achievementId}" && user="${currentUserId}"`);

    return this.pb.collection<Achievement>('achievements').update(achievement.id, input);
  }

  async createCurrentUserDegree(input: SaveCurrentUserDegreeInput): Promise<Degree> {
    const currentUserId = this.requireCurrentUserId();
    return this.pb.collection<Degree>('degrees').create({
      ...input,
      user: currentUserId,
    });
  }

  async updateCurrentUserDegree(degreeId: string, input: SaveCurrentUserDegreeInput): Promise<Degree> {
    const currentUserId = this.requireCurrentUserId();
    const degree = await this.pb.collection<Degree>('degrees').getFirstListItem(`id="${degreeId}" && user="${currentUserId}"`);

    return this.pb.collection<Degree>('degrees').update(degree.id, input);
  }

  async createCurrentUserHobby(input: SaveCurrentUserHobbyInput): Promise<Hobby> {
    const currentUserId = this.requireCurrentUserId();
    return this.pb.collection<Hobby>('hobbies').create({
      ...input,
      user: currentUserId,
    });
  }

  async updateCurrentUserHobby(hobbyId: string, input: SaveCurrentUserHobbyInput): Promise<Hobby> {
    const currentUserId = this.requireCurrentUserId();
    const hobby = await this.pb.collection<Hobby>('hobbies').getFirstListItem(`id="${hobbyId}" && user="${currentUserId}"`);

    return this.pb.collection<Hobby>('hobbies').update(hobby.id, input);
  }

  async createCurrentUserFile(input: SaveCurrentUserFileInput): Promise<MediaFile> {
    const currentUserId = this.requireCurrentUserId();

    if (!input.file) {
      throw new Error('Le fichier est obligatoire.');
    }

    const created = await this.pb.collection<MediaFile>('files').create(this.toMediaFileFormData(input, currentUserId));

    return this.normalizeMediaFile(created);
  }

  async updateCurrentUserFile(fileId: string, input: SaveCurrentUserFileInput): Promise<MediaFile> {
    const currentUserId = this.requireCurrentUserId();
    const file = await this.pb.collection<MediaFile>('files').getFirstListItem(`id="${fileId}" && user="${currentUserId}"`);
    const updated = await this.pb.collection<MediaFile>('files').update(file.id, this.toMediaFileFormData(input));

    return this.normalizeMediaFile(updated);
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
      extra: profile.extra ?? {},
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

  private normalizeMediaFile(file: MediaFile | null): MediaFile {
    if (!file) {
      throw new Error('File not found.');
    }

    return {
      ...file,
      file: this.getFileFieldUrl(file as unknown as RecordModel, file.file) || file.file,
    };
  }

  private toProjectFormData(input: SaveCurrentUserProjectInput, currentUserId?: string): FormData {
    const formData = new FormData();
    this.setFormDataValue(formData, 'name', input.name);
    this.setFormDataValue(formData, 'description', input.description);
    this.setFormDataValue(formData, 'url', input.url);
    this.setFormDataValue(formData, 'date', input.date);
    this.setFormDataValue(formData, 'type', input.type);
    this.setFormDataValue(formData, 'file', input.file);
    this.setFormDataNumber(formData, 'sortOrder', input.sortOrder);

    formData.set('achievements', JSON.stringify(input.achievements ?? []));

    if (input.picture) {
      formData.set('picture', input.picture);
    }

    if (currentUserId) {
      formData.set('user', currentUserId);
    }

    return formData;
  }

  private toMediaFileFormData(input: SaveCurrentUserFileInput, currentUserId?: string): FormData {
    const formData = new FormData();
    this.setFormDataValue(formData, 'name', input.name);
    this.setFormDataValue(formData, 'alt', input.alt);
    this.setFormDataValue(formData, 'kind', input.kind);
    this.setFormDataNumber(formData, 'sortOrder', input.sortOrder);

    if (input.file) {
      formData.set('file', input.file);
    }

    if (currentUserId) {
      formData.set('user', currentUserId);
    }

    return formData;
  }

  private setFormDataValue(formData: FormData, key: string, value: string | undefined): void {
    if (value !== undefined) {
      formData.set(key, value);
    }
  }

  private setFormDataNumber(formData: FormData, key: string, value: number | undefined): void {
    if (value !== undefined) {
      formData.set(key, String(value));
    }
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
