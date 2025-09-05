import { Component, ViewChild } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../Services/chat.Service';
import { IUserDetial, IUserMessage } from '../../Models/user.detials.model';
import { UserService } from '../../Services/user.service';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { CommonModule } from '@angular/common';
import { UsersListSideBarComponent } from '../../components/users-list-side-bar/users-list-side-bar.component';

@Component({
  selector: 'app-add-user-popup',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './add-user-popup.component.html',
  styleUrls: ['./add-user-popup.component.scss']
})
export class AddUserPopupComponent {
  constructor(private chatService: ChatService, private dialogRef: MatDialogRef<AddUserPopupComponent>, private userservice: UserService, private CurrentUserDetialService: currentUserDetialsService) { }
  users: IUserMessage[] = [];
  @ViewChild(UsersListSideBarComponent) sidebar!: UsersListSideBarComponent;
  loginUserId: number | undefined;
  ProfileImageURl: string = "/images/profile.jpeg"
  async ngOnInit() {
    this.userservice.currentUserSubject.subscribe(User => {
      this.loginUserId = Number(User?.userId);
    });
    const userList = await this.chatService.getAllUserList();

    this.users = userList
      .filter(u => u.userId !== this.loginUserId)
      .map(u => ({
        userId: u.userId,
        name: u.username,
        ProfileImageURl: u.profilePicture ?? this.ProfileImageURl,
        lastMessageTime: "time",
        lastMessage: "last message"
      }));
  }


  userClicked(user: IUserMessage, event: MouseEvent) {
    this.CurrentUserDetialService.sendUserDetials({
      user: {
        userId: user.userId,
        name: user.name,
        ProfileImageURl: user.ProfileImageURl || this.ProfileImageURl,
        lastMessageTime: user.lastMessageTime,
        lastMessage: user.lastMessage ?? ""
      },
      event
    });
    this.chatService.getOrCreateConversation(user.userId).subscribe({
      next: async (conversationId: number) => {
        this.CurrentUserDetialService.setCurrentConversation(conversationId);
        // Refresh the conversation list in the sidebar
        if (this.sidebar) {
          await this.sidebar.loadConversations();
        }
        this.closeDialog();
      },
      error: (err) => console.error("Error creating conversation:", err)
    });
  }

  closeDialog() {
    this.CurrentUserDetialService.triggerSidebarRefresh();
    this.dialogRef.close();
  }

  addToFriendList(user: any) {
    console.log("Add to friend list", user);
  }
}
