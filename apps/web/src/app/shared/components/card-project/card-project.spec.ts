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
    fixture.componentRef.setInput('project', {
      id: 'project-1',
      name: 'Example project',
    });
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

  it('should infer known project URL icons and default fallbacks', () => {
    expect(component.getProjectUrlIcon(null)).toBe('default');
    expect(component.getProjectUrlIcon('not a url')).toBe('default');
    expect(component.getProjectUrlIcon('https://gitlab.com/group/repo')).toBe('gitlab');
    expect(component.getProjectUrlIcon('https://www.linkedin.com/in/example')).toBe('linkedin');
    expect(component.getProjectUrlIcon('https://youtu.be/video')).toBe('youtube');
    expect(component.getProjectUrlIcon('https://www.youtube.com/watch?v=1')).toBe('youtube');
    expect(component.getProjectUrlIcon('https://medium.com/article')).toBe('medium');
    expect(component.getProjectUrlIcon('https://www.npmjs.com/package/pkg')).toBe('npm');
    expect(component.getProjectUrlIcon('https://figma.com/file/1')).toBe('figma');
    expect(component.getProjectUrlIcon('https://behance.net/gallery')).toBe('behance');
    expect(component.getProjectUrlIcon('https://sketchfab.com/model')).toBe('sketchfab');
    expect(component.getProjectUrlIcon('https://discord.gg/invite')).toBe('discord');
    expect(component.getProjectUrlIcon('https://support.discord.com/help')).toBe('discord');
  });
});
