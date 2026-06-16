import { ComponentFixture, TestBed } from '@angular/core/testing';
import { McpConfigHelper } from './mcp-config-helper';

describe('McpConfigHelper', () => {
  let component: McpConfigHelper;
  let fixture: ComponentFixture<McpConfigHelper>;
  let clipboardWriteText: jest.Mock;

  beforeEach(async () => {
    clipboardWriteText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });

    await TestBed.configureTestingModule({
      imports: [McpConfigHelper],
    }).compileComponents();

    fixture = TestBed.createComponent(McpConfigHelper);
    fixture.componentRef.setInput('activeTokenCount', 2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates and renders active token count', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('2 tokens actifs');
    expect(fixture.nativeElement.textContent).toContain('Configuration manuelle');
    expect(fixture.nativeElement.textContent).toContain('cle API');
  });

  it('uses a select for agent choice', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement | null;
    const agentButtons = fixture.nativeElement.querySelectorAll('.mcp-helper__agent');

    expect(select).toBeTruthy();
    expect(select?.options.length).toBe(5);
    expect(agentButtons.length).toBe(0);
  });

  it('updates selected agent from the select', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'opencode';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.selectedAgent()).toBe('opencode');
    expect(component.getGeneratedConfig()).toContain('"auth"');
    expect(fixture.nativeElement.textContent).toContain('Configuration OpenCode');
  });

  it('generates plain essential values for the plain preset', () => {
    component.customToken.set('rmcp_plain');
    component.customUrl.set('http://localhost:8081/mcp');
    component.selectedAgent.set('plain');

    const config = component.getGeneratedConfig();

    expect(config).toContain('URL du serveur MCP : http://localhost:8081/mcp');
    expect(config).toContain('Transport          : HTTP (Streamable)');
    expect(config).toContain('Nom du serveur     : resumate-mcp');
    expect(config).toContain('Methode auth       : Cle API manuelle');
    expect(config).toContain('Cle API            : rmcp_plain');
  });

  it('generates config for the selected agent', () => {
    component.customToken.set('rmcp_test');
    component.customUrl.set('http://localhost:8080/mcp');
    component.selectedAgent.set('opencode');

    const config = component.getGeneratedConfig();

    expect(config).toContain('"resumate"');
    expect(config).toContain('"token": "rmcp_test"');
    expect(config).toContain('http://localhost:8080/mcp');
  });

  it('generates Codex HTTP config for the Codex preset', () => {
    component.customToken.set('rmcp_codex');
    component.customUrl.set('http://localhost:8080/mcp');
    component.selectedAgent.set('codex');

    const config = component.getGeneratedConfig();

    expect(config).toContain('"transport": "http"');
    expect(config).toContain('"Authorization": "Bearer rmcp_codex"');
  });

  it('returns an empty config when the selected agent is unknown', () => {
    component.selectedAgent.set('missing-agent');

    expect(component.getSelectedPreset()).toBeUndefined();
    expect(component.getGeneratedConfig()).toBe('');
  });

  it('copies generated config to the clipboard', async () => {
    component.customToken.set('rmcp_copy');

    await component.copyConfig();

    expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('rmcp_copy'));
    expect(component.isCopied()).toBe(true);
  });

  it('reports not copied when copied agent differs from the selected agent', () => {
    component.copiedAgent.set('claude-code');
    component.selectedAgent.set('opencode');

    expect(component.isCopied()).toBe(false);
  });

  it('does not copy when no config can be generated', async () => {
    component.selectedAgent.set('missing-agent');

    await component.copyConfig();

    expect(clipboardWriteText).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when clipboard write fails', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard blocked'));
    const execCommandSpy = jest.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommandSpy,
    });

    await component.copyConfig();

    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(component.isCopied()).toBe(true);
  });
});
