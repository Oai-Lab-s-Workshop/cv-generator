import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PocketBaseService } from '../pocketbase.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <h1>CV Generator</h1>
      <p>Select a CV profile:</p>
      <ul>
        <li *ngFor="let profile of profiles">
          <a [routerLink]="['/' + profile.slug]">{{ profile.name }}</a>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .home { max-width: 600px; margin: 2rem auto; padding: 1rem; }
    h1 { margin-bottom: 1rem; }
    ul { list-style: none; }
    li { margin: 0.5rem 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  `]
})
export class HomeComponent implements OnInit {
  profiles: any[] = [];

  constructor(private pb: PocketBaseService) {}

  async ngOnInit() {
    try {
      this.profiles = await this.pb.getAllCvProfiles();
    } catch (error) {
      console.error('Failed to load profiles', error);
    }
  }
}
