import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillsPalette } from './skills-palette';

describe('SkillsPalette', () => {
  let component: SkillsPalette;
  let fixture: ComponentFixture<SkillsPalette>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsPalette]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillsPalette);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
