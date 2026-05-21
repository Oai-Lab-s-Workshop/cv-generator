import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { Job } from '../../core/models/job.model';
import { Project } from '../../core/models/project.model';
import { Skill } from '../../core/models/skill.model';
import { Achievement } from '../../core/models/achievement.model';
import { Degree } from '../../core/models/degree.model';
import { Hobby } from '../../core/models/hobby.model';
import { MediaFile } from '../../core/models/file.model';
import { SkillCategory } from '../../core/models/skill-category.model';

import { ProfileMaterialPage } from './profile-material-page';

const mockUser = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

const mockMaterialData = {
  jobs: [
    { id: 'job-1', label: 'Dev Lead', company: 'Acme', position: 'Lead Developer', startDate: '2023-01-01', type: 'work project' } as Job,
  ],
  skills: [
    { id: 'skill-1', name: 'Angular', type: 'Technical' } as Skill,
  ],
  skillCategories: [
    { id: 'cat-1', name: 'Frontend' } as SkillCategory,
  ],
  projects: [
    { id: 'proj-1', name: 'My Project', type: 'work project', date: '2024-01-01' } as Project,
  ],
  achievements: [
    { id: 'ach-1', title: 'Increased performance by 50%' } as Achievement,
  ],
  degrees: [
    { id: 'deg-1', title: 'Master CS', school: 'University', year: '2020' } as Degree,
  ],
  hobbies: [
    { id: 'hob-1', name: 'Chess' } as Hobby,
  ],
  files: [
    { id: 'file-1', name: 'logo.png', kind: 'image', file: '/files/logo.png' } as MediaFile,
  ],
};

const emptyMaterialData = {
  jobs: [],
  skills: [],
  skillCategories: [],
  projects: [],
  achievements: [],
  degrees: [],
  hobbies: [],
  files: [],
};

class AuthServiceStub {
  readonly currentUser = signal(mockUser);
  readonly isAuthenticated = computed(() => true);
  getCurrentUserId = () => 'user-1';
}

class PocketBaseServiceStub {
  getCurrentUserProfileMaterialData = jest.fn().mockResolvedValue(mockMaterialData);
  createCurrentUserJob = jest.fn().mockResolvedValue({
    id: 'job-new',
    label: 'New Job',
    company: 'NewCo',
    position: 'Developer',
    startDate: '2024-06-01',
    type: 'work project',
  });
  updateCurrentUserJob = jest.fn().mockResolvedValue({});
  createCurrentUserProject = jest.fn().mockResolvedValue({});
  updateCurrentUserProject = jest.fn().mockResolvedValue({});
  createCurrentUserSkill = jest.fn().mockResolvedValue({});
  updateCurrentUserSkill = jest.fn().mockResolvedValue({});
  createCurrentUserAchievement = jest.fn().mockResolvedValue({});
  updateCurrentUserAchievement = jest.fn().mockResolvedValue({});
  createCurrentUserDegree = jest.fn().mockResolvedValue({});
  updateCurrentUserDegree = jest.fn().mockResolvedValue({});
  createCurrentUserHobby = jest.fn().mockResolvedValue({});
  updateCurrentUserHobby = jest.fn().mockResolvedValue({});
  createCurrentUserFile = jest.fn().mockResolvedValue({});
  updateCurrentUserFile = jest.fn().mockResolvedValue({});
  createCurrentUserSkillCategory = jest.fn().mockResolvedValue({ id: 'cat-new', name: 'New Cat' });
  updateCurrentUserSortOrders = jest.fn().mockResolvedValue(undefined);
}

