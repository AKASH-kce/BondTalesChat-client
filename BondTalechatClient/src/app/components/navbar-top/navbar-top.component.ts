import { Component, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { Router } from '@angular/router';
import { User } from '../../Models/user.model';

@Component({
  selector: 'app-navbar-top',
  standalone: true,
  imports: [],
  templateUrl: './navbar-top.component.html',
  styleUrl: './navbar-top.component.scss',
})
export class NavbarTopComponent implements OnInit {
  username?: string | null;
  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    // this.userService.currentUserSubject.subscribe((user: User) => {this.username = user?.username || null});
    this.username = this.userService.getUserName();
    var user = this.userService.getUser();
    console.log("This is the user");
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
