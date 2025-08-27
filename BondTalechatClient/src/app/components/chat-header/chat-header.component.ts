import { Component, OnInit } from '@angular/core';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IUserDetial } from '../../Models/user.detials.model';
import { MatDialog } from '@angular/material/dialog';
import { CallPopupComponentComponent } from '../../popupComponents/call-popup-component/call-popup-component.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss'
})
export class ChatHeaderComponent implements OnInit {

  currentChatUserName: string = "";
  ProfileImageURl: string = ""
  callDailogpopupOpen: boolean = false;
  callDialogRef: any; 

  constructor(private currentUserDetialService: currentUserDetialsService, private dialogRef: MatDialog) {

  }
  ngOnInit(): void {
    this.currentUserDetialService.getMessage().subscribe({
      next: (data: IUserDetial) => {
        this.currentChatUserName = data.user.name ?? "unknown";
        this.ProfileImageURl = data.user.ProfileImageURl ?? "/images/profile.jpeg";
      }
    })
  }
  openCallPopup(event: MouseEvent) {
    if (this.callDialogRef) {
      this.callDialogRef.close();
      return;
    }

    this.callDialogRef = this.dialogRef.open(CallPopupComponentComponent, {
      data: {
        userName: this.currentChatUserName,
        profileImage: this.ProfileImageURl,
        event: event
      }
    });

    setTimeout(() => {
      this.callDailogpopupOpen = true;
    }, 50);

    this.callDialogRef.afterClosed().subscribe(() => {
      this.callDailogpopupOpen = false;
      this.callDialogRef = undefined;
    });
  }


}
