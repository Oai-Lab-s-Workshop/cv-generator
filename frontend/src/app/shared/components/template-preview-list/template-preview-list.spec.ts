import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplatePreviewList } from './template-preview-list';

describe('TemplatePreviewList', () => {
  let component: TemplatePreviewList;
  let fixture: ComponentFixture<TemplatePreviewList>;
  let fetchMock: jest.Mock;

  const mockSeed = {
    users: [{ id: 'user-1', firstName: 'Jane', lastName: 'Doe' }],
    achievements: [],
    hobbies: [],
    skills: [],
    projects: [],
    jobs: [],
    degrees: [],
    cv_profiles: [{ id: 'profile-1', user: 'user-1', profileName: 'Test', achievements: [], projects: [], hobbies: [], jobs: [], degrees: [], skills: [] }],
  };

  beforeEach(async () => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSeed),
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    await TestBed.configureTestingModule({
      imports: [TemplatePreviewList],
    }).compileComponents();
  });

  afterEach(() => {
    // @ts-expect-error - clean up global fetch stub
    delete globalThis.fetch;
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(TemplatePreviewList);
    component = fixture.componentInstance;
  }

  // --- Initialization ---
  it('loads preview data on init', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.previewCards().length).toBeGreaterThan(0);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/app-data/seed.json');
  });

  it('handles fetch error', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) } as Response);
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Impossible de charger les donnees de previsualisation.');
    expect(component.isLoading()).toBe(false);

    const errorEl = fixture.nativeElement.querySelector('.template-preview-list__state--error');
    expect(errorEl).toBeTruthy();
  });

  // --- A4 toggle ---
  it('toggles A4 preview on and off', () => {
    createComponent();
    fixture.detectChanges();

    const templateId = component.previewCards()[0]?.id || 'classic';
    expect(component.isA4PreviewEnabled(templateId)).toBe(false);

    component.toggleA4Preview(templateId);
    expect(component.isA4PreviewEnabled(templateId)).toBe(true);

    component.toggleA4Preview(templateId);
    expect(component.isA4PreviewEnabled(templateId)).toBe(false);
  });

  it('does not toggle A4 when allowA4Toggle is false', () => {
    createComponent();
    fixture.componentRef.setInput('allowA4Toggle', false);
    fixture.detectChanges();

    const templateId = component.previewCards()[0]?.id || 'classic';
    component.toggleA4Preview(templateId);
    expect(component.isA4PreviewEnabled(templateId)).toBe(false);
  });

  it('isA4PreviewEnabled returns true when forceA4 is set', () => {
    createComponent();
    fixture.componentRef.setInput('forceA4', true);
    fixture.detectChanges();

    const templateId = component.previewCards()[0]?.id || 'classic';
    expect(component.isA4PreviewEnabled(templateId)).toBe(true);
  });

  // --- Template limit ---
  it('limits templates', async () => {
    createComponent();
    fixture.componentRef.setInput('templateLimit', 3);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.previewCards().length).toBe(3);
  });

  it('returns all templates when limit exceeds total', async () => {
    createComponent();
    fixture.componentRef.setInput('templateLimit', 100);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.previewCards().length).toBeGreaterThanOrEqual(1);
  });

  // --- Auto-loop guards ---
  it('does not start auto-loop when autoLoop is false', async () => {
    createComponent();
    fixture.componentRef.setInput('autoLoop', false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['animationFrameId']).toBeNull();
  });

  it('does not start auto-loop while loading', async () => {
    // Keep loading state
    fetchMock.mockImplementation(() => new Promise(() => {}));
    createComponent();
    fixture.componentRef.setInput('autoLoop', true);
    fixture.detectChanges();

    expect(component['animationFrameId']).toBeNull();
  });

  it('does not start auto-loop when error is set', () => {
    // Simulate error state: set error message programmatically
    createComponent();
    component.errorMessage.set('Simulated error');
    fixture.componentRef.setInput('autoLoop', true);
    fixture.detectChanges();

    expect(component['animationFrameId']).toBeNull();
  });

  // --- ngOnDestroy ---
  it('cleans up on destroy', async () => {
    createComponent();
    fixture.componentRef.setInput('autoLoop', true);
    fixture.detectChanges();
    await fixture.whenStable();

    component['autoLoopStartTimeoutId'] = setTimeout(() => {}, 100000) as unknown as ReturnType<typeof setTimeout>;
    const cancelSpy = jest.spyOn(window, 'cancelAnimationFrame');
    component['animationFrameId'] = 42;
    component.ngOnDestroy();
    expect(cancelSpy).toHaveBeenCalledWith(42);
    cancelSpy.mockRestore();
  });

  // --- showChrome input ---
  it('accepts showChrome input', () => {
    createComponent();
    fixture.componentRef.setInput('showChrome', false);
    fixture.detectChanges();
    expect(component.showChrome()).toBe(false);
  });

  // --- getTemplatesForPreview private (via component) ---
  it('getTemplatesForPreview handles limit of 1', () => {
    createComponent();
    fixture.componentRef.setInput('templateLimit', 1);
    fixture.detectChanges();
    const cards = fixture.componentInstance['getTemplatesForPreview']();
    expect(cards.length).toBe(1);
  });

  it('getTemplatesForPreview handles zero and null limits', () => {
    createComponent();
    fixture.componentRef.setInput('templateLimit', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance['getTemplatesForPreview']().length).toBeGreaterThan(1);

    fixture.componentRef.setInput('templateLimit', null);
    fixture.detectChanges();
    expect(fixture.componentInstance['getTemplatesForPreview']().length).toBeGreaterThan(1);
  });

  it('starts and stops auto-loop when the container can scroll', () => {
    createComponent();
    fixture.componentRef.setInput('autoLoop', true);
    component.isLoading.set(false);
    component.errorMessage.set(null);
    const requestSpy = jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(101);
    const cancelSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    Object.defineProperty(component, 'scrollContainer', {
      configurable: true,
      value: {
      nativeElement: {
        scrollHeight: 1000,
        clientHeight: 100,
        scrollTop: 0,
      },
      },
    });

    component['startAutoLoopIfNeeded']();
    expect(component['animationFrameId']).toBe(101);

    component['stopAutoLoop']();
    expect(cancelSpy).toHaveBeenCalledWith(101);
    expect(component['animationFrameId']).toBeNull();
    requestSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it('auto-loop step reverses direction at scroll bounds', () => {
    createComponent();
    fixture.componentRef.setInput('autoLoop', true);
    component.isLoading.set(false);
    const callbacks: FrameRequestCallback[] = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const container = {
      scrollHeight: 200,
      clientHeight: 100,
      scrollTop: 100,
    };
    Object.defineProperty(component, 'scrollContainer', {
      configurable: true,
      value: { nativeElement: container },
    });

    component['startAutoLoopIfNeeded']();
    callbacks[0](0);
    expect(container.scrollTop).toBeLessThan(100);
    container.scrollTop = 0;
    callbacks[1](0);
    expect(container.scrollTop).toBeGreaterThan(0);
  });
});
