import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassicCvPage } from './classic-cv-page';

describe('ClassicCvPage', () => {
  let component: ClassicCvPage;
  let fixture: ComponentFixture<ClassicCvPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassicCvPage]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassicCvPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
