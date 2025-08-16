import { CommonModule } from '@angular/common';
import { ChatService } from './../../services/chat.serivce';
import { Component, OnInit } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-message-input-type-box',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './message-input-type-box.component.html',
  styleUrl: './message-input-type-box.component.scss'
})
export class MessageInputTypeBoxComponent implements OnInit{
  messageText:string="";
constructor( private chatService:ChatService){}
  ngOnInit(): void {
   this.chatService.startConnection();
  }
send(){
  if(this.messageText.trim()!==''){
    this.chatService.sendMessage(2,1,this.messageText);
    this.messageText=''
  }

}
}
