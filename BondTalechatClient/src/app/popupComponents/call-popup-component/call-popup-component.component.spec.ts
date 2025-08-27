import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallPopupComponentComponent } from './call-popup-component.component';

describe('CallPopupComponentComponent', () => {
  let component: CallPopupComponentComponent;
  let fixture: ComponentFixture<CallPopupComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallPopupComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CallPopupComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
