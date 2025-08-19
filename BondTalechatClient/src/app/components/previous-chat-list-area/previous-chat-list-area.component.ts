import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ChatService } from '../../Services/chat.serivce';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../Services/user.service';

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
   
  constructor(private chatService: ChatService,private userservice:UserService) {}

  async ngOnInit(): Promise<void> {
    await this.chatService.startConnection(); // wait until connected

    // Fetch all messages after connection is established
    this.messages = await this.chatService.getAllMessageOfCurrentLoginUser(1);
  this.userservice.currentUserSubject.subscribe(user => {
  console.log("Current user data:", user);
});

    // Subscribe to incoming messages
    this.messageSub = this.chatService.message$.subscribe((msg: any) => {
      if (msg && !this.messages.some(m => m.messageId === msg.messageId)) {
        this.messages.push(msg);
      }
    });
  }

  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
  }
}
