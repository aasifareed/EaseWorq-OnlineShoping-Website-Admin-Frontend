import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RtlSidePanelComponent } from './rtl-side-panel.component';

describe('RtlSidePanelComponent', () => {
  let component: RtlSidePanelComponent;
  let fixture: ComponentFixture<RtlSidePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RtlSidePanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RtlSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
