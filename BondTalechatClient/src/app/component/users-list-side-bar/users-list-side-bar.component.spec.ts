import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersListSideBarComponent } from './users-list-side-bar.component';

describe('UsersListSideBarComponent', () => {
  let component: UsersListSideBarComponent;
  let fixture: ComponentFixture<UsersListSideBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersListSideBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersListSideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
