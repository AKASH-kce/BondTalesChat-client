import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { ChatService } from '../../services/chat.serivce';
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

  constructor(private chatService: ChatService) {

  }
  async ngOnInit(): Promise<void> {
    const userList = await this.chatService.getAllUserList();
    console.log("Users from SignalR:", userList);

    this.users = userList.map(u => ({
      name: u.username,
      ProfileImageURl: u.profilePicture ?? this.ProfileImageURl,
      lastMessageTime: "time",
      lastMessage: "last message"
    }));
  }

}
