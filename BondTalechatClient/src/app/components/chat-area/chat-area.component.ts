import { Component } from '@angular/core';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { PreviousChatListAreaComponent } from '../previous-chat-list-area/previous-chat-list-area.component';
import { MessageInputTypeBoxComponent } from '../message-input-type-box/message-input-type-box.component';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [ChatHeaderComponent,PreviousChatListAreaComponent,MessageInputTypeBoxComponent],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss'
})
export class ChatAreaComponent {

}
