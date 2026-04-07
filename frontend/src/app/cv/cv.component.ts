import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PocketBaseService } from '../pocketbase.service';

@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cv-container" *ngIf="person">
      <header class="header">
        <h1>{{ person.name }}</h1>
        <p class="title">{{ person.profile_title }}</p>
        <div class="contact">
          <span *ngIf="person.email">📧 {{ person.email }}</span>
          <span *ngIf="person.phone">📱 {{ person.phone }}</span>
          <span *ngIf="person.linkedin">🔗 {{ person.linkedin }}</span>
          <span *ngIf="person.github">💻 {{ person.github }}</span>
        </div>
      </header>

      <section class="summary" *ngIf="person.summary">
        <h2>Profil</h2>
        <p>{{ person.summary }}</p>
      </section>

      <section class="experience">
        <h2>Expérience</h2>
        <div class="job" *ngFor="let job of emplois">
          <h3>{{ job.position }}</h3>
          <p class="company">{{ job.company }} | {{ job.location }}</p>
          <p class="dates">{{ job.date_start }} - {{ job.date_end || 'Présent' }}</p>
          <p class="description">{{ job.responsibilities }}</p>
        </div>
      </section>

      <section class="projects" *ngIf="projets.length > 0">
        <h2>Projets</h2>
        <div class="project" *ngFor="let project of projets">
          <h3>{{ project.name }}</h3>
          <p>{{ project.description }}</p>
        </div>
      </section>

      <section class="skills">
        <h2>Compétences</h2>
        <div class="skill" *ngFor="let skill of competences">
          <span class="name">{{ skill.name }}</span>
          <span class="level" *ngIf="skill.level">{{ skill.level }}%</span>
        </div>
      </section>

      <section class="education" *ngIf="diplomes.length > 0">
        <h2>Formation</h2>
        <div class="diploma" *ngFor="let diploma of diplomes">
          <h3>{{ diploma.title }}</h3>
          <p>{{ diploma.school }} | {{ diploma.year }}</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .cv-container { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', sans-serif; }
    .header { text-align: center; margin-bottom: 2rem; }
    .title { color: #666; font-size: 1.2rem; }
    .contact { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem; }
    section { margin: 2rem 0; }
    h2 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    .job, .project, .diploma { margin: 1rem 0; }
    .company { font-weight: bold; }
    .dates { color: #666; font-size: 0.9rem; }
    .skills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .skill { background: #f0f0f0; padding: 0.5rem 1rem; border-radius: 4px; }
    @media print { .cv-container { padding: 0; } }
  `]
})
export class CvComponent implements OnInit {
  slug: string = '';
  person: any = null;
  emplois: any[] = [];
  projets: any[] = [];
  competences: any[] = [];
  diplomes: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private pb: PocketBaseService
  ) {}

  async ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    await this.loadData();
  }

  async loadData() {
    try {
      const profile = await this.pb.getCvProfile(this.slug);
      this.person = await this.pb.getPerson(profile.id);
      this.emplois = await this.pb.getEmplois(profile.id);
      this.projets = await this.pb.getProjets(profile.id);
      this.competences = await this.pb.getCompetences(profile.id);
      this.diplomes = await this.pb.getDiplomes(profile.id);
    } catch (error) {
      console.error('Failed to load CV data', error);
    }
  }
}
