import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TemplatePreviewList } from '../../shared/components/template-preview-list/template-preview-list';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-template-gallery-page',
  imports: [Navbar, TemplatePreviewList],
  templateUrl: './template-gallery-page.html',
  styleUrls: ['../../styles/home-shared.css', './template-gallery-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateGalleryPage {}
