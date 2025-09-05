import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { CallService } from '../../Services/call.service';
import { UserService } from '../../Services/user.service';

@Component({
  selector: 'app-incoming-call-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incoming-call-popup.component.html',
  styleUrls: ['./incoming-call-popup.component.scss']
})
export class IncomingCallPopupComponent implements OnInit, OnDestroy {
  callData: any;
  isProcessing = false;
  callTimer: any;
  callDuration = 0;

  constructor(
    private dialogRef: MatDialogRef<IncomingCallPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private callService: CallService,
    private userService: UserService
  ) {
    this.callData = data;
    console.log('Incoming call popup opened with data:', data);
  }

  ngOnInit(): void {
    // Start call timer to show duration
    this.startCallTimer();
    
    // Auto-decline after 30 seconds if not answered
    setTimeout(() => {
      if (!this.isProcessing) {
        this.declineCall();
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
    }
  }

  private startCallTimer(): void {
    this.callTimer = setInterval(() => {
      this.callDuration++;
    }, 1000);
  }

  async acceptCall(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Accepting call:', this.callData);

    try {
      // Ensure CallHub is connected
      await this.callService.ensureCallHub();
      
      // Answer the call
      await this.callService.answerCall({
        callId: this.callData.callId,
        participantId: this.callData.participantId,
        participantName: this.callData.participantName,
        callType: this.callData.callType,
        isIncoming: true
      });

      // Close this popup and let the video/audio call popup handle the rest
      this.dialogRef.close({ action: 'accepted', callData: this.callData });
      
    } catch (error) {
      console.error('Error accepting call:', error);
      this.isProcessing = false;
      // Show error message to user
      alert('Failed to accept call. Please try again.');
    }
  }

  async declineCall(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Declining call:', this.callData);

    try {
      // Ensure CallHub is connected
      await this.callService.ensureCallHub();
      
      // Decline the call
      await this.callService.declineCall(this.callData.callId);
      
      // Close the popup
      this.dialogRef.close({ action: 'declined' });
      
    } catch (error) {
      console.error('Error declining call:', error);
      this.isProcessing = false;
      // Even if decline fails, close the popup
      this.dialogRef.close({ action: 'declined' });
    }
  }

  getCallTypeIcon(): string {
    return this.callData?.callType === 'video' ? 'fa-video' : 'fa-phone';
  }

  getCallTypeText(): string {
    return this.callData?.callType === 'video' ? 'Video Call' : 'Audio Call';
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
