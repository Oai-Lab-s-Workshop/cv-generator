import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvShellPage } from './cv-shell-page';

describe('CvShellPage', () => {
  let component: CvShellPage;
  let fixture: ComponentFixture<CvShellPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvShellPage]
    }).compileComponents();

    fixture = TestBed.createComponent(CvShellPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
