import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../Services/user.service';
import { ChatService } from '../../Services/chat.serivce';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IConversation } from '../../Models/user.detials.model';
import { AddUserPopupComponent } from '../../popupComponents/add-user-popup.component/add-user-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { CallService } from '../../Services/call.service';
import { VedioCallPopupComponentComponent } from '../../popupComponents/vedio-call-popup-component/vedio-call-popup-component.component';

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
    private dialog: MatDialog,
    private callService: CallService
  ) { }

  async ngOnInit(): Promise<void> {
    this.userService.currentUserSubject.subscribe(user => {
      this.loginUserId = Number(user?.userId);
    });
    this.currentUserDetialService.refreshSidebar$.subscribe(() => {
      this.loadConversations();
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

  async startAudioCall(conversation: IConversation, event: MouseEvent) {
    event.stopPropagation(); // Prevent conversation selection
    
    try {
      await this.callService.initializeCall(
        'audio', 
        String(conversation.otherUserId),
        conversation.otherUserName,
        conversation.otherUserProfilePicture || this.defaultProfileImage
      );
      
      // Open the call popup
      const dialogRef = this.dialog.open(VedioCallPopupComponentComponent, {
        data: {
          callType: 'audio',
          participantId: conversation.otherUserId,
          participantName: conversation.otherUserName,
          participantAvatar: conversation.otherUserProfilePicture || this.defaultProfileImage
        },
        disableClose: true,
        panelClass: 'draggable-dialog'
      });

      // Handle dialog close
      dialogRef.afterClosed().subscribe(result => {
        if (result !== 'ended') {
          // Call was cancelled or closed without ending
          this.callService.cancelCall();
        }
      });
    } catch (error) {
      console.error('Failed to start audio call:', error);
      alert('Failed to start audio call. Please try again.');
    }
  }

  async startVideoCall(conversation: IConversation, event: MouseEvent) {
    event.stopPropagation(); // Prevent conversation selection
    
    try {
      await this.callService.initializeCall(
        'video', 
        String(conversation.otherUserId),
        conversation.otherUserName,
        conversation.otherUserProfilePicture || this.defaultProfileImage
      );
      
      // Open the call popup
      const dialogRef = this.dialog.open(VedioCallPopupComponentComponent, {
        data: {
          callType: 'video',
          participantId: conversation.otherUserId,
          participantName: conversation.otherUserName,
          participantAvatar: conversation.otherUserProfilePicture || this.defaultProfileImage
        },
        disableClose: true,
        panelClass: 'draggable-dialog'
      });

      // Handle dialog close
      dialogRef.afterClosed().subscribe(result => {
        if (result !== 'ended') {
          // Call was cancelled or closed without ending
          this.callService.cancelCall();
        }
      });
    } catch (error) {
      console.error('Failed to start video call:', error);
      alert('Failed to start video call. Please try again.');
    }
  }

}