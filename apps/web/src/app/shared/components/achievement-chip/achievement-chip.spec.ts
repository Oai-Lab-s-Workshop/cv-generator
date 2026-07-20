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
    fixture.componentRef.setInput('achievement', {
      id: 'ach1',
      title: 'Realisation test',
      description: 'Description test',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
