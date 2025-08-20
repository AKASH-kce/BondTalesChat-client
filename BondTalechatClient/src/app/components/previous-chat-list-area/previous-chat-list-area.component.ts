import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ChatService } from '../../Services/chat.serivce';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../Services/user.service';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IUserDetial } from '../../Models/user.detials.model';

@Component({
  selector: 'app-previous-chat-list-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './previous-chat-list-area.component.html',
  styleUrls: ['./previous-chat-list-area.component.scss']
})
export class PreviousChatListAreaComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  isTyping: boolean = false;
  ProfileImageURl: string = "/images/profile.jpeg";
  private messageSub?: Subscription;
  currentUserChatId: number | unknown;

  constructor(private chatService: ChatService, private userservice: UserService, private currentUserDetialService: currentUserDetialsService) { }

  async ngOnInit(): Promise<void> {
    await this.chatService.startConnection(); // wait until connected

    // Fetch all messages after connection is established
    this.messages = await this.chatService.getAllMessageOfCurrentLoginUser(1);
    this.userservice.currentUserSubject.subscribe(user => {
      console.log("Current user data:", user);
    });

    this.currentUserDetialService.getMessage().subscribe({
      next: async (data: IUserDetial) => {
        this.currentUserChatId = data.user.userId ?? "unknown";
        this.ProfileImageURl = data.user.ProfileImageURl ?? "/images/profile.jpeg";
        this.chatService.getOrCreateConversation(data.user.userId).subscribe(conversationId => {
  this.currentUserDetialService.setCurrentConversation(conversationId);
});

        const message=await this.chatService.GetMessagesByConversation();
        this.messages=message;
        this.messages = await this.chatService.getAllMessageOfCurrentLoginUser(this.currentUserChatId);
        this.messages = this.messages.filter(msg => msg.senderId === this.currentUserChatId);
      }
    })
    const msgs = await this.chatService.GetMessagesByConversation();
    console.log("Conversation messages:", msgs);
  }

  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
  }
}
