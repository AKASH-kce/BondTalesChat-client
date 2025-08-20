import { CommonModule } from '@angular/common';
import { ChatService } from '../../Services/chat.serivce';
import { Component, OnInit } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../Services/user.service';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IUserDetial } from '../../Models/user.detials.model';
@Component({
  selector: 'app-message-input-type-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input-type-box.component.html',
  styleUrl: './message-input-type-box.component.scss'
})
export class MessageInputTypeBoxComponent implements OnInit {
  messageText: string = "";
  userSubscription: any;
  userId: number | unknown;
  constructor(private chatService: ChatService, private userService: UserService, private currentUserDetialService: currentUserDetialsService) { }
  ngOnInit(): void {
    this.chatService.startConnection();
    // this.userSubscription = this.userService.currentUserSubject.subscribe(
    //   user => {
    //     this.userId = user?.userId ?? 0;
    //   });
    this.currentUserDetialService.getMessage().subscribe({
      next: (data: IUserDetial) => {
        this.userId = data.user.userId ?? "unknown";
      }
    })
  }

  send() {
  if (this.messageText.trim() !== '') {
    const senderId = Number(this.userId);

    if (senderId > 0) {
      this.chatService.getOrCreateConversation(senderId).subscribe({
        next: (conversationId: number) => {
          this.chatService.sendMessage(conversationId, senderId, this.messageText);
          this.messageText = '';
        },
        error: err => console.error('Error creating conversation', err)
      });
    }
  }
}

}
