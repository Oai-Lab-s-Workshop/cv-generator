import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PocketBaseService } from '../../../core/services/pocketbase.service';

import { SkillsPalette } from './skills-palette';

class PocketBaseServiceStub {
  async getSkills(): Promise<never[]> {
    return [];
  }
}

describe('SkillsPalette', () => {
  let component: SkillsPalette;
  let fixture: ComponentFixture<SkillsPalette>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsPalette],
      providers: [{ provide: PocketBaseService, useClass: PocketBaseServiceStub }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillsPalette);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('skillsID', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
