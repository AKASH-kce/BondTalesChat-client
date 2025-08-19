import { Component, OnInit } from '@angular/core';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IUserDetial } from '../../Models/user.detials.model';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss'
})
export class ChatHeaderComponent implements OnInit {

  currentChatUserName: string = "";
  ProfileImageURl: string = ""
  constructor(private currentUserDetialService: currentUserDetialsService) {

  }
  ngOnInit(): void {
    this.currentUserDetialService.getMessage().subscribe({
      next: (data: IUserDetial) => {
        this.currentChatUserName = data.user.name ?? "unknown";
        this.ProfileImageURl = data.user.ProfileImageURl ?? "/images/profile.jpeg";
      }
    })
  }

}
