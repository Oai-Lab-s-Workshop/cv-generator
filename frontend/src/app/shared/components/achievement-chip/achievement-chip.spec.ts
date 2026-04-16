import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchievementChip } from './achievement-chip';

describe('AchievementChip', () => {
  let component: AchievementChip;
  let fixture: ComponentFixture<AchievementChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchievementChip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AchievementChip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
