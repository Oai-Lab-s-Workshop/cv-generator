import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { isDesktopMode } from '../../../core/utils/desktop-runtime-config';
import { WindowControlService } from '../../../core/services/window-control.service';

@Component({
  selector: 'app-title-bar',
  standalone: true,
  templateUrl: './title-bar.html',
  styleUrl: './title-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleBarComponent {
  readonly isDesktop = isDesktopMode();
  private readonly windowControl = inject(WindowControlService);

  async minimize(event: Event): Promise<void> {
    event.stopPropagation();
    await this.windowControl.minimize();
  }

  async maximize(event: Event): Promise<void> {
    event.stopPropagation();
    await this.windowControl.maximize();
  }

  async close(event: Event): Promise<void> {
    event.stopPropagation();
    await this.windowControl.close();
  }
}
