import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { Router } from '@angular/router';
import { User } from '../../Models/user.model';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddUserPopupComponent } from '../../popupComponents/add-user-popup.component/add-user-popup.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar-top',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './navbar-top.component.html',
  styleUrl: './navbar-top.component.scss',
})
export class NavbarTopComponent implements OnInit {
  @Output() toggleLeftSidebar = new EventEmitter<void>();
  @Output() toggleUserList = new EventEmitter<void>();
  @Output() toggleChatView = new EventEmitter<void>();

  username?: string | null;
  private userSubscription!: Subscription;
  showBackButton = false;
  isMobile = false;

  constructor(private userService: UserService, private router: Router, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.checkScreenSize();
    
    this.userSubscription = this.userService.currentUserSubject.subscribe(
      user => {
        this.username = user?.username || null;
        console.log("User updated:", user);
      }
    )
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  onToggleLeftSidebar(): void {
    this.toggleLeftSidebar.emit();
  }

  onToggleUserList(): void {
    this.toggleUserList.emit();
  }

  onToggleChatView(): void {
    this.toggleChatView.emit();
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
