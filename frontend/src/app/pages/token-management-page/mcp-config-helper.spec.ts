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
    expect(component.getGeneratedConfig()).toContain('"API_KEY"');
    expect(fixture.nativeElement.textContent).toContain('Configuration OpenCode');
  });

  it('generates plain essential values for the custom-client preset', () => {
    component.customToken.set('rmcp_custom');
    component.customUrl.set('http://localhost:8081/mcp');
    component.selectedAgent.set('custom-client');

    const config = component.getGeneratedConfig();

    expect(config).toContain('URL du serveur MCP : http://localhost:8081/mcp');
    expect(config).toContain('Transport          : HTTP (Streamable)');
    expect(config).toContain('Méthode auth       : Clé API');
    expect(config).toContain('Clé API            : rmcp_custom');
    expect(config).toContain('Outils disponibles : list_resumes');
  });

  it('generates config for the selected agent', () => {
    component.customToken.set('rmcp_test');
    component.customUrl.set('http://localhost:8080/mcp');
    component.selectedAgent.set('opencode');

    const config = component.getGeneratedConfig();

    expect(config).toContain('"resumate"');
    expect(config).toContain('"API_KEY": "rmcp_test"');
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

  describe('custom-client mode', () => {
    beforeEach(() => {
      component.customToken.set('rmcp_custom_token');
      component.customUrl.set('https://example.com/mcp');
      component.selectedAgent.set('custom-client');
      fixture.detectChanges();
    });

    it('returns structured custom client config fields', () => {
      const fields = component.customClientConfig();

      expect(fields.length).toBe(6);
      expect(fields[0]).toEqual({ key: 'URL du serveur MCP', value: 'https://example.com/mcp', copyable: true });
      expect(fields[1]).toEqual({ key: 'Transport', value: 'HTTP (Streamable)', copyable: false });
      expect(fields[2]).toEqual({ key: "Méthode d'authentification", value: 'Clé API', copyable: false });
      expect(fields[3]).toEqual({ key: "Header d'autorisation", value: 'Authorization: Bearer rmcp_custom_token', copyable: true });
      expect(fields[4]).toEqual({ key: 'Clé API', value: 'rmcp_custom_token', copyable: true });
      expect(fields[5].key).toBe('Outils disponibles');
      expect(fields[5].copyable).toBe(false);
    });

    it('uses placeholder token when no custom token is set', () => {
      component.customToken.set('');
      const fields = component.customClientConfig();

      expect(fields[4].value).toBe('<votre-cle-api>');
      expect(fields[3].value).toBe('Authorization: Bearer <votre-cle-api>');
    });

    it('shows structured key-value list in the template', () => {
      const kvItems = fixture.nativeElement.querySelectorAll('.mcp-helper__kv-item');

      expect(kvItems.length).toBe(6);
      expect(kvItems[0].textContent).toContain('URL du serveur MCP');
      expect(kvItems[0].textContent).toContain('https://example.com/mcp');
    });

    it('shows Tout copier button instead of Copier la config', () => {
      const button = fixture.nativeElement.querySelector('.mcp-helper__output-header .secondary-button');

      expect(button.textContent.trim()).toBe('Tout copier');
    });

    it('shows pre block for non-custom-client presets', () => {
      component.selectedAgent.set('claude-code');
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('.mcp-helper__output pre');
      expect(pre).toBeTruthy();
      expect(pre.textContent).toContain('mcpServers');
    });

    it('copies a single field value', async () => {
      const field = component.customClientConfig()[0];
      await component.copyFieldValue(field.value, field.key);

      expect(clipboardWriteText).toHaveBeenCalledWith('https://example.com/mcp');
      expect(component.isFieldCopied('URL du serveur MCP')).toBe(true);
    });

    it('reports not copied for a different field key', () => {
      component.copiedField.set('URL du serveur MCP');

      expect(component.isFieldCopied('Clé API')).toBe(false);
    });

    it('copies all fields as a text block', async () => {
      await component.copyAllFields();

      expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('URL du serveur MCP : https://example.com/mcp'));
      expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('Transport : HTTP (Streamable)'));
      expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("Méthode d'authentification : Clé API"));
      expect(component.isCopied()).toBe(true);
    });

    it('falls back to execCommand when copyFieldValue clipboard fails', async () => {
      clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard blocked'));
      const execCommandSpy = jest.fn().mockReturnValue(true);
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: execCommandSpy,
      });

      await component.copyFieldValue('test-value', 'test-key');

      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(component.isFieldCopied('test-key')).toBe(true);
    });

    it('falls back to execCommand when copyAllFields clipboard fails', async () => {
      clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard blocked'));
      const execCommandSpy = jest.fn().mockReturnValue(true);
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: execCommandSpy,
      });

      await component.copyAllFields();

      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(component.isCopied()).toBe(true);
    });

    it('has copy buttons only for copyable fields', () => {
      const copyButtons = fixture.nativeElement.querySelectorAll('.mcp-helper__kv-copy');

      // Only copyable fields: URL du serveur MCP, Header d'autorisation, Clé API = 3 copy buttons
      expect(copyButtons.length).toBe(3);
    });
  });
});
