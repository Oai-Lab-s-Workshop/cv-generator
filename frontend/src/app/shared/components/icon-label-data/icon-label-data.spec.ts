import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconLabelData } from './icon-label-data';

describe('IconLabelData', () => {
  let component: IconLabelData;
  let fixture: ComponentFixture<IconLabelData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconLabelData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconLabelData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect valid links', () => {
    expect(component.isLink('https://example.com')).toBe(true);
    expect(component.isLink('example.com')).toBe(true);
    expect(component.isLink('not a link')).toBe(false);
  });
});
