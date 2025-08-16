import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService } from '../../services/chat.serivce';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-previous-chat-list-area',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './previous-chat-list-area.component.html',
  styleUrl: './previous-chat-list-area.component.scss'
})
export class PreviousChatListAreaComponent implements OnInit, OnDestroy {
  constructor(private chatService: ChatService) {

  }
  messages: any[] = [];
  private messageSub?: Subscription;
  ngOnInit(): void {
    this.messageSub = this.chatService.message$.subscribe((msg: any) => {
      if (msg) {
        this.messages.push(msg);
      }
    })
  }
  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
  }

}
