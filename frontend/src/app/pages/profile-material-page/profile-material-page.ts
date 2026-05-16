import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Job } from '../../core/models/job.model';
import { Skill } from '../../core/models/skill.model';
import { PocketBaseService, SaveCurrentUserJobInput, SaveCurrentUserSkillInput } from '../../core/services/pocketbase.service';
import { getErrorMessage } from '../../core/utils/error-message';

type JobForm = Omit<SaveCurrentUserJobInput, 'sortOrder'> & { id?: string; sortOrder: number | null };
type SkillForm = Omit<SaveCurrentUserSkillInput, 'level' | 'sortOrder'> & { id?: string; level: number | null; sortOrder: number | null };

const EMPTY_JOB_FORM: JobForm = {
  label: '',
  company: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  responsibilities: '',
  sortOrder: null,
  type: 'work project',
};

const EMPTY_SKILL_FORM: SkillForm = {
  name: '',
  category: '',
  type: 'Technical',
  level: null,
  sortOrder: null,
};

@Component({
  selector: 'app-profile-material-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile-material-page.html',
  styleUrl: './profile-material-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMaterialPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);

  readonly jobs = signal<Job[]>([]);
  readonly skills = signal<Skill[]>([]);
  readonly jobForm = signal<JobForm>({ ...EMPTY_JOB_FORM });
  readonly skillForm = signal<SkillForm>({ ...EMPTY_SKILL_FORM });
  readonly isLoading = signal(true);
  readonly isSavingJob = signal(false);
  readonly isSavingSkill = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadMaterial();
  }

  editJob(job: Job): void {
    this.jobForm.set({
      id: job.id,
      label: job.label,
      company: job.company,
      position: job.position,
      location: job.location ?? '',
      startDate: job.startDate?.slice(0, 10) ?? '',
      endDate: job.endDate?.slice(0, 10) ?? '',
      responsibilities: job.responsibilities ?? '',
      sortOrder: job.sortOrder ?? null,
      type: job.type,
    });
  }

  resetJobForm(): void {
    this.jobForm.set({ ...EMPTY_JOB_FORM });
  }

  setJobSortOrder(value: string | number | null): void {
    const sortOrder = value === null || value === '' ? null : Number(value);
    this.jobForm.update((form) => ({ ...form, sortOrder: Number.isFinite(sortOrder) ? sortOrder : null }));
  }

  async saveJob(): Promise<void> {
    const form = this.jobForm();
    const input: SaveCurrentUserJobInput = {
      label: form.label.trim(),
      company: form.company.trim(),
      position: form.position.trim(),
      startDate: form.startDate,
      type: form.type,
      location: form.location?.trim() || undefined,
      endDate: form.endDate || undefined,
      responsibilities: form.responsibilities?.trim() || undefined,
      sortOrder: form.sortOrder ?? undefined,
    };

    if (!input.label || !input.company || !input.position || !input.startDate || !input.type) {
      this.errorMessage.set('Label, entreprise, poste, date de debut et type sont obligatoires pour une experience.');
      return;
    }

    this.isSavingJob.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      form.id ? await this.pocketBaseService.updateCurrentUserJob(form.id, input) : await this.pocketBaseService.createCurrentUserJob(input);
      this.resetJobForm();
      await this.loadMaterial(false);
      this.successMessage.set(form.id ? 'Experience mise a jour.' : 'Experience ajoutee.');
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSavingJob.set(false);
    }
  }

  editSkill(skill: Skill): void {
    this.skillForm.set({
      id: skill.id,
      name: skill.name,
      category: skill.category ?? '',
      type: skill.type ?? 'Technical',
      level: skill.level ?? null,
      sortOrder: skill.sortOrder ?? null,
    });
  }

  resetSkillForm(): void {
    this.skillForm.set({ ...EMPTY_SKILL_FORM });
  }

  setSkillLevel(value: string | number | null): void {
    const level = value === null || value === '' ? null : Number(value);
    this.skillForm.update((form) => ({ ...form, level: Number.isFinite(level) ? level : null }));
  }

  setSkillSortOrder(value: string | number | null): void {
    const sortOrder = value === null || value === '' ? null : Number(value);
    this.skillForm.update((form) => ({ ...form, sortOrder: Number.isFinite(sortOrder) ? sortOrder : null }));
  }

  async saveSkill(): Promise<void> {
    const form = this.skillForm();
    const input: SaveCurrentUserSkillInput = {
      name: form.name.trim(),
      category: form.category?.trim() || undefined,
      type: form.type?.trim() || undefined,
      level: form.level ?? undefined,
      sortOrder: form.sortOrder ?? undefined,
    };

    if (!input.name) {
      this.errorMessage.set('Le nom de la competence est obligatoire.');
      return;
    }

    this.isSavingSkill.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      form.id ? await this.pocketBaseService.updateCurrentUserSkill(form.id, input) : await this.pocketBaseService.createCurrentUserSkill(input);
      this.resetSkillForm();
      await this.loadMaterial(false);
      this.successMessage.set(form.id ? 'Competence mise a jour.' : 'Competence ajoutee.');
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSavingSkill.set(false);
    }
  }

  private async loadMaterial(showLoading = true): Promise<void> {
    if (showLoading) {
      this.isLoading.set(true);
    }

    this.errorMessage.set(null);

    try {
      const data = await this.pocketBaseService.getCurrentUserProfileMaterialData();
      this.jobs.set(data.jobs);
      this.skills.set(data.skills);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      if (showLoading) {
        this.isLoading.set(false);
      }
    }
  }
}
