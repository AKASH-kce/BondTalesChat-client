import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { VideoSrcDirective } from '../../shared/video-src.directive';
import { CallService, CallState, CallParticipant } from '../../Services/call.service';
import { Subscription } from 'rxjs';

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: Date;
}

interface QualityBar {
  active: boolean;
}

@Component({
  selector: 'app-audio-call-popup-component',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, VideoSrcDirective],
  templateUrl: './audio-call-popup-component.component.html',
  styleUrls: ['./audio-call-popup-component.component.scss']
})
export class AudioCallPopupComponentComponent implements OnInit, OnDestroy {
  isMinimized = false;
  showMoreOptions = false;
  showChat = false;
  showSettings = false;
  isRecording = false;
  isSpeakerOn = true;
  newMessage = '';
  localUserAvatar?: string;
  
  callState: CallState = {
    isInCall: false,
    isVideoEnabled: false,
    isAudioEnabled: false,
    isScreenSharing: false,
    isMuted: false,
    callType: 'audio',
    participants: [],
    callDuration: 0,
    callStartTime: null,
    connectionQuality: 'excellent'
  };

  chatMessages: ChatMessage[] = [];
  
  private callStateSubscription?: Subscription;

  constructor(
    private dialogRef: MatDialogRef<AudioCallPopupComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: number, userName?: string },
    private callService: CallService
  ) {}

  ngOnInit() {
    this.initializeCall();
    this.subscribeToCallState();
    this.loadLocalUserAvatar();
  }

  ngOnDestroy() {
    this.callStateSubscription?.unsubscribe();
  }

  private async initializeCall() {
    try {
      await this.callService.initializeCall(
        'audio', 
        this.data.userId.toString(),
        this.data.userName || 'Unknown',
        (this.data as any).profileImage
      );
    } catch (error) {
      console.error('Error initializing call:', error);
      this.showError(this.mapMediaError(error));
    }
  }

  private subscribeToCallState() {
    this.callStateSubscription = this.callService.callState$.subscribe(state => {
      this.callState = state;
    });
  }

  private loadLocalUserAvatar() {
    // Load local user avatar from user service or localStorage
    this.localUserAvatar = localStorage.getItem('userAvatar') || undefined;
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  async toggleAudio() {
    try {
      this.callService.toggleAudio();
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  }

  toggleSpeaker() {
    this.isSpeakerOn = !this.isSpeakerOn;
    // Implementation for speaker toggle
    console.log('Speaker toggled:', this.isSpeakerOn);
  }

  toggleMoreOptions() {
    this.showMoreOptions = !this.showMoreOptions;
  }

  toggleChat() {
    this.showChat = !this.showChat;
    this.showMoreOptions = false;
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
    this.showMoreOptions = false;
  }

  async toggleRecording() {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      } else {
        await this.startRecording();
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      this.showError('Recording is not supported in this browser.');
    }
  }

  private async startRecording() {
    // Implementation for starting recording
    this.isRecording = true;
    console.log('Recording started');
  }

  private async stopRecording() {
    // Implementation for stopping recording
    this.isRecording = false;
    console.log('Recording stopped');
  }

  inviteParticipants() {
    // Implementation for inviting more participants
    console.log('Invite participants');
    this.showMoreOptions = false;
  }

  switchToVideo() {
    // Implementation for switching to video call
    console.log('Switch to video call');
    this.showMoreOptions = false;
    // This would typically close this dialog and open video call dialog
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatMessages.push({
        sender: 'You',
        content: this.newMessage.trim(),
        timestamp: new Date()
      });
      this.newMessage = '';
    }
  }

  trackByParticipantId(index: number, participant: CallParticipant): string {
    return participant.id;
  }

  getStatusText(participant: CallParticipant): string {
    if (participant.isSpeaking) {
      return 'Speaking';
    } else if (!participant.isAudioEnabled) {
      return 'Muted';
    } else {
      return 'Connected';
    }
  }

  getQualityBars(quality: string): QualityBar[] {
    const bars: QualityBar[] = [];
    const qualityLevels = ['poor', 'fair', 'good', 'excellent'];
    const currentLevel = qualityLevels.indexOf(quality);
    
    for (let i = 0; i < 4; i++) {
      bars.push({ active: i <= currentLevel });
    }
    
    return bars;
  }

  formatDuration(seconds: number): string {
    return this.callService.formatCallDuration(seconds);
  }

  getQualityColor(quality: string): string {
    return this.callService.getQualityColor(quality);
  }

  endCall() {
    this.callService.endCall();
    this.dialogRef.close('ended');
  }

  // Handle dialog close (when user closes without ending call)
  onDialogClose() {
    // If call is still active, cancel it
    if (this.callService.getLocalStream()) {
      this.callService.cancelCall();
    }
  }

  private showError(message: string) {
    // You could implement a toast notification here
    console.error(message);
    alert(message);
  }

  private mapMediaError(error: any): string {
    const name: string = error?.name || error?.message || '';
    switch (name) {
      case 'NotAllowedError':
        return 'Microphone access was blocked. Please allow it in the browser site settings and retry.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No microphone found. Connect a microphone or check Windows sound settings.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your microphone is in use by another app. Close other apps (Teams/Zoom/OBS) and retry.';
      case 'OverconstrainedError':
        return 'The requested audio constraints are not supported. Try default device.';
      case 'SecurityError':
        return 'Access requires a secure context. Use HTTPS or run on localhost.';
      case 'Permission dismissed':
        return 'Permission dialog dismissed. Please click Allow to start the call.';
      default:
        return 'Failed to start audio call. Please check your microphone permissions.';
    }
  }
}
