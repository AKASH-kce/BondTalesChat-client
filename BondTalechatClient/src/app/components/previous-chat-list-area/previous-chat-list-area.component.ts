import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ChatService } from '../../Services/chat.serivce';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../Services/user.service';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IUserDetial } from '../../Models/user.detials.model';

export interface IConversationMessage {
  conversation?:any,
  conversationId: number;
  messageId: number;
  senderId: number;
  messageText: string;
  messageType: number;
  sentAt: string;   // or Date if you want to parse
  mediaUrl?: string | null;
  sender?: any | null; // you can replace `any` with IUser if you have it
  deleted: boolean;
  edited: boolean;
}

@Component({
  selector: 'app-previous-chat-list-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './previous-chat-list-area.component.html',
  styleUrls: ['./previous-chat-list-area.component.scss']
})
export class PreviousChatListAreaComponent implements OnInit {
  messages: IConversationMessage[] = [];
  isTyping: boolean = false;
  ProfileImageURl: string = "/images/profile.jpeg";
  currentUserChatId: number | unknown;

  constructor(private chatService: ChatService, private userservice: UserService, private currentUserDetialService: currentUserDetialsService) { }

  async ngOnInit(): Promise<void> {
    await this.chatService.startConnection(); 

    this.currentUserDetialService.getCurrentConversation().subscribe({
      next:async (conversationId:number|null)=>{
        const messages=await this.chatService.GetMessagesByConversation();
        this.messages=messages;
        for(var msg of messages){
            console.log(msg);
        }
       
      }
    })

    this.currentUserDetialService.getMessage().subscribe({
      next: async (data: IUserDetial) => {
        this.currentUserChatId = data.user.userId ?? "unknown";
        this.ProfileImageURl = data.user.ProfileImageURl ?? "/images/profile.jpeg";
      }
    })
  }
}
