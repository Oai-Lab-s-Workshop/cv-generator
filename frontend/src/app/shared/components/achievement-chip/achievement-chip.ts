import { Component, input } from '@angular/core';
import { Achievement } from '../../../core/models/achievement.model';

@Component({
  selector: 'app-achievement-chip',
  imports: [],
  templateUrl: './achievement-chip.html',
  styleUrl: './achievement-chip.css',
})
export class AchievementChip {
  readonly achievement = input.required<Achievement>();
}
