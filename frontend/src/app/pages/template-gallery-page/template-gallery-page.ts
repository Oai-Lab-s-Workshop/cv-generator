import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TemplatePreviewList } from '../../shared/components/template-preview-list/template-preview-list';

@Component({
  selector: 'app-template-gallery-page',
  imports: [RouterLink, TemplatePreviewList],
  templateUrl: './template-gallery-page.html',
  styleUrl: './template-gallery-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateGalleryPage {
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated;
}
