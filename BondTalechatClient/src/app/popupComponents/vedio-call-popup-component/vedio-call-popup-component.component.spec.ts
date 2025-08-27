import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VedioCallPopupComponentComponent } from './vedio-call-popup-component.component';

describe('VedioCallPopupComponentComponent', () => {
  let component: VedioCallPopupComponentComponent;
  let fixture: ComponentFixture<VedioCallPopupComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VedioCallPopupComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VedioCallPopupComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
