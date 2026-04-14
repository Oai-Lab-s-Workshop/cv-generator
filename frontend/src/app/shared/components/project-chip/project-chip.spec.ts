import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectChip } from './project-chip';
import { Project } from '../../../core/models/project.model';

describe('ProjectChip', () => {
  let component: ProjectChip;
  let fixture: ComponentFixture<ProjectChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectChip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectChip);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('project', { id: '1', name: 'Test project' } satisfies Project);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
