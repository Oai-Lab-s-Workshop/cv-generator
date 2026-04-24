import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardProject } from './card-project';

describe('CardProject', () => {
  let component: CardProject;
  let fixture: ComponentFixture<CardProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardProject]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardProject);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should infer github icon from url', () => {
    expect(component.getProjectUrlIcon('https://github.com/example/repo')).toBe('github');
  });

  it('should fallback to default icon for unknown domains', () => {
    expect(component.getProjectUrlIcon('https://example.com/project')).toBe('default');
  });
});
