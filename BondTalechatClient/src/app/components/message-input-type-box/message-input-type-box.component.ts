import { CommonModule } from '@angular/common';
import { ChatService } from '../../Services/chat.serivce';
import { Component, OnInit } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../Services/user.service';
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
  userId: number = 0;
  constructor(private chatService: ChatService, private userService: UserService) { }
  ngOnInit(): void {
    this.chatService.startConnection();
    this.userSubscription = this.userService.currentUserSubject.subscribe(
      user => {
        this.userId = user?.userId ?? 0;
      });
  }
  send() {
    if (this.messageText.trim() !== '') {
      const senderId = Number(this.userId);
      if (this.messageText.trim() !== '' && senderId > 0) {
        this.chatService.sendMessage(1, senderId, this.messageText);
      }
      this.messageText = ''
    }

  }
}
