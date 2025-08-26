import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserPopupComponentTsComponent } from './add-user-popup.component.ts.component';

describe('AddUserPopupComponentTsComponent', () => {
  let component: AddUserPopupComponentTsComponent;
  let fixture: ComponentFixture<AddUserPopupComponentTsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserPopupComponentTsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUserPopupComponentTsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
