import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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

@Component({
  selector: 'app-vedio-call-popup-component',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, VideoSrcDirective],
  templateUrl: './vedio-call-popup-component.component.html',
  styleUrls: ['./vedio-call-popup-component.component.scss']
})
export class VedioCallPopupComponentComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  // Remote videos are rendered from state per participant

  isMinimized = false;
  showMoreOptions = false;
  showChat = false;
  showSettings = false;
  isRecording = false;
  newMessage = '';
  
  callState: CallState = {
    isInCall: false,
    isVideoEnabled: false,
    isAudioEnabled: false,
    isScreenSharing: false,
    isMuted: false,
    callType: 'video',
    participants: [],
    callDuration: 0,
    callStartTime: null,
    connectionQuality: 'excellent'
  };

  localStream: MediaStream | null = null;
  chatMessages: ChatMessage[] = [];
  
  private callStateSubscription?: Subscription;
  private callTimer?: any;

  constructor(
    private dialogRef: MatDialogRef<VedioCallPopupComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId?: number, participantId?: number, participantName?: string, callType?: 'audio' | 'video', isIncoming?: boolean, callId?: string },
    private callService: CallService
  ) {}

  ngOnInit() {
    this.initializeCall();
    this.subscribeToCallState();
  }

  ngOnDestroy() {
    this.callStateSubscription?.unsubscribe();
    this.cleanup();
  }

  private async initializeCall() {
    try {
      const isIncoming = this.data?.isIncoming === true;
      if (isIncoming && this.data?.participantId !== undefined && this.data?.participantId !== null) {
        await this.callService.answerCall({
          callId: this.data.callId,
          participantId: this.data.participantId,
          participantName: this.data.participantName ?? String(this.data.participantId),
          callType: this.data.callType ?? 'video',
          isIncoming: true
        });
      } else {
        const participantId = this.data?.userId;
        if (participantId === undefined || participantId === null) {
          this.showError('No participant selected for the call.');
          return;
        }
        const callType = this.data?.callType ?? 'video';
        await this.callService.initializeCall(callType, String(participantId));
      }
      // Use stream managed by CallService (single permission prompt)
      this.localStream = this.callService.getLocalStream();
      if (this.localVideoRef && this.localStream) {
        console.log('Binding local preview', {
          hasStream: !!this.localStream,
          audioTracks: this.localStream?.getAudioTracks().map(t => ({ id: t.id, enabled: t.enabled })) ?? [],
          videoTracks: this.localStream?.getVideoTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })) ?? []
        });
        const el = this.localVideoRef.nativeElement;
        el.muted = true;
        (el as any).playsInline = true;
        el.srcObject = this.localStream;
        try { await (el as any).play?.(); } catch (e) { console.warn('Autoplay prevented for local video', e); }
      }
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

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  async toggleVideo() {
    try {
      this.callService.toggleVideo();
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  }

  async toggleAudio() {
    try {
      this.callService.toggleAudio();
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  }

  async toggleScreenShare() {
    try {
      if (this.callState.isScreenSharing) {
        await this.callService.stopScreenShare();
      } else {
        await this.callService.startScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      this.showError('Screen sharing is not supported or permission denied.');
    }
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

  onVideoLoaded(event: any) {
    try {
      const el = event?.target as HTMLVideoElement;
      const src = el?.srcObject as MediaStream | null;
      const info = src ? {
        audioTracks: src.getAudioTracks().map(t => ({ id: t.id, enabled: t.enabled })),
        videoTracks: src.getVideoTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState }))
      } : null;
      console.log('Video loaded:', { hasSrcObject: !!src, details: info });
    } catch {
      console.log('Video loaded:', event);
    }
  }

  trackByParticipantId(index: number, participant: CallParticipant): string {
    return participant.id;
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

  private cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
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
        return 'Camera or microphone access was blocked. Please allow it in the browser site settings and retry.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera or microphone found. Connect devices or check Windows privacy settings.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your camera/microphone is in use by another app. Close other apps (Teams/Zoom/OBS) and retry.';
      case 'OverconstrainedError':
        return 'The requested camera constraints are not supported. Try default camera.';
      case 'SecurityError':
        return 'Access requires a secure context. Use HTTPS or run on localhost.';
      case 'Media devices API not available. Use HTTPS or a secure context.':
      case 'Media devices require a secure context (HTTPS) or localhost.':
        return 'This page must be served over HTTPS (or localhost) for camera/mic to work.';
      case 'Permission dismissed':
        return 'Permission dialog dismissed. Please click Allow to start the call.';
      default:
        return 'Failed to start video call. Please check your camera and microphone permissions.';
    }
  }
}
