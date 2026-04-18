import { ChangeDetectionStrategy, Component, effect, inject, Injector, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Achievement } from '../../core/models/achievement.model';
import { CvProfile } from '../../core/models/cv-profile.model';
import { Degree } from '../../core/models/degree.model';
import { Hobby } from '../../core/models/hobby.model';
import { Job } from '../../core/models/job.model';
import { Project } from '../../core/models/project.model';
import { Skill } from '../../core/models/skill.model';
import { CurrentUserCvProfileEditorData, PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS } from '../../core/templates/cv-template-registry';
import { getErrorMessage } from '../../core/utils/error-message';

type RelationType = 'jobs' | 'projects' | 'skills' | 'degrees' | 'achievements' | 'hobbies';

type EditorState = {
  profile: CvProfile;
  availableJobs: Job[];
  availableProjects: Project[];
  availableSkills: Skill[];
  availableDegrees: Degree[];
  availableAchievements: Achievement[];
  availableHobbies: Hobby[];
};

@Component({
  selector: 'app-profile-editor-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile-editor-page.html',
  styleUrl: './profile-editor-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditorPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  private requestId = 0;

  readonly profileId = input.required<string>();
  readonly templateOptions = CV_TEMPLATE_OPTIONS;
  readonly editorState = signal<EditorState | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedProfilePicture = signal<File | null>(null);
  readonly selectedCoverPicture = signal<File | null>(null);

  ngOnInit(): void {
    effect(
      () => {
        void this.loadEditorData(this.profileId());
      },
      { injector: this.injector },
    );
  }

  onProfilePictureSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedProfilePicture.set(file);
  }

  onCoverPictureSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedCoverPicture.set(file);
  }

  async save(): Promise<void> {
    const state = this.editorState();

    if (!state) {
      return;
    }

    const profileName = state.profile.profileName.trim();
    if (!profileName) {
      this.errorMessage.set('Le nom du profil est obligatoire.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.pocketBaseService.updateCurrentUserCvProfile(state.profile.id, {
        profileName,
        public: state.profile.public !== false,
        template: state.profile.template,
        jobs: state.profile.jobs ?? [],
        projects: state.profile.projects ?? [],
        skills: state.profile.skills ?? [],
        degrees: state.profile.degrees ?? [],
        achievements: state.profile.achievements ?? [],
        hobbies: state.profile.hobbies ?? [],
      });

      if (this.selectedProfilePicture() || this.selectedCoverPicture()) {
        await this.pocketBaseService.updateCurrentUserCvProfilePictures(state.profile.id, {
          profilePicture: this.selectedProfilePicture(),
          coverPicture: this.selectedCoverPicture(),
        });
        this.selectedProfilePicture.set(null);
        this.selectedCoverPicture.set(null);
      }

      await this.loadEditorData(state.profile.id);
      this.successMessage.set('Profil enregistre.');
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  addRelation(type: RelationType, recordId: string): void {
    this.editorState.update((state) => {
      if (!state) {
        return state;
      }

      const currentIds = state.profile[type] ?? [];
      if (currentIds.includes(recordId)) {
        return state;
      }

      return {
        ...state,
        profile: {
          ...state.profile,
          [type]: [...currentIds, recordId],
        },
      };
    });
  }

  removeRelation(type: RelationType, recordId: string): void {
    this.editorState.update((state) => {
      if (!state) {
        return state;
      }

      return {
        ...state,
        profile: {
          ...state.profile,
          [type]: (state.profile[type] ?? []).filter((id) => id !== recordId),
        },
      };
    });
  }

  getLinkedJobs(state: EditorState): Job[] {
    return this.getLinkedRecords(state.availableJobs, state.profile.jobs);
  }

  getAvailableJobs(state: EditorState): Job[] {
    return this.getUnlinkedRecords(state.availableJobs, state.profile.jobs);
  }

  getLinkedProjects(state: EditorState): Project[] {
    return this.getLinkedRecords(state.availableProjects, state.profile.projects);
  }

  getAvailableProjects(state: EditorState): Project[] {
    return this.getUnlinkedRecords(state.availableProjects, state.profile.projects);
  }

  getLinkedSkills(state: EditorState): Skill[] {
    return this.getLinkedRecords(state.availableSkills, state.profile.skills);
  }

  getAvailableSkills(state: EditorState): Skill[] {
    return this.getUnlinkedRecords(state.availableSkills, state.profile.skills);
  }

  getLinkedDegrees(state: EditorState): Degree[] {
    return this.getLinkedRecords(state.availableDegrees, state.profile.degrees);
  }

  getAvailableDegrees(state: EditorState): Degree[] {
    return this.getUnlinkedRecords(state.availableDegrees, state.profile.degrees);
  }

  getLinkedAchievements(state: EditorState): Achievement[] {
    return this.getLinkedRecords(state.availableAchievements, state.profile.achievements);
  }

  getAvailableAchievements(state: EditorState): Achievement[] {
    return this.getUnlinkedRecords(state.availableAchievements, state.profile.achievements);
  }

  getLinkedHobbies(state: EditorState): Hobby[] {
    return this.getLinkedRecords(state.availableHobbies, state.profile.hobbies);
  }

  getAvailableHobbies(state: EditorState): Hobby[] {
    return this.getUnlinkedRecords(state.availableHobbies, state.profile.hobbies);
  }

  private async loadEditorData(profileId: string): Promise<void> {
    const currentRequestId = ++this.requestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const data = await this.pocketBaseService.getCurrentUserCvProfileEditorData(profileId);

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.editorState.set(this.toEditorState(data));
    } catch (error: unknown) {
      if (currentRequestId !== this.requestId) {
        return;
      }

      this.editorState.set(null);
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      if (currentRequestId === this.requestId) {
        this.isLoading.set(false);
      }
    }
  }

  private toEditorState(data: CurrentUserCvProfileEditorData): EditorState {
    return {
      profile: {
        ...data.profile,
        jobs: [...(data.profile.jobs ?? [])],
        projects: [...(data.profile.projects ?? [])],
        skills: [...(data.profile.skills ?? [])],
        degrees: [...(data.profile.degrees ?? [])],
        achievements: [...(data.profile.achievements ?? [])],
        hobbies: [...(data.profile.hobbies ?? [])],
      },
      availableJobs: data.availableJobs,
      availableProjects: data.availableProjects,
      availableSkills: data.availableSkills,
      availableDegrees: data.availableDegrees,
      availableAchievements: data.availableAchievements,
      availableHobbies: data.availableHobbies,
    };
  }

  private getLinkedRecords<T extends { id: string }>(records: T[], selectedIds: string[] | undefined): T[] {
    const selectedIdSet = new Set(selectedIds ?? []);
    return records.filter((record) => selectedIdSet.has(record.id));
  }

  private getUnlinkedRecords<T extends { id: string }>(records: T[], selectedIds: string[] | undefined): T[] {
    const selectedIdSet = new Set(selectedIds ?? []);
    return records.filter((record) => !selectedIdSet.has(record.id));
  }
}
