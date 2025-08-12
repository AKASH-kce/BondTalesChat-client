import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
export interface IUserMessage {
  ProfileImageURl: string;
  name: string;
  lastMessageTime: string;
  lastMessage: string;
}
@Component({
  selector: 'app-users-list-side-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list-side-bar.component.html',
  styleUrl: './users-list-side-bar.component.scss'
})
export class UsersListSideBarComponent implements OnInit {

  ProfileImageURl: string = "/images/profile.jpeg"
  users: IUserMessage[] = [];

  ngOnInit(): void {
    this.users.push(
      {
        name: "akash",
        ProfileImageURl: this.ProfileImageURl,
        lastMessageTime: "time",
        lastMessage: "last message"
      },
      {
        name: "koushiik",
        ProfileImageURl: this.ProfileImageURl,
        lastMessageTime: "time",
        lastMessage: "last message"
      }
    )
  }

}
