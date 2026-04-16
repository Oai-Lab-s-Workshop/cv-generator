import { Component, inject, OnInit, Injector, input } from '@angular/core';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { Skill } from '../../../core/models/skill.model';

@Component({
  selector: 'app-skills-palette',
  imports: [],
  templateUrl: './skills-palette.html',
  styleUrl: './skills-palette.css',
})
export class SkillsPalette implements OnInit {

  logiciels: any = [];

  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  readonly skillsID = input.required<string[]>();

  ngOnInit(): void {
    this.pocketBaseService.getSkills(this.skillsID()).then(data => {
      data.forEach(element => {
        let icon = (element as Skill).icon ?? 'assets/default-skill-icon.png';
        let label = (element as Skill).name;
        this.logiciels.push({icon, name: label});
      });
    })
  }
}
