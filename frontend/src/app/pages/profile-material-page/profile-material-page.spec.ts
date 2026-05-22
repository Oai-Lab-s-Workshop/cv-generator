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

  // --- Save error path ---
  it('handles save failure gracefully', async () => {
    component.setActiveSection('hobbies');
    fixture.detectChanges();
    component.setHobbyFormValue('name', 'FailHobby');
    fixture.detectChanges();

    pocketBaseService.createCurrentUserHobby.mockRejectedValue(new Error('Server error'));
    await component.saveHobby();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Server error');
  });

  it('handles reorder save failure', async () => {
    pocketBaseService.updateCurrentUserSortOrders.mockRejectedValue(new Error('Reorder failed'));
    await component.onUpdateOrder('jobs');
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Reorder failed');
  });

  // --- Personal info ---
  it('saves personal info successfully', async () => {
    const authSvc = component['authService'] as unknown as { refreshCurrentUser: jest.Mock };
    authSvc.refreshCurrentUser = jest.fn().mockResolvedValue(undefined);
    component.setPersonalInfoField('firstName', 'Jane');
    component.setPersonalInfoField('lastName', 'Doe');
    (pocketBaseService as unknown as Record<string, jest.Mock>)['updateCurrentUser'] =
      jest.fn().mockResolvedValue({ id: 'user-1' });
    await component.savePersonalInfo();
    fixture.detectChanges();
    expect(component.successMessage()).toBeTruthy();
    expect(authSvc.refreshCurrentUser).toHaveBeenCalled();
  });

  it('refuses personal info save when name is empty', async () => {
    component.personalInfoForm.set({ firstName: '', lastName: '' });
    await component.savePersonalInfo();
    expect(component.errorMessage()).toBe('Le prenom et le nom sont obligatoires.');
  });

  it('handles personal info save failure', async () => {
    const authSvc = component['authService'] as unknown as { refreshCurrentUser: jest.Mock };
    authSvc.refreshCurrentUser = jest.fn().mockResolvedValue(undefined);
    component.setPersonalInfoField('firstName', 'Jane');
    component.setPersonalInfoField('lastName', 'Doe');
    (pocketBaseService as unknown as Record<string, jest.Mock>)['updateCurrentUser'] =
      jest.fn().mockRejectedValue(new Error('Update failed'));

    const materialBackup = pocketBaseService.getCurrentUserProfileMaterialData;
    pocketBaseService.getCurrentUserProfileMaterialData = jest.fn().mockResolvedValue(mockMaterialData);

    await component.savePersonalInfo();
    expect(component.errorMessage()).toBe('Update failed');
    pocketBaseService.getCurrentUserProfileMaterialData = materialBackup;
  });

  it('loads personal info from current user', () => {
    component.personalInfoForm.set({});
    component.initPersonalInfoForm();
    expect(component.personalInfoForm().firstName).toBe('John');
  });

  // --- Validation helpers ---
  it('validates project field and URL for non-submitted state', () => {
    component.setActiveSection('projects');
    component.projectFormSubmitted.set(false);
    expect(component.isProjectFieldInvalid('name')).toBe(false);
    expect(component.isProjectUrlInvalid()).toBe(false);
  });

  it('validates skill field', () => {
    component.skillFormSubmitted.set(true);
    component.skillForm.set({ ...component.skillForm(), name: '' });
    expect(component.isSkillFieldInvalid('name')).toBe(true);
    component.skillForm.set({ ...component.skillForm(), name: 'TS' });
    expect(component.isSkillFieldInvalid('name')).toBe(false);
  });

  it('validates achievement field', () => {
    component.achievementFormSubmitted.set(true);
    expect(component.isAchievementFieldInvalid('title')).toBe(true);
    component.setAchievementFormValue('title', 'Win');
    expect(component.isAchievementFieldInvalid('title')).toBe(false);
  });

  it('validates degree field', () => {
    component.degreeFormSubmitted.set(true);
    expect(component.isDegreeFieldInvalid('title')).toBe(true);
  });

  it('validates hobby field', () => {
    component.hobbyFormSubmitted.set(true);
    expect(component.isHobbyFieldInvalid('name')).toBe(true);
  });

  // --- Skill category methods ---
  it('creates and selects skill category from query', async () => {
    pocketBaseService.createCurrentUserSkillCategory.mockResolvedValue({ id: 'cat-new', name: 'Backend' });
    component.skillCategoryQuery.set('Backend');
    await component.createAndSelectSkillCategory();
    expect(component.skillForm().category).toBe('cat-new');
  });

  it('creates standalone skill category', async () => {
    pocketBaseService.createCurrentUserSkillCategory.mockResolvedValue({ id: 'cat-standalone', name: 'DevOps' });
    component.newSkillCategoryName.set('DevOps');
    await component.createStandaloneSkillCategory();
    fixture.detectChanges();
    expect(component.newSkillCategoryName()).toBe('');
  });

  it('handles skill category creation failure', async () => {
    pocketBaseService.createCurrentUserSkillCategory.mockRejectedValue(new Error('Duplicate'));
    component.skillCategoryQuery.set('FailCat');
    await component.createAndSelectSkillCategory();
    expect(component.errorMessage()).toBe('Duplicate');
  });

  it('handles createAndSelectSkillCategory when already exists', async () => {
    component.skillCategories.set([{ id: 'cat-1', name: 'Frontend' }]);
    component.skillCategoryQuery.set('Frontend');
    await component.createAndSelectSkillCategory();
    expect(component.skillForm().category).toBe('cat-1');
    expect(pocketBaseService.createCurrentUserSkillCategory).not.toHaveBeenCalled();
  });

  it('selects and clears skill category', () => {
    component.selectSkillCategory('cat-1');
    expect(component.skillForm().category).toBe('cat-1');
    component.clearSkillCategory();
    expect(component.skillForm().category).toBe('');
  });

  it('sets skill category query and new name', () => {
    component.setSkillCategoryQuery('q');
    expect(component.skillCategoryQuery()).toBe('q');
    component.setNewSkillCategoryName('n');
    expect(component.newSkillCategoryName()).toBe('n');
  });

  // --- Project achievement methods ---
  it('toggles project achievement off', () => {
    component.projectForm.update((f) => ({ ...f, achievements: ['ach-1'] }));
    component.removeProjectAchievement('ach-1');
    expect(component.projectForm().achievements).toEqual([]);
  });

  it('toggles project achievement on via add', () => {
    component.projectForm.update((f) => ({ ...f, achievements: [] }));
    component.addProjectAchievement('ach-1');
    expect(component.projectForm().achievements).toEqual(['ach-1']);
  });

  it('creates and links project achievement from picker - existing match', async () => {
    component.achievements.set([{ id: 'ach-1', title: 'Existing' }]);
    await component.onProjectAchievementCreate('Existing');
    expect(component.projectForm().achievements).toContain('ach-1');
    expect(pocketBaseService.createCurrentUserAchievement).not.toHaveBeenCalled();
  });

  it('creates and links project achievement from picker - error', async () => {
    pocketBaseService.createCurrentUserAchievement.mockRejectedValue(new Error('Creation failed'));
    await component.onProjectAchievementCreate('FailAchievement');
    expect(component.errorMessage()).toBe('Creation failed');
  });

  it('createAndLinkProjectAchievement with empty title', async () => {
    component.projectAchievementQuery.set('');
    await component.createAndLinkProjectAchievement();
    expect(component.errorMessage()).toBe('Le titre de la realisation est obligatoire.');
  });

  it('createAndLinkProjectAchievement with existing achievement', async () => {
    component.achievements.set([{ id: 'ach-1', title: 'Fast' }]);
    component.projectAchievementQuery.set('Fast');
    await component.createAndLinkProjectAchievement();
    expect(component.projectForm().achievements).toContain('ach-1');
  });

  it('createAndLinkProjectAchievement error path', async () => {
    pocketBaseService.createCurrentUserAchievement.mockRejectedValue(new Error('Create failed'));
    component.projectAchievementQuery.set('UniqueNew');
    await component.createAndLinkProjectAchievement();
    expect(component.errorMessage()).toBe('Create failed');
    expect(component.creatingProjectAchievement()).toBe(false);
  });

  it('sets project achievement query', () => {
    component.setProjectAchievementQuery('search');
    expect(component.projectAchievementQuery()).toBe('search');
  });

  // --- onSkillCategoryCreate existing match ---
  it('onSkillCategoryCreate with existing category', async () => {
    component.skillCategories.set([{ id: 'cat-1', name: 'Frontend' }]);
    await component.onSkillCategoryCreate('Frontend');
    expect(component.skillForm().category).toBe('cat-1');
  });

  // --- Save jobs in update mode ---
  it('updates an existing job via save', async () => {
    component.editJob(component.jobs()[0]);
    fixture.detectChanges();
    await component.saveJob();
    expect(pocketBaseService.updateCurrentUserJob).toHaveBeenCalled();
  });

  it('updates an existing achievement', async () => {
    component.editAchievement(component.achievements()[0]);
    fixture.detectChanges();
    await component.saveAchievement();
    expect(pocketBaseService.updateCurrentUserAchievement).toHaveBeenCalled();
  });

  it('refuses achievement save without title', async () => {
    component.setActiveSection('achievements');
    component.achievementForm.set({ ...component.achievementForm(), title: '' });
    await component.saveAchievement();
    expect(pocketBaseService.createCurrentUserAchievement).not.toHaveBeenCalled();
  });

  // --- Edit degree, hobby, asset ---
  it('edits a degree and resets form', () => {
    component.degrees.set([{ id: 'deg-2', title: 'PhD CS', school: 'MIT', year: '2022', level: 'Doctorate' }]);
    component.editDegree(component.degrees()[0]);
    expect(component.degreeForm().id).toBe('deg-2');
    component.resetDegreeForm();
    expect(component.degreeForm().id).toBeUndefined();
  });

  it('edits a hobby and resets form', () => {
    component.hobbies.set([{ id: 'hob-2', name: 'Reading', description: 'Fiction' }]);
    component.editHobby(component.hobbies()[0]);
    expect(component.hobbyForm().id).toBe('hob-2');
    component.resetHobbyForm();
    expect(component.hobbyForm().id).toBeUndefined();
  });

  it('edits an asset and resets form', () => {
    component.editAsset(component.assets()[0]);
    expect(component.assetForm().id).toBe('file-1');
    component.resetAssetForm();
    expect(component.assetForm().id).toBeUndefined();
    expect(component.selectedAssetFile()).toBeNull();
  });

  it('sets asset form value', () => {
    component.setAssetFormValue('name', 'new-asset');
    expect(component.assetForm().name).toBe('new-asset');
  });

  it('handles asset file selection', () => {
    const file = new File([], 'upload.png');
    const event = { target: { files: [file] } } as unknown as Event;
    component.onAssetFileSelected(event);
    expect(component.selectedAssetFile()).toBe(file);
  });

  it('onAssetFileSelected with no files', () => {
    const event = { target: { files: null } } as unknown as Event;
    component.onAssetFileSelected(event);
    expect(component.selectedAssetFile()).toBeNull();
  });

  it('saves asset with file (create)', async () => {
    component.setActiveSection('assets');
    component.setAssetFormValue('name', 'New Asset');
    component.selectedAssetFile.set(new File([], 'test.png'));
    fixture.detectChanges();
    await component.saveAsset();
    expect(pocketBaseService.createCurrentUserFile).toHaveBeenCalled();
  });

  it('saves asset without file in update mode', async () => {
    component.editAsset(component.assets()[0]);
    await component.saveAsset();
    expect(pocketBaseService.updateCurrentUserFile).toHaveBeenCalled();
  });

  it('refuses asset save without file in create mode', async () => {
    component.setActiveSection('assets');
    component.assetFormSubmitted.set(false);
    component.assetForm.set({ ...component.assetForm(), id: undefined });
    component.selectedAssetFile.set(null);
    await component.saveAsset();
    expect(pocketBaseService.createCurrentUserFile).not.toHaveBeenCalled();
  });

  // --- Edit project ---
  it('edits a project', () => {
    component.editProject(component.projects()[0]);
    expect(component.projectForm().id).toBe('proj-1');
    expect(component.projectForm().name).toBe('My Project');
    expect(component.selectedProjectPicture()).toBeNull();
    expect(component.projectAchievementQuery()).toBe('');
  });

  it('handles project picture selection', () => {
    const file = new File([], 'pic.png');
    const event = { target: { files: [file] } } as unknown as Event;
    component.onProjectPictureSelected(event);
    expect(component.selectedProjectPicture()).toBe(file);
  });

  // --- Reorder other sections ---
  it('reorders projects and saves', async () => {
    component.onReorderProjects([...component.projects()]);
    expect(component.sectionOrderDirty().projects).toBe(true);
    await component.onUpdateOrder('projects');
    expect(component.sectionOrderDirty().projects).toBe(false);
  });

  it('reorders skills and saves', async () => {
    component.onReorderSkills([...component.skills()]);
    expect(component.sectionOrderDirty().skills).toBe(true);
    await component.onUpdateOrder('skills');
    expect(component.sectionOrderDirty().skills).toBe(false);
  });

  it('reorders achievements, degrees, hobbies, assets', () => {
    component.onReorderAchievements([...component.achievements()]);
    component.onReorderDegrees([...component.degrees()]);
    component.onReorderHobbies([...component.hobbies()]);
    component.onReorderAssets([...component.assets()]);
    expect(component.sectionOrderDirty().achievements).toBe(true);
    expect(component.sectionOrderDirty().degrees).toBe(true);
    expect(component.sectionOrderDirty().hobbies).toBe(true);
    expect(component.sectionOrderDirty().assets).toBe(true);
  });

  // --- Set skill level ---
  it('sets skill level', () => {
    component.setSkillLevel('5');
    expect(component.skillForm().level).toBe(5);
  });

  // --- Project achievement deselection ---
  it('deselects project achievements from picker', () => {
    component.projectForm.update((f) => ({ ...f, achievements: ['ach-1'] }));
    component.onProjectAchievementSelectionChange(['ach-2']);
    expect(component.projectForm().achievements).toEqual(['ach-2']);
  });

  // --- isSaving ---
  it('reports isSaving for active section', () => {
    component['savingSection'].set('jobs');
    expect(component.isSaving('jobs')).toBe(true);
    expect(component.isSaving('skills')).toBe(false);
  });

  // --- Update persisted snapshot ---
  it('updates persisted snapshot for all sections', () => {
    component['updatePersistedSnapshot']('projects');
    component['updatePersistedSnapshot']('skills');
    component['updatePersistedSnapshot']('achievements');
    component['updatePersistedSnapshot']('degrees');
    component['updatePersistedSnapshot']('hobbies');
    component['updatePersistedSnapshot']('assets');
    // If no errors, all branches exercised
  });

  // --- Computed properties ---
  it('computes selectedProjectAchievements', () => {
    component.projectForm.update((f) => ({ ...f, achievements: ['ach-1'] }));
    component.achievements.set([{ id: 'ach-1', title: 'Won' }, { id: 'ach-2', title: 'Lost' }]);
    const selected = component.selectedProjectAchievements();
    expect(selected.length).toBe(1);
    expect(selected[0].title).toBe('Won');
  });

  it('computes filteredAvailableProjectAchievements with query', () => {
    component.achievements.set([{ id: 'ach-1', title: 'Angular project' }, { id: 'ach-2', title: 'React app' }]);
    component.projectForm.update((f) => ({ ...f, achievements: ['ach-1'] }));
    component.projectAchievementQuery.set('angular');
    const filtered = component.filteredAvailableProjectAchievements();
    // ach-1 should be excluded (already selected)
    expect(filtered.length).toBe(0);
  });

  it('computes canCreateProjectAchievement when creating', () => {
    component.projectAchievementQuery.set('New');
    component.creatingProjectAchievement.set(true);
    expect(component.canCreateProjectAchievement()).toBe(false);
  });

  it('computes selectedSkillCategory when not found', () => {
    component.skillForm.update((f) => ({ ...f, category: 'unknown' }));
    expect(component.selectedSkillCategory()).toBeUndefined();
  });

  it('computes filteredSkillCategories with query excluding selected', () => {
    component.skillCategories.set([{ id: 'cat-1', name: 'Frontend' }, { id: 'cat-2', name: 'Backend' }]);
    component.skillForm.update((f) => ({ ...f, category: 'cat-1' }));
    component.skillCategoryQuery.set('back');
    const filtered = component.filteredSkillCategories();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Backend');
  });

  it('computes canCreateStandaloneSkillCategory false when empty', () => {
    component.newSkillCategoryName.set('');
    expect(component.canCreateStandaloneSkillCategory()).toBe(false);
  });

  it('computes canCreateSkillCategoryFromQuery', () => {
    component.skillCategoryQuery.set('NewCat');
    component.creatingSkillCategory.set(false);
    expect(component.canCreateSkillCategoryFromQuery()).toBe(true);
  });

  it('computes picker items', () => {
    expect(component.projectAchievementPickerItems().length).toBe(1);
    expect(component.skillCategoryPickerItems().length).toBe(1);
    expect(component.assetPickerItems().length).toBe(1);
  });

  it('computes selectedProjectFileIds and selectedSkillCategoryIds empty', () => {
    component.projectForm.update((f) => ({ ...f, file: '' }));
    component.skillForm.update((f) => ({ ...f, category: '' }));
    expect(component.selectedProjectFileIds()).toEqual([]);
    expect(component.selectedSkillCategoryIds()).toEqual([]);
  });

  it('computes currentUserName when user is null', () => {
    const auth = component['authService'] as unknown as { currentUser: ReturnType<typeof signal> };
    const original = auth.currentUser();
    auth.currentUser.set(null as never);
    expect(component.currentUserName()).toBe('Utilisateur authentifie');
    auth.currentUser.set(original);
  });

  // --- scrollToSection (no-op in test) ---
  it('calls scrollToSection without crashing', () => {
    expect(() => component['scrollToSection']('test-section', 'input[name="test"]')).not.toThrow();
  });

  // --- isSubsequence edge cases ---
  it('detects subsequence at end of value', () => {
    expect(component['isSubsequence']('lar', 'angular')).toBe(true);
  });

  it('detects non-subsequence with partial match', () => {
    expect(component['isSubsequence']('abe', 'abc')).toBe(false);
  });

  // --- matchesFuzzyQuery with subsequence ---
  it('matches fuzzy query via subsequence', () => {
    expect(component['matchesFuzzyQuery'](['Frontend Developer'], 'fd')).toBe(true);
  });

  // --- normalizeHtmlEditorValue undefined input ---
  it('normalizes undefined HTML editor value', () => {
    expect(component['normalizeHtmlEditorValue'](undefined)).toBeUndefined();
  });

  it('normalizes HTML with non-breaking spaces only', () => {
    expect(component['normalizeHtmlEditorValue']('\u00a0\u00a0')).toBeUndefined();
  });

  // --- toNullableNumber edge cases ---
  it('converts non-finite to null', () => {
    expect(component['toNullableNumber'](Number.POSITIVE_INFINITY)).toBeNull();
  });

  // --- canCreateSkillCategory edge cases ---
  it('canCreateSkillCategory false when creating', () => {
    component.creatingSkillCategory.set(true);
    expect(component['canCreateSkillCategory']('New')).toBe(false);
  });

  it('canCreateSkillCategory false when duplicate', () => {
    component.skillCategories.set([{ id: 'cat-1', name: 'Frontend' }]);
    expect(component['canCreateSkillCategory']('frontend')).toBe(false);
  });

  // --- Save section error handling ---
  it('shows error when saveSection operation fails', async () => {
    // Override the create method to fail
    pocketBaseService.createCurrentUserDegree.mockRejectedValue(new Error('DB down'));
    component.setActiveSection('degrees');
    component.setDegreeFormValue('title', 'Fail degree');
    await component.saveDegree();
    expect(component.errorMessage()).toBe('DB down');
    expect(component['savingSection']()).toBeNull();
  });

  // --- Resume normal flow for reorder error (already covered) ---
});