describe('ProfileMaterialPage', () => {
  let component: ProfileMaterialPage;
  let fixture: ComponentFixture<ProfileMaterialPage>;
  let pocketBaseService: PocketBaseServiceStub;

  function configureTest(materialData = mockMaterialData): void {
    const stub = new PocketBaseServiceStub();
    stub.getCurrentUserProfileMaterialData.mockResolvedValue(materialData);

    TestBed.configureTestingModule({
      imports: [ProfileMaterialPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: PocketBaseService, useValue: stub },
      ],
    });

    pocketBaseService = TestBed.inject(PocketBaseService) as unknown as PocketBaseServiceStub;
  }

  beforeEach(async () => {
    configureTest();
    await TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ProfileMaterialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders 7 tab buttons', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.material-tab');
    expect(tabs.length).toBe(7);
  });

  it('shows help FAB', () => {
    const fab = fixture.nativeElement.querySelector('app-help-fab');
    expect(fab).toBeTruthy();
  });

  it('shows help modal when FAB is clicked', () => {
    const fab = fixture.nativeElement.querySelector('app-help-fab');
    fab.dispatchEvent(new CustomEvent('open'));
    fixture.detectChanges();
    expect(component.showHelpModal()).toBe(true);
  });

  it('closes help modal on Escape key', () => {
    component.showHelpModal.set(true);
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(component.showHelpModal()).toBe(false);
  });

  it('shows empty state when collections are empty', async () => {
    pocketBaseService.getCurrentUserProfileMaterialData.mockResolvedValue(emptyMaterialData);
    await component['loadMaterial']();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('displays material count in insight grid', () => {
    const countEl = fixture.nativeElement.querySelector('.insight-card strong');
    expect(countEl).toBeTruthy();
  });

  it('switches active section when tab is clicked', () => {
    const skillsTab = fixture.nativeElement.querySelector('#skills-tab');
    skillsTab.click();
    fixture.detectChanges();
    expect(component.isActiveSection('skills')).toBe(true);
    expect(component.activeSection()).toBe('skills');
  });

  it('adds a job via form submission', async () => {
    component.setActiveSection('jobs');
    fixture.detectChanges();

    component.setJobFormValue('label', 'New Job');
    component.setJobFormValue('company', 'NewCo');
    component.setJobFormValue('position', 'Developer');
    component.setJobFormValue('startDate', '2024-06-01');
    fixture.detectChanges();

    await component.saveJob();
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserJob).toHaveBeenCalled();
  });

  it('prevents job save when required fields are empty', async () => {
    component.setActiveSection('jobs');
    fixture.detectChanges();

    component.jobForm.set({
      ...component.jobForm(),
      label: '',
      company: '',
      position: '',
      startDate: '',
    });
    fixture.detectChanges();

    await component.saveJob();

    expect(pocketBaseService.createCurrentUserJob).not.toHaveBeenCalled();
  });

  it('shows inline validation errors after submit with empty required fields', async () => {
    component.setActiveSection('jobs');
    fixture.detectChanges();

    component.jobFormSubmitted.set(true);
    fixture.detectChanges();

    expect(component.isJobFieldInvalid('label')).toBe(true);
    expect(component.isJobFieldInvalid('company')).toBe(true);
    expect(component.isJobFieldInvalid('position')).toBe(true);
    expect(component.isJobFieldInvalid('startDate')).toBe(true);
  });

  it('edits an existing job when clicked', () => {
    component.editJob(component.jobs()[0]);
    fixture.detectChanges();

    expect(component.jobForm().id).toBe('job-1');
    expect(component.jobForm().company).toBe('Acme');
  });

  it('resets job form', () => {
    component.jobForm.set({ ...component.jobForm(), id: 'job-1', label: 'Edited' });
    component.resetJobForm();
    expect(component.jobForm().id).toBeUndefined();
    expect(component.jobForm().label).toBe('');
  });

  it('reorders jobs and marks section dirty', () => {
    const reordered = [...component.jobs()].reverse();
    component.onReorderJobs(reordered);
    expect(component.sectionOrderDirty().jobs).toBe(true);
  });

  it('saves reordered items via batch update', async () => {
    component.onReorderJobs([{ ...component.jobs()[0], sortOrder: 1 }]);
    fixture.detectChanges();

    await component.onUpdateOrder('jobs');
    fixture.detectChanges();

    expect(pocketBaseService.updateCurrentUserSortOrders).toHaveBeenCalledWith('jobs', expect.any(Array));
    expect(component.sectionOrderDirty().jobs).toBe(false);
  });

  it('shows error state when API fails', async () => {
    pocketBaseService.getCurrentUserProfileMaterialData.mockRejectedValue(new Error('Network error'));

    await component['loadMaterial']();
    fixture.detectChanges();

    expect(component.errorMessage()).toBeTruthy();
  });

  it('validates project URL format', () => {
    component.setActiveSection('projects');
    fixture.detectChanges();

    component.setProjectFormValue('url', 'not-a-url');
    component.projectFormSubmitted.set(true);
    fixture.detectChanges();

    expect(component.isProjectUrlInvalid()).toBe(true);
  });

  it('accepts valid project URL', () => {
    component.setActiveSection('projects');
    fixture.detectChanges();

    component.setProjectFormValue('url', 'https://example.com');
    component.projectFormSubmitted.set(true);
    fixture.detectChanges();

    expect(component.isProjectUrlInvalid()).toBe(false);
  });

  it('adds a project with achievements', async () => {
    component.setActiveSection('projects');
    fixture.detectChanges();

    component.setProjectFormValue('name', 'Test Project');
    component.projectForm.update((f) => ({ ...f, achievements: ['ach-1'] }));
    fixture.detectChanges();

    await component.saveProject();
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserProject).toHaveBeenCalled();
  });

  it('creates and links a new achievement from picker', async () => {
    component.setActiveSection('projects');
    fixture.detectChanges();

    await component.onProjectAchievementCreate('New Achievement');
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserAchievement).toHaveBeenCalledWith({ title: 'New Achievement' });
  });

  it('creates and selects a skill category from picker', async () => {
    component.setActiveSection('skills');
    fixture.detectChanges();

    await component.onSkillCategoryCreate('Backend');
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserSkillCategory).toHaveBeenCalledWith('Backend');
  });

  it('adds a skill', async () => {
    component.setActiveSection('skills');
    fixture.detectChanges();

    component.setSkillFormValue('name', 'TypeScript');
    fixture.detectChanges();

    await component.saveSkill();
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserSkill).toHaveBeenCalled();
  });

  it('adds an achievement', async () => {
    component.setActiveSection('achievements');
    fixture.detectChanges();

    component.setAchievementFormValue('title', 'New Achievement');
    fixture.detectChanges();

    await component.saveAchievement();
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserAchievement).toHaveBeenCalled();
  });

  it('adds a degree', async () => {
    component.setActiveSection('degrees');
    fixture.detectChanges();

    component.setDegreeFormValue('title', 'PhD');
    fixture.detectChanges();

    await component.saveDegree();
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserDegree).toHaveBeenCalled();
  });

  it('adds a hobby', async () => {
    component.setActiveSection('hobbies');
    fixture.detectChanges();

    component.setHobbyFormValue('name', 'Guitar');
    fixture.detectChanges();

    await component.saveHobby();
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserHobby).toHaveBeenCalled();
  });

  it('computes total material count correctly', () => {
    const count = component.totalMaterialCount();
    expect(count).toBe(7);
  });

  it('gets correct section counts', () => {
    expect(component.getMaterialSectionCount('jobs')).toBe(1);
    expect(component.getMaterialSectionCount('skills')).toBe(1);
    expect(component.getMaterialSectionCount('projects')).toBe(1);
    expect(component.getMaterialSectionCount('achievements')).toBe(1);
    expect(component.getMaterialSectionCount('degrees')).toBe(1);
    expect(component.getMaterialSectionCount('hobbies')).toBe(1);
    expect(component.getMaterialSectionCount('assets')).toBe(1);
  });

  it('selects project asset via picker', () => {
    component.onProjectAssetSelectionChange(['file-1']);
    fixture.detectChanges();
    expect(component.projectForm().file).toBe('file-1');
  });

  it('selects skill category via picker', () => {
    component.onSkillCategorySelectionChange(['cat-1']);
    fixture.detectChanges();
    expect(component.skillForm().category).toBe('cat-1');
  });

  it('clears skill category', () => {
    component.skillForm.update((f) => ({ ...f, category: 'cat-1' }));
    component.clearSkillCategory();
    expect(component.skillForm().category).toBe('');
  });

  it('shows editing pill when editing an item', () => {
    component.editJob(component.jobs()[0]);
    fixture.detectChanges();

    const editingPill = fixture.nativeElement.querySelector('.editing-pill');
    expect(editingPill).toBeTruthy();
  });

  it('resets project form clears achievements', () => {
    component.projectForm.update((f) => ({ ...f, achievements: ['ach-1'] }));
    component.resetProjectForm();
    expect(component.projectForm().achievements).toEqual([]);
  });

  it('resets asset form clears selected file', () => {
    component.selectedAssetFile.set(new File([], 'test.png'));
    component.resetAssetForm();
    expect(component.selectedAssetFile()).toBeNull();
  });

  it('normalizes HTML editor value with only br tag', () => {
    const result = component['normalizeHtmlEditorValue']('<br>');
    expect(result).toBeUndefined();
  });

  it('normalizes HTML editor value with whitespace only', () => {
    const result = component['normalizeHtmlEditorValue']('   ');
    expect(result).toBeUndefined();
  });

  it('preserves HTML editor value with real content', () => {
    const result = component['normalizeHtmlEditorValue']('<p>Some text</p>');
    expect(result).toBe('<p>Some text</p>');
  });

  it('preserves HTML editor value with media', () => {
    const result = component['normalizeHtmlEditorValue']('<img src="test.png">');
    expect(result).toBe('<img src="test.png">');
  });

  it('matches fuzzy query on empty query', () => {
    expect(component['matchesFuzzyQuery'](['test'], '')).toBe(true);
  });

  it('matches fuzzy query on partial match', () => {
    expect(component['matchesFuzzyQuery'](['Angular'], 'ang')).toBe(true);
  });

  it('does not match fuzzy query on no match', () => {
    expect(component['matchesFuzzyQuery'](['Angular'], 'xyz')).toBe(false);
  });

  it('detects subsequence match', () => {
    expect(component['isSubsequence']('ang', 'angular')).toBe(true);
  });

  it('detects non-subsequence', () => {
    expect(component['isSubsequence']('zxy', 'angular')).toBe(false);
  });

  it('converts string to nullable number', () => {
    expect(component['toNullableNumber']('42')).toBe(42);
    expect(component['toNullableNumber']('')).toBeNull();
    expect(component['toNullableNumber'](null)).toBeNull();
    expect(component['toNullableNumber']('abc')).toBeNull();
  });

  it('optionalText returns undefined for empty string', () => {
    expect(component['optionalText']('')).toBeUndefined();
    expect(component['optionalText']('   ')).toBeUndefined();
  });

  it('optionalText returns trimmed text', () => {
    expect(component['optionalText']('  hello  ')).toBe('hello');
  });

  it('shows success message after save', async () => {
    component.setActiveSection('jobs');
    fixture.detectChanges();

    component.setJobFormValue('label', 'Success Job');
    component.setJobFormValue('company', 'SuccessCo');
    component.setJobFormValue('position', 'Dev');
    component.setJobFormValue('startDate', '2024-01-01');
    fixture.detectChanges();

    await component.saveJob();
    fixture.detectChanges();

    expect(component.successMessage()).toBeTruthy();
  });

  it('shows saving state during save', () => {
    expect(component.isSaving('jobs')).toBe(false);
  });

  it('updates persisted snapshot after reorder save', async () => {
    const jobs = component.jobs();
    component.onReorderJobs(jobs);
    fixture.detectChanges();

    await component.onUpdateOrder('jobs');
    fixture.detectChanges();

    expect(component.persistedJobs()).toEqual(component.jobs());
  });
});
