import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { ChatService } from '../../Services/chat.serivce';
import { User } from '../../Models/user.model';
import { Observable, Subject } from 'rxjs';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IUserDetial, IUserMessage } from '../../Models/user.detials.model';
import { ConsoleLogger } from '@microsoft/signalr/dist/esm/Utils';

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
  constructor(private chatService: ChatService,private CurrentUserDetialService:currentUserDetialsService) {

  }
  async ngOnInit(): Promise<void> {
    const userList = await this.chatService.getAllUserList();
    console.log("Users from SignalR:", userList);

    this.users = userList.map(u => ({
      userId: u.userId,
      name: u.username,
      ProfileImageURl: u.profilePicture ?? this.ProfileImageURl,
      lastMessageTime: "time",
      lastMessage: "last message"
    }));
  }

  userClicked(user:IUserMessage,event:MouseEvent){
    console.log("message click",user);
    console.log("message event",event);
    // this.userSelected.next({user,event});
    const curretUser:IUserDetial={user,event};
    this.CurrentUserDetialService.sendUserDetials(curretUser)

    this.chatService.getOrCreateConversation(user.userId).subscribe({
      next:async (conversationId:number)=>{
        this.CurrentUserDetialService.setCurrentConversation(conversationId);
        console.log("active conversationId",conversationId);
        const chats=await this.chatService.GetMessagesByConversation();
        console.log("messages"+chats);
      },
      error:(err)=>console.error("error creating conversation:",err)
    })
    
  }
}
