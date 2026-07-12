import { Component, input } from '@angular/core';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-card-project',
  imports: [],
  templateUrl: './card-project.html',
  styleUrl: './card-project.css',
})
export class CardProject {
  readonly project = input.required<Project>();

  getProjectUrlIcon(url: string | null | undefined): string {
    if (!url) return 'default';

    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');

      if (hostname === 'github.com') return 'github';
      if (hostname === 'gitlab.com') return 'gitlab';
      if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return 'linkedin';
      if (hostname === 'youtube.com' || hostname === 'youtu.be' || hostname.endsWith('.youtube.com')) return 'youtube';
      if (hostname === 'medium.com' || hostname.endsWith('.medium.com')) return 'medium';
      if (hostname === 'npmjs.com' || hostname.endsWith('.npmjs.com')) return 'npm';
      if (hostname === 'figma.com' || hostname.endsWith('.figma.com')) return 'figma';
      if (hostname === 'behance.net' || hostname.endsWith('.behance.net')) return 'behance';
      if (hostname === 'sketchfab.com' || hostname.endsWith('.sketchfab.com')) return 'sketchfab';
      if (hostname === 'discord.com' || hostname === 'discord.gg' || hostname.endsWith('.discord.com')) return 'discord';
      return 'default';
    } catch {
      return 'default';
    }
  }
}
