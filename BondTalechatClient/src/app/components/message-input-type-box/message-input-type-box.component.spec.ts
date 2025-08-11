import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageInputTypeBoxComponent } from './message-input-type-box.component';

describe('MessageInputTypeBoxComponent', () => {
  let component: MessageInputTypeBoxComponent;
  let fixture: ComponentFixture<MessageInputTypeBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageInputTypeBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageInputTypeBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
