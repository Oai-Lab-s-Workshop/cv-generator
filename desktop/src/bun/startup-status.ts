export type StartupStepStatus = 'pending' | 'running' | 'ok' | 'failed';

export interface StartupStepDefinition {
  code: string;
  message: string;
}

export interface StartupStep extends StartupStepDefinition {
  status: StartupStepStatus;
  updatedAt?: string;
  detail?: string;
}

export interface StartupStatusSnapshot {
  steps: StartupStep[];
  activeCode: string | null;
  failedCode: string | null;
  redirectUrl: string | null;
}

export type StartupReporter = {
  start: (code: StartupStepCode, detail?: string) => void;
  ok: (code: StartupStepCode, detail?: string) => void;
  fail: (code: StartupStepCode, detail?: string) => void;
};

export const STARTUP_STEPS = [
  { code: 'BOOT-001', message: 'Finding the toolbox' },
  { code: 'BOOT-010', message: 'Picking local ports' },
  { code: 'PB-010', message: 'Checking the PocketBase launcher' },
  { code: 'PB-020', message: 'Preparing PocketBase secrets' },
  { code: 'PB-030', message: 'Running schema spells' },
  { code: 'PB-040', message: 'Creating the local superuser' },
  { code: 'PB-050', message: 'Waking PocketBase' },
  { code: 'PB-060', message: 'Waiting for PocketBase heartbeat' },
  { code: 'PB-070', message: 'Preparing the helper account' },
  { code: 'MCP-010', message: 'Checking the helper bot parts' },
  { code: 'MCP-020', message: 'Starting the helper bot' },
  { code: 'MCP-030', message: 'Waiting for helper heartbeat' },
  { code: 'WEB-010', message: 'Serving the frontend' },
  { code: 'WEB-020', message: 'Wiring the app menu' },
  { code: 'READY-001', message: 'Launching Resumate' },
] as const;

export type StartupStepCode = typeof STARTUP_STEPS[number]['code'];

export class StartupStatusStore {
  private readonly steps: StartupStep[] = STARTUP_STEPS.map((step) => ({ ...step, status: 'pending' }));
  private activeCode: string | null = null;
  private failedCode: string | null = null;
  private redirectUrl: string | null = null;

  readonly reporter: StartupReporter = {
    start: (code, detail) => this.start(code, detail),
    ok: (code, detail) => this.ok(code, detail),
    fail: (code, detail) => this.fail(code, detail),
  };

  start(code: StartupStepCode, detail?: string): void {
    this.update(code, 'running', detail);
    this.activeCode = code;
  }

  ok(code: StartupStepCode, detail?: string): void {
    this.update(code, 'ok', detail);
    if (this.activeCode === code) {
      this.activeCode = null;
    }
  }

  fail(code: StartupStepCode, detail?: string): void {
    this.update(code, 'failed', detail);
    this.activeCode = code;
    this.failedCode = code;
  }

  failActive(detail?: string): void {
    const code = this.activeCode as StartupStepCode | null;
    if (code) {
      this.fail(code, detail);
      return;
    }

    this.fail('BOOT-001', detail);
  }

  setRedirectUrl(redirectUrl: string): void {
    this.redirectUrl = redirectUrl;
  }

  snapshot(): StartupStatusSnapshot {
    return {
      steps: this.steps.map((step) => ({ ...step })),
      activeCode: this.activeCode,
      failedCode: this.failedCode,
      redirectUrl: this.redirectUrl,
    };
  }

  private update(code: StartupStepCode, status: StartupStepStatus, detail?: string): void {
    const step = this.steps.find((item) => item.code === code);
    if (!step) {
      return;
    }

    step.status = status;
    step.updatedAt = new Date().toISOString();
    step.detail = detail;
  }
}
