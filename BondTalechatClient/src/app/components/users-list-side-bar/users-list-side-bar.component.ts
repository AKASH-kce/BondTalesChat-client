import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../Services/user.service';
import { ChatService } from '../../Services/chat.serivce';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IConversation } from '../../Models/user.detials.model';
import { AddUserPopupComponent } from '../../popupComponents/add-user-popup.component.ts/add-user-popup.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-users-list-side-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list-side-bar.component.html',
  styleUrls: ['./users-list-side-bar.component.scss']
})
export class UsersListSideBarComponent implements OnInit {
  defaultProfileImage: string = "/images/profile.jpeg";
  conversations: IConversation[] = [];
  loginUserId: number | undefined;

  constructor(
    private chatService: ChatService,
    public currentUserDetialService: currentUserDetialsService,
    private userService: UserService,
    private dialog: MatDialog
  ) { }

  async ngOnInit(): Promise<void> {
    this.userService.currentUserSubject.subscribe(user => {
      this.loginUserId = Number(user?.userId);
    });

    await this.loadConversations();
  }

  async loadConversations(): Promise<void> {
    this.conversations = await this.chatService.getUserConversations();
  }

  conversationClicked(conversation: IConversation, event: MouseEvent) {
    // Set the current conversation
    this.currentUserDetialService.setCurrentConversation(conversation.conversationId);

    // Load messages for this conversation
    this.chatService.GetMessagesByConversation().then(messages => {
      // Messages will be handled by the chat component
    });

    // Notify other components about the selected conversation
    this.currentUserDetialService.sendUserDetials({
      user: {
        userId: conversation.otherUserId,
        name: conversation.otherUserName,
        ProfileImageURl: conversation.otherUserProfilePicture || this.defaultProfileImage,
        lastMessageTime: conversation.lastMessageTime,
        lastMessage: conversation.lastMessage ?? ""
      },
      event
    });
  }
  openAddUserDialog() {
    this.dialog.open(AddUserPopupComponent);
  }

}