import { Component, OnInit } from '@angular/core';
import { currentUserDetialsService } from '../../Services/current-user-detials-service';
import { IUserDetial } from '../../Models/user.detials.model';
import { MatDialog } from '@angular/material/dialog';
import { CallPopupComponentComponent } from '../../popupComponents/call-popup-component/call-popup-component.component';
import { CommonModule } from '@angular/common';
import { AudioCallPopupComponentComponent } from '../../popupComponents/audio-call-popup-component/audio-call-popup-component.component';
import { VedioCallPopupComponentComponent } from '../../popupComponents/vedio-call-popup-component/vedio-call-popup-component.component';
import { CallService } from '../../Services/call.service';
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
  useId: number | undefined;

  constructor(private currentUserDetialService: currentUserDetialsService, private dialogRef: MatDialog,private callService:CallService) {

  }
  ngOnInit(): void {
    this.currentUserDetialService.getMessage().subscribe({
      next: (data: IUserDetial) => {
        this.useId = data.user.userId ?? 0;
        this.currentChatUserName = data.user.name ?? "unknown";
        this.ProfileImageURl = data.user.ProfileImageURl ?? "/images/profile.jpeg";
      }
    })
  }
  openCallPopup(event: MouseEvent) {
    const vibrateInterval = setInterval(() => {
      if (navigator.vibrate) {
        navigator.vibrate([500, 300]);
      }
    }, 1000);
  
      this.callService.ensureCallHub().catch((e) => { console.error('Failed to connect CallHub after view init', e);});
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) => {
      clearInterval(vibrateInterval);
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
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

      interface CallDialogResult {
        action?: 'audioCall' | 'videoCall';
      }

      this.callDialogRef.afterClosed().subscribe((result: CallDialogResult | undefined) => {
        const action = result?.action;
        if (action) {
          console.log('Call action:', action);
          if (action === 'audioCall') {
            console.log('Initiating audio call...');
            console.log('User ID:', this.useId);
            this.dialogRef.open(AudioCallPopupComponentComponent, {
              data: {
                userId: this.useId,
                userName: this.currentChatUserName,
                profileImage: this.ProfileImageURl
              },
              panelClass: 'draggable-dialog'
            });
          }
          if (action === 'videoCall') {
            console.log('Initiating video call...');
            console.log('User ID:', this.useId);
            this.dialogRef.open(VedioCallPopupComponentComponent, {
              data: {
                userId: this.useId,
                userName: this.currentChatUserName,
                profileImage: this.ProfileImageURl
              },
              panelClass: 'draggable-dialog'
            });
          }
        }
        this.callDailogpopupOpen = false;
        this.callDialogRef = undefined;
      });
    }).catch((error) => {
      clearInterval(vibrateInterval);
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
      console.error('Error accessing media devices.', error);
      alert('Error accessing media devices. Please ensure you have a microphone and camera connected, and that you have granted permission to access them.');
    });
  }


}
