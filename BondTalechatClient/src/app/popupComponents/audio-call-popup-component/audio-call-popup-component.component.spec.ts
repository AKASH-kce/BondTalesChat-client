import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioCallPopupComponentComponent } from './audio-call-popup-component.component';

describe('AudioCallPopupComponentComponent', () => {
  let component: AudioCallPopupComponentComponent;
  let fixture: ComponentFixture<AudioCallPopupComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioCallPopupComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudioCallPopupComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
