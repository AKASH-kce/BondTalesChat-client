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
         },
         hasBackdrop: false, // Remove backdrop to eliminate any interference
         panelClass: 'call-selection-dialog',
         disableClose: true, // Prevent closing by clicking outside
         autoFocus: true,
         restoreFocus: true,
         position: {
           top: (event.clientY + 10) + 'px',
           left: (event.clientX - 100) + 'px'
         },
         width: '200px',
         height: 'auto'
       });

      setTimeout(() => {
        this.callDailogpopupOpen = true;
      }, 50);

      interface CallDialogResult {
        action?: 'audioCall' | 'videoCall';
      }

      this.callDialogRef.afterClosed().subscribe((result: CallDialogResult | undefined) => {
        console.log('Call selection dialog closed with result:', result);
        console.log('Result type:', typeof result);
        console.log('Result action:', result?.action);
        
        const action = result?.action;
        if (action) {
          console.log('Call action selected:', action);
          
          // Add a small delay to ensure the selection dialog is fully closed
          setTimeout(() => {
            if (action === 'audioCall') {
              console.log('Initiating audio call...');
              console.log('User ID:', this.useId);
              this.openAudioCallDialog();
            }
            
            if (action === 'videoCall') {
              console.log('Initiating video call...');
              console.log('User ID:', this.useId);
              this.openVideoCallDialog();
            }
          }, 100); // 100ms delay
        } else {
          console.warn('No action received from call selection dialog. Result:', result);
          // If no action was received, it might have been cancelled
          if (result && (result as any).action === 'cancelled') {
            console.log('Call selection was cancelled');
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

  private openAudioCallDialog(): void {
    try {
      console.log('Opening audio call dialog...');
      
      // First, try to close any existing dialogs
      this.dialogRef.closeAll();
      
      // Wait a moment for cleanup
      setTimeout(() => {
                 const audioDialogRef = this.dialogRef.open(AudioCallPopupComponentComponent, {
           data: {
             userId: this.useId,
             userName: this.currentChatUserName,
             profileImage: this.ProfileImageURl
           },
           panelClass: 'draggable-dialog',
           hasBackdrop: true,
           backdropClass: 'call-popup-backdrop',
           width: '400px',
           height: '500px',
           disableClose: false,
           autoFocus: true,
           restoreFocus: true,
           position: {
             top: '20px',
             right: '20px'
           }
         });
        
        // Add event listeners for debugging
        audioDialogRef.afterOpened().subscribe(() => {
          console.log('Audio call dialog opened successfully');
          // Force focus to ensure visibility
          setTimeout(() => {
            const dialogElement = document.querySelector('.draggable-dialog .mat-mdc-dialog-container');
            if (dialogElement) {
              (dialogElement as HTMLElement).focus();
              console.log('Audio dialog focused');
            }
          }, 100);
        });
        
        audioDialogRef.afterClosed().subscribe((result) => {
          console.log('Audio call dialog closed with result:', result);
        });
        
        // Fallback: If dialog doesn't open after 500ms, try again
        setTimeout(() => {
          const existingDialog = document.querySelector('.draggable-dialog');
          if (!existingDialog) {
            console.warn('Dialog not visible, attempting fallback...');
            this.openAudioCallDialogFallback();
          }
        }, 500);
        
      }, 50);
      
    } catch (error) {
      console.error('Error opening audio call dialog:', error);
      this.openAudioCallDialogFallback();
    }
  }

  private openAudioCallDialogFallback(): void {
    try {
      console.log('Opening audio call dialog (fallback)...');
             const audioDialogRef = this.dialogRef.open(AudioCallPopupComponentComponent, {
         data: {
           userId: this.useId,
           userName: this.currentChatUserName,
           profileImage: this.ProfileImageURl
         },
         panelClass: 'draggable-dialog',
         hasBackdrop: true,
         backdropClass: 'call-popup-backdrop',
         width: '400px',
         height: '500px',
         disableClose: false,
         autoFocus: false,
         restoreFocus: false,
         position: {
           top: '20px',
           right: '20px'
         }
       });
      
      audioDialogRef.afterOpened().subscribe(() => {
        console.log('Audio call dialog opened successfully (fallback)');
      });
      
    } catch (error) {
      console.error('Error opening audio call dialog (fallback):', error);
      alert('Failed to open audio call dialog. Please try again.');
    }
  }

  private openVideoCallDialog(): void {
    try {
      console.log('Opening video call dialog...');
      
      // First, try to close any existing dialogs
      this.dialogRef.closeAll();
      
      // Wait a moment for cleanup
      setTimeout(() => {
                 const videoDialogRef = this.dialogRef.open(VedioCallPopupComponentComponent, {
           data: {
             userId: this.useId,
             participantId: this.useId,
             participantName: this.currentChatUserName,
             participantAvatar: this.ProfileImageURl,
             callType: 'video'
           },
           panelClass: 'draggable-dialog',
           hasBackdrop: true,
           backdropClass: 'call-popup-backdrop',
           width: '800px',
           height: '600px',
           disableClose: false,
           autoFocus: true,
           restoreFocus: true,
           position: {
             top: '20px',
             right: '20px'
           }
         });
        
        // Add event listeners for debugging
        videoDialogRef.afterOpened().subscribe(() => {
          console.log('Video call dialog opened successfully');
          // Force focus to ensure visibility
          setTimeout(() => {
            const dialogElement = document.querySelector('.draggable-dialog .mat-mdc-dialog-container');
            if (dialogElement) {
              (dialogElement as HTMLElement).focus();
              console.log('Video dialog focused');
            }
          }, 100);
        });
        
        videoDialogRef.afterClosed().subscribe((result) => {
          console.log('Video call dialog closed with result:', result);
        });
        
        // Fallback: If dialog doesn't open after 500ms, try again
        setTimeout(() => {
          const existingDialog = document.querySelector('.draggable-dialog');
          if (!existingDialog) {
            console.warn('Video dialog not visible, attempting fallback...');
            this.openVideoCallDialogFallback();
          }
        }, 500);
        
      }, 50);
      
    } catch (error) {
      console.error('Error opening video call dialog:', error);
      this.openVideoCallDialogFallback();
    }
  }

  private openVideoCallDialogFallback(): void {
    try {
      console.log('Opening video call dialog (fallback)...');
             const videoDialogRef = this.dialogRef.open(VedioCallPopupComponentComponent, {
         data: {
           userId: this.useId,
           participantId: this.useId,
           participantName: this.currentChatUserName,
           participantAvatar: this.ProfileImageURl,
           callType: 'video'
         },
         panelClass: 'draggable-dialog',
         hasBackdrop: true,
         backdropClass: 'call-popup-backdrop',
         width: '800px',
         height: '600px',
         disableClose: false,
         autoFocus: false,
         restoreFocus: false,
         position: {
           top: '20px',
           right: '20px'
         }
       });
      
      videoDialogRef.afterOpened().subscribe(() => {
        console.log('Video call dialog opened successfully (fallback)');
      });
      
    } catch (error) {
      console.error('Error opening video call dialog (fallback):', error);
      alert('Failed to open video call dialog. Please try again.');
    }
  }


}
