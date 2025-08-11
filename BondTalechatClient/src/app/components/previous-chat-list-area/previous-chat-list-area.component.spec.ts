import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousChatListAreaComponent } from './previous-chat-list-area.component';

describe('PreviousChatListAreaComponent', () => {
  let component: PreviousChatListAreaComponent;
  let fixture: ComponentFixture<PreviousChatListAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousChatListAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousChatListAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
