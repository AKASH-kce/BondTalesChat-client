import { AfterViewInit, Component } from '@angular/core';
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
export class HomeComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const resizer = document.getElementById('dragMe');
    const container = document.querySelector('.container') as HTMLElement;

    let isResizing = false;

    resizer?.addEventListener('mousedown', () => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const minWidth = 150; // min user list width
      const maxWidth = 400; // max user list width
      const newWidth = Math.min(
        Math.max(e.clientX - container.offsetLeft, minWidth),
        maxWidth
      );

      container.style.gridTemplateColumns = `auto ${newWidth}px 5px 1fr`;
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.style.cursor = 'default';
    });
  }
}
