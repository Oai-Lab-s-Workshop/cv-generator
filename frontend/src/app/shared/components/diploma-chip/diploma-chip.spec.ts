import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiplomaChip } from './diploma-chip';

describe('DiplomaChip', () => {
  let component: DiplomaChip;
  let fixture: ComponentFixture<DiplomaChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiplomaChip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiplomaChip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
