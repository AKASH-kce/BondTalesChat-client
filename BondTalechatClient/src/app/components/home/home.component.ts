import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ChatAreaComponent } from '../chat-area/chat-area.component';
import { RightSidebarComponent } from '../right-sidebar/right-sidebar.component';
import { NavbarTopComponent } from '../navbar-top/navbar-top.component';
import { LeftSidebarComponent } from '../left-sidebar/left-sidebar.component';
import { UsersListSideBarComponent } from '../users-list-side-bar/users-list-side-bar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    NavbarTopComponent,
    ChatAreaComponent,
    RightSidebarComponent,
    LeftSidebarComponent,
    UsersListSideBarComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnInit {
  // Mobile navigation state
  showLeftSidebar = false;
  showUserList = false;
  showChatView = true;
  showMobileOverlay = false;
  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    
    if (!this.isMobile) {
      // Desktop layout - show all components by default
      this.showLeftSidebar = true;  // Show left sidebar in desktop
      this.showUserList = true;     // Show user list in desktop
      this.showChatView = true;     // Show chat view in desktop
      this.showMobileOverlay = false;
      
      // Remove mobile classes from DOM elements
      const container = document.querySelector('.container');
      if (container) {
        container.classList.remove('mobile-active');
      }
    } else {
      // Default mobile state - show user list
      this.showLeftSidebar = false;
      this.showUserList = true;
      this.showChatView = false;
      this.showMobileOverlay = false;
    }
  }

  toggleLeftSidebar(): void {
    if (this.isMobile) {
      this.showLeftSidebar = !this.showLeftSidebar;
      this.showMobileOverlay = this.showLeftSidebar;
      this.showUserList = false;
      this.showChatView = false;
    }
  }

  toggleUserList(): void {
    if (this.isMobile) {
      this.showUserList = !this.showUserList;
      this.showMobileOverlay = this.showUserList;
      this.showLeftSidebar = false;
      this.showChatView = false;
    }
  }

  toggleChatView(): void {
    if (this.isMobile) {
      this.showChatView = !this.showChatView;
      this.showMobileOverlay = this.showChatView;
      this.showLeftSidebar = false;
      this.showUserList = false;
    }
  }

  closeMobileViews(): void {
    this.showLeftSidebar = false;
    this.showUserList = false;
    this.showChatView = false;
    this.showMobileOverlay = false;
  }

  // Method to be called when a conversation is selected (from user list)
  onConversationSelected(): void {
    if (this.isMobile) {
      this.showChatView = true;
      this.showUserList = false;
      this.showLeftSidebar = false;
      this.showMobileOverlay = false;
    }
  }

  ngAfterViewInit(): void {
    const resizer = document.getElementById('dragMe');
    const container = document.querySelector('.container') as HTMLElement;

    let isResizing = false;

    resizer?.addEventListener('mousedown', () => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing || this.isMobile) return;

      const minWidth = 150; // min user list width
      const maxWidth = 400; // max user list width
      const newWidth = Math.min(
        Math.max(e.clientX - container.offsetLeft - 200, minWidth), // subtract left sidebar width (200px)
        maxWidth
      );

      container.style.gridTemplateColumns = `200px ${newWidth}px 5px 1fr`;
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.style.cursor = 'default';
    });
  }
}
