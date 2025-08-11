import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AleartMessageComponent } from './aleart-message.component';

describe('AleartMessageComponent', () => {
  let component: AleartMessageComponent;
  let fixture: ComponentFixture<AleartMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AleartMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AleartMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
