import { Component, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { Router } from '@angular/router';
import { User } from '../../Models/user.model';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddUserPopupComponent } from '../../popupComponents/add-user-popup.component/add-user-popup.component';

@Component({
  selector: 'app-navbar-top',
  standalone: true,
  imports: [],
  templateUrl: './navbar-top.component.html',
  styleUrl: './navbar-top.component.scss',
})
export class NavbarTopComponent implements OnInit {
  username?: string | null;
  private userSubscription!: Subscription;
  constructor(private userService: UserService, private router: Router,private dialog: MatDialog) {}

  ngOnInit(): void {
    // var users = this.userService.getUser();
    // console.log("This is the user"+ users.username);

    this.userSubscription = this.userService.currentUserSubject.subscribe(
      user => {
        this.username = user?.username || null;
        console.log("User updated:", user);
      }
    )
  }

   onAddUser() {
    this.dialog.open(AddUserPopupComponent);
  }

  navigateToUserProfile(): void {
    this.router.navigate(['/userProfile']);
  }

  onLogout(): void {
    const confirmed = confirm('Are you sure do you want to logout ?');
    if (confirmed) {
      this.userService.logout().subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['']);
            alert(response.message);
          }
        },
        error: () => {
          console.error('logout failed due to an network error.');
          this.router.navigate(['']);
        },
      });
    }
  }
}
