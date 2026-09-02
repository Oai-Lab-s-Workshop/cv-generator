import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AiToken } from '../../core/models/ai-token.model';
import { CvProfile, CvProfileStatus } from '../../core/models/cv-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS } from '../../core/templates/cv-template-registry';
import { getErrorMessage } from '../../core/utils/error-message';
import { Navbar } from '../../shared/components/navbar/navbar';
import { CV_PROFILE_STATUS_OPTIONS } from '../profile-editor-page/profile-editor-page';

type SortColumn = 'label' | 'template' | 'status' | 'updated_at';
type SortDirection = 'asc' | 'desc';

const STATUS_SORT_ORDER: Record<string, number> = {
  unsent: 0,
  sent: 1,
  unanswered: 2,
  rejected: 3,
  responded: 4,
};

function pbDateValue(value?: string): number {
  if (!value) return 0;
  const isoValue = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(isoValue);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

@Component({
  selector: 'app-home-page',
  imports: [FormsModule, Navbar, RouterLink],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly profiles = signal<CvProfile[]>([]);
  readonly aiTokens = signal<AiToken[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingAiTokens = signal(true);
  readonly isCreating = signal(false);
  readonly newProfileLabel = signal('');
  readonly newProfileName = signal('');
  readonly newProfileTemplate = signal(CV_TEMPLATE_OPTIONS[0]?.id || 'classic');
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal<string | null>(null);
  readonly isDeleting = signal<string | null>(null);
  readonly templateSelections = signal<Record<string, string>>({});
  readonly publicSelections = signal<Partial<Record<string, boolean>>>({});
  readonly openStatusMenuFor = signal<string | null>(null);
  readonly currentUser = this.authService.currentUser;
  readonly templateOptions = CV_TEMPLATE_OPTIONS;
  readonly statusOptions = CV_PROFILE_STATUS_OPTIONS;
  readonly selectableStatusOptions = CV_PROFILE_STATUS_OPTIONS.filter((o) => o.value !== 'unanswered');
  readonly totalProfileCount = computed(() => this.profiles().length);
  readonly publicProfileCount = computed(
    () => this.profiles().filter((profile) => Boolean(profile.template) && profile.public !== false).length,
  );
  readonly privateProfileCount = computed(
    () => this.profiles().filter((profile) => Boolean(profile.template) && profile.public === false).length,
  );
  readonly activeAiTokenCount = computed(() => this.aiTokens().filter((token) => token.status === 'active').length);
  readonly sortColumn = signal<SortColumn>('updated_at');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly isBatchProcessing = signal(false);

  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur authentifie';
  });

  readonly unsentProfileCount = computed(
    () => this.profiles().filter((p) => (p.status || 'unsent') === 'unsent').length,
  );
  readonly sentProfileCount = computed(
    () => this.profiles().filter((p) => p.status === 'sent').length,
  );
  readonly respondedProfileCount = computed(
    () => this.profiles().filter((p) => p.status === 'responded').length,
  );
  readonly rejectedProfileCount = computed(
    () => this.profiles().filter((p) => p.status === 'rejected').length,
  );
  readonly unansweredProfileCount = computed(
    () => this.profiles().filter((p) => p.status === 'unanswered').length,
  );

  readonly unsentPercentage = computed(() => this.percentageOf(this.unsentProfileCount()));
  readonly sentPercentage = computed(() => this.percentageOf(this.sentProfileCount()));
  readonly respondedPercentage = computed(() => this.percentageOf(this.respondedProfileCount()));
  readonly rejectedPercentage = computed(() => this.percentageOf(this.rejectedProfileCount()));
  readonly unansweredPercentage = computed(() => this.percentageOf(this.unansweredProfileCount()));

  readonly activeStatusFilter = signal<CvProfileStatus | null>(null);

  readonly publicPercentage = computed(() => this.percentageOf(this.publicProfileCount()));
  readonly privatePercentage = computed(() => this.percentageOf(this.privateProfileCount()));

  readonly sortedProfiles = computed(() => {
    const list = [...this.profiles()];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    list.sort((a, b) => {
      let cmp = 0;

      switch (col) {
        case 'label':
          cmp = (a.label || a.profileName || '').localeCompare(b.label || b.profileName || '');
          break;
        case 'template':
          cmp = (a.template || '').localeCompare(b.template || '');
          break;
        case 'status': {
          const aOrder = STATUS_SORT_ORDER[a.status || 'unsent'] ?? 99;
          const bOrder = STATUS_SORT_ORDER[b.status || 'unsent'] ?? 99;
          cmp = aOrder - bOrder;
          break;
        }
        case 'updated_at': {
          const aTime = pbDateValue(a.updated_at);
          const bTime = pbDateValue(b.updated_at);
          cmp = aTime - bTime; // ascending: oldest first
          break;
        }
      }

      return dir === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  readonly filteredSortedProfiles = computed(() => {
    const filter = this.activeStatusFilter();
    const sorted = this.sortedProfiles();
    if (filter === null) return sorted;
    return sorted.filter((profile) => (profile.status || 'unsent') === filter);
  });

  readonly activeFilterLabel = computed(() => {
    const filter = this.activeStatusFilter();
    if (filter === null) return '';
    return CV_PROFILE_STATUS_OPTIONS.find((option) => option.value === filter)?.label ?? 'Non envoye';
  });

  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly isSelectionActive = computed(() => this.selectedIds().size > 0);
  readonly isAllSelected = computed(() => {
    const ids = this.selectedIds();
    const profiles = this.filteredSortedProfiles();
    return profiles.length > 0 && profiles.every(p => ids.has(p.id));
  });

  ngOnInit(): void {
    void this.loadProfiles();
    void this.loadAiTokens();
  }

  private percentageOf(count: number): number {
    const total = this.totalProfileCount();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'updated_at' ? 'desc' : 'asc');
    }
  }

  getSortAriaSort(column: SortColumn): string {
    if (this.sortColumn() !== column) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  private static readonly MONTH_ABBR = [
    'janv.', 'f\u00e9vr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'ao\u00fbt', 'sept.', 'oct.', 'nov.', 'd\u00e9c.',
  ];

  formatDate(value?: string): string {
    if (!value) return '-';
    const isoValue = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return '-';

    const now = new Date();
    const currentYear = now.getFullYear();
    const dateYear = date.getFullYear();
    const yearDiff = currentYear - dateYear;

    // Relative display for dates within ~1 month
    if (yearDiff === 0) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayDiff = Math.round((today.getTime() - targetDay.getTime()) / 86400000);

      if (dayDiff === 0) {
        return 'Auj.';
      }

      if (dayDiff >= 1 && dayDiff <= 6) {
        return `${dayDiff}j`;
      }

      if (dayDiff >= 7 && dayDiff <= 30) {
        const weeks = Math.round(dayDiff / 7);
        return `${weeks}sem`;
      }

      // Older than ~1 month but same year: DD/MM
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    }

    if (yearDiff === 1) {
      // Previous year: DD mmm.
      const day = String(date.getDate()).padStart(2, '0');
      const monthAbbr = HomePage.MONTH_ABBR[date.getMonth()];
      return `${day} ${monthAbbr}`;
    }

    // 2+ years old: YYYY
    return String(dateYear);
  }

  private async loadProfiles(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const profiles = await this.pocketBaseService.getCurrentUserCvProfiles();

      this.templateSelections.set(
        Object.fromEntries(profiles.map((profile) => [profile.id, profile.template || this.templateOptions[0]?.id || 'classic'])),
      );
      this.publicSelections.set(
        Object.fromEntries(profiles.map((profile) => [profile.id, profile.public !== false])),
      );
      this.profiles.set(profiles);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAiTokens(): Promise<void> {
    this.isLoadingAiTokens.set(true);

    try {
      this.aiTokens.set(await this.pocketBaseService.getCurrentUserAiTokens());
    } catch {
      this.aiTokens.set([]);
    } finally {
      this.isLoadingAiTokens.set(false);
    }
  }

  getTemplateLabel(templateId?: string): string {
    if (!templateId) {
      return 'Template requis';
    }

    return this.templateOptions.find((template) => template.id === templateId)?.label ?? templateId;
  }

  getVisibilityLabel(profile: CvProfile): string {
    if (!profile.template) {
      return 'Indisponible';
    }

    return profile.public === false ? 'Prive' : 'Public';
  }

  getVisibilityTone(profile: CvProfile): 'live' | 'private' | 'missing' {
    if (!profile.template) {
      return 'missing';
    }

    return profile.public === false ? 'private' : 'live';
  }

  async copyRoute(profile: CvProfile): Promise<void> {
    if (!profile.template || !profile.slug || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}/${profile.slug}`);
  }

  isWideTableMode(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 801px)').matches;
  }

  openProfileFromRow(profile: CvProfile, event?: Event): void {
    if (!this.isWideTableMode()) {
      return;
    }

    if (event && this.isInteractiveEvent(event)) {
      return;
    }

    void this.router.navigate(['/home/profiles', profile.id, 'edit']);
  }

  openProfileFromRowKeyboard(profile: CvProfile, event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    if (this.isInteractiveEvent(event)) {
      return;
    }

    event.preventDefault();
    this.openProfileFromRow(profile, event);
  }

  toggleStatusMenu(profileId: string, event: Event): void {
    event.stopPropagation();
    this.openStatusMenuFor.update((current) => (current === profileId ? null : profileId));
  }

  async selectStatus(profile: CvProfile, status: CvProfileStatus, event: Event): Promise<void> {
    event.stopPropagation();
    this.openStatusMenuFor.set(null);
    await this.changeStatus(profile, status);
  }

  closeStatusMenu(event?: Event): void {
    event?.stopPropagation();
    this.openStatusMenuFor.set(null);
  }

  private isInteractiveEvent(event: Event): boolean {
    return event.target instanceof Element && Boolean(event.target.closest('button, a, select, input, label, textarea'));
  }

  private replaceProfile(updatedProfile: CvProfile): void {
    this.profiles.update((profiles) =>
      profiles.map((profile) => (profile.id === updatedProfile.id ? updatedProfile : profile)),
    );
    this.templateSelections.update((current) => ({
      ...current,
      [updatedProfile.id]: updatedProfile.template || this.templateOptions[0]?.id || 'classic',
    }));
    this.publicSelections.update((current) => ({
      ...current,
      [updatedProfile.id]: updatedProfile.public !== false,
    }));
  }

  async changeTemplate(profile: CvProfile, template: string): Promise<void> {
    this.templateSelections.update((current) => ({ ...current, [profile.id]: template }));

    if (!template) {
      this.errorMessage.set('Select a template first.');
      return;
    }

    this.isSaving.set(profile.id);
    this.errorMessage.set(null);

    try {
      const updatedProfile = await this.pocketBaseService.setTemplateForCurrentUserCvProfile(
        profile.id,
        template,
        this.publicSelections()[profile.id] ?? true,
      );
      this.replaceProfile(updatedProfile);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSaving.set(null);
    }
  }

  async createProfile(): Promise<void> {
    const label = this.newProfileLabel().trim();
    const profileName = this.newProfileName().trim();

    if (!label) {
      this.errorMessage.set('Le label est obligatoire.');
      return;
    }

    if (!profileName) {
      this.errorMessage.set('Le nom du profil est obligatoire.');
      return;
    }

    const template = this.newProfileTemplate();
    if (!template) {
      this.errorMessage.set('Le template est obligatoire.');
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set(null);

    try {
      const profile = await this.pocketBaseService.createCurrentUserCvProfile(label, profileName, template);
      this.newProfileLabel.set('');
      this.newProfileName.set('');
      await this.router.navigate(['/home/profiles', profile.id, 'edit']);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isCreating.set(false);
    }
  }

  async deleteProfile(profile: CvProfile): Promise<void> {
    if (!confirm(`Supprimer "${profile.label}" ? Cette action est irreversible.`)) return;
    this.isDeleting.set(profile.id);
    this.errorMessage.set(null);
    try {
      await this.pocketBaseService.deleteCurrentUserCvProfile(profile.id);
      await this.loadProfiles();
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isDeleting.set(null);
    }
  }

  async togglePublic(profile: CvProfile): Promise<void> {
    if (!profile.template) {
      return;
    }

    const isPublic = !(this.publicSelections()[profile.id] ?? profile.public !== false);

    this.publicSelections.update((current) => ({ ...current, [profile.id]: isPublic }));

    this.isSaving.set(profile.id);
    this.errorMessage.set(null);

    try {
      const updatedProfile = await this.pocketBaseService.setPublicForCurrentUserCvProfile(profile.id, isPublic);
      this.replaceProfile(updatedProfile);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSaving.set(null);
    }
  }

  async changeStatus(profile: CvProfile, status: CvProfileStatus): Promise<void> {
    this.isSaving.set(profile.id);
    this.errorMessage.set(null);

    try {
      const updatedProfile = await this.pocketBaseService.setStatusForCvProfile(profile.id, status);
      this.replaceProfile(updatedProfile);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSaving.set(null);
    }
  }

  getStatusLabel(profile: CvProfile): string {
    const status = profile.status ?? 'unsent';
    return CV_PROFILE_STATUS_OPTIONS.find((opt) => opt.value === status)?.label ?? 'Non envoye';
  }

  getStatusTone(profile: CvProfile): string {
    const status = profile.status ?? 'unsent';
    return CV_PROFILE_STATUS_OPTIONS.find((opt) => opt.value === status)?.tone ?? 'gray';
  }

  setActiveFilter(status: CvProfileStatus): void {
    this.activeStatusFilter.update((current) => (current === status ? null : status));
  }

  clearFilter(): void {
    this.activeStatusFilter.set(null);
  }

  isFilterActive(): boolean {
    return this.activeStatusFilter() !== null;
  }

  isFilterSelected(status: CvProfileStatus): boolean {
    return this.activeStatusFilter() === status;
  }

  toggleSelection(profileId: string, event: Event): void {
    event.stopPropagation();
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filteredSortedProfiles().map(p => p.id)));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  async batchDelete(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    if (!confirm(`Supprimer ${ids.length} profil(s) ? Cette action est irreversible.`)) {
      return;
    }

    this.isBatchProcessing.set(true);
    this.errorMessage.set(null);

    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          await this.pocketBaseService.deleteCurrentUserCvProfile(id);
          return { id, success: true as const };
        } catch {
          return { id, success: false as const };
        }
      }),
    );

    const failedIds = results.filter((r) => !r.success).map((r) => r.id);

    await this.loadProfiles();

    if (failedIds.length > 0) {
      this.errorMessage.set(
        `${failedIds.length} profil(s) sur ${ids.length} n'ont pas pu être supprimé(s).`,
      );
      this.selectedIds.set(new Set(failedIds));
    } else {
      this.selectedIds.set(new Set());
    }

    this.isBatchProcessing.set(false);
  }

  async batchChangeVisibility(isPublic: boolean): Promise<void> {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    this.isBatchProcessing.set(true);
    this.errorMessage.set(null);

    let hasError = false;
    await Promise.all(
      ids.map(async (id) => {
        try {
          const profile = this.profiles().find((p) => p.id === id);
          if (!profile || !profile.template) return;

          const updated = await this.pocketBaseService.setPublicForCurrentUserCvProfile(id, isPublic);
          this.replaceProfile(updated);
        } catch (error: unknown) {
          hasError = true;
          this.errorMessage.set(getErrorMessage(error));
        }
      }),
    );

    if (!hasError) {
      this.selectedIds.set(new Set());
    }
    this.isBatchProcessing.set(false);
  }

  async batchChangeTemplate(templateId: string): Promise<void> {
    if (!templateId) return;
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    this.isBatchProcessing.set(true);
    this.errorMessage.set(null);

    let hasError = false;
    await Promise.all(
      ids.map(async (id) => {
        try {
          const isPublic = this.publicSelections()[id] ?? true;
          const updated = await this.pocketBaseService.setTemplateForCurrentUserCvProfile(
            id,
            templateId,
            isPublic,
          );
          this.replaceProfile(updated);
          this.templateSelections.update((current) => ({ ...current, [id]: templateId }));
        } catch (error: unknown) {
          hasError = true;
          this.errorMessage.set(getErrorMessage(error));
        }
      }),
    );

    if (!hasError) {
      this.selectedIds.set(new Set());
    }
    this.isBatchProcessing.set(false);
  }

  async batchChangeStatus(status: string): Promise<void> {
    if (!status) return;
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    this.isBatchProcessing.set(true);
    this.errorMessage.set(null);

    let hasError = false;
    await Promise.all(
      ids.map(async (id) => {
        try {
          const updated = await this.pocketBaseService.setStatusForCvProfile(
            id,
            status as CvProfileStatus,
          );
          this.replaceProfile(updated);
        } catch (error: unknown) {
          hasError = true;
          this.errorMessage.set(getErrorMessage(error));
        }
      }),
    );

    if (!hasError) {
      this.selectedIds.set(new Set());
    }
    this.isBatchProcessing.set(false);
  }

}
