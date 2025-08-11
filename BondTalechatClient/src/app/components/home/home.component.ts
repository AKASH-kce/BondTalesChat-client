import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { InputMessageBoxComponent } from '../../shared/input-message-box/input-message-box.component';
import { ChatAreaComponent } from '../chat-area/chat-area.component';
import { RightSidebarComponent } from '../right-sidebar/right-sidebar.component';
import { NavbarTopComponent } from '../navbar-top/navbar-top.component';
import { LeftSidebarComponent } from '../left-sidebar/left-sidebar.component';
import { UsersListSideBarComponent } from '../users-list-side-bar/users-list-side-bar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet,RouterLink,NavbarTopComponent,ChatAreaComponent,RightSidebarComponent,LeftSidebarComponent,UsersListSideBarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
