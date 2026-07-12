import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PocketBaseService } from '../../../core/services/pocketbase.service';

import { SkillsPalette } from './skills-palette';

class PocketBaseServiceStub {
  getSkills = jest.fn().mockResolvedValue([
    { id: 'skill-1', name: 'Angular', icon: 'angular.svg' },
    { id: 'skill-2', name: 'Bun' },
  ]);
}

class EmptyPocketBaseServiceStub {
  getSkills = jest.fn().mockResolvedValue([]);
}

describe('SkillsPalette empty state', () => {
  it('keeps an empty palette when no skills are returned', async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsPalette],
      providers: [{ provide: PocketBaseService, useClass: EmptyPocketBaseServiceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SkillsPalette);
    fixture.componentRef.setInput('skillsID', []);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.logiciels).toEqual([]);
  });

});

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

  it('loads skills and falls back to the default icon', async () => {
    await fixture.whenStable();

    expect(component.logiciels).toEqual([
      { icon: 'angular.svg', name: 'Angular' },
      { icon: 'assets/default-skill-icon.png', name: 'Bun' },
    ]);
  });
});
