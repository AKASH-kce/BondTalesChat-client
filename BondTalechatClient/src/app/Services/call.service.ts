import { AfterViewInit, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatService } from './chat.Service';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { MatDialog } from '@angular/material/dialog';
import { VedioCallPopupComponentComponent } from '../popupComponents/vedio-call-popup-component/vedio-call-popup-component.component';

export interface CallState {
  isInCall: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isMuted: boolean;
  callType: 'audio' | 'video';
  participants: CallParticipant[];
  callDuration: number;
  callStartTime: Date | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isSpeaking?: boolean;
}

export interface CallHistory {
  id: string;
  participantId: string;
  participantName: string;
  callType: 'audio' | 'video';
  duration: number;
  startTime: Date;
  endTime: Date;
  status: 'completed' | 'missed' | 'declined' | 'failed';
  isIncoming: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CallService implements AfterViewInit {
  private callStateSubject = new BehaviorSubject<CallState>({
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
  });

  private callHistorySubject = new BehaviorSubject<CallHistory[]>([]);
  private incomingCallSubject = new BehaviorSubject<any>(null);

  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private callTimer: any = null;
  private callHistory: CallHistory[] = [];
  private callHub?: signalR.HubConnection;
  private callId?: string;
  private pendingOffers: Map<string, { type: string; sdp: string }> = new Map();
  private pendingIce: Map<string, Array<{ candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }>> = new Map();
  private selfUserId?: number;
  private currentCallParticipant?: { id: string; name: string; avatar?: string };

  public callState$ = this.callStateSubject.asObservable();
  public callHistory$ = this.callHistorySubject.asObservable();
  public incomingCall$ = this.incomingCallSubject.asObservable();
  username: any;

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  constructor(private chatService: ChatService, private userService: UserService,private callService:CallService,private dialog: MatDialog) {
    this.loadCallHistory();
    // Add sample data if no history exists (for testing)
    this.addSampleCallHistoryIfEmpty();
    // Ensure we are connected to CallHub early so we don't miss server events
    this.ensureCallHub().catch(() => { });
    // Wire SignalR call signaling to WebRTC peer connections
    this.chatService.incomingCall$.subscribe((payload: any) => {
      // Surface to UI for accept/decline
      this.incomingCallSubject.next(payload);
    });
    this.chatService.callOffer$.subscribe(async (payload: any) => {
      try {
        const fromId: string = String(payload.fromUserId);
        // If local media not ready yet (user hasn't accepted), buffer the offer
        if (!this.localStream) {
          this.pendingOffers.set(fromId, { type: payload.offer?.type, sdp: payload.offer?.sdp });
          return;
        }
        this.ensurePeerConnection(fromId);
        const pc = this.peerConnections.get(fromId)!;
        const remoteDesc = new RTCSessionDescription({ type: payload.offer?.type, sdp: payload.offer?.sdp });
        await pc.setRemoteDescription(remoteDesc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.callHub) {
          // Prefer AnswerCall with callId when we have it
          if (this.callId) {
            await this.callHub.invoke('AnswerCall', this.callId, { type: answer.type || 'answer', sdp: (answer as any).sdp });
          } else {
            await this.callHub.invoke('SendCallAnswer', Number(fromId), { type: answer.type || 'answer', sdp: (answer as any).sdp });
          }
        } else {
          this.chatService.sendCallAnswer(Number(fromId), answer);
        }
      } catch (e) {
        console.error('Error handling CallOffer', e);
      }
    });
    this.chatService.callAnswer$.subscribe(async (payload: any) => {
      try {
        const fromId: string = String(payload.fromUserId);
        const pc = this.peerConnections.get(fromId);
        if (pc) {
          // Only apply remote answer if we previously created an offer
          if (pc.signalingState === 'have-local-offer' && !pc.currentRemoteDescription) {
            const remoteDesc = new RTCSessionDescription({ type: payload.answer?.type, sdp: payload.answer?.sdp });
            await pc.setRemoteDescription(remoteDesc);
          } else {
            console.warn('Ignoring CallAnswer in state', pc.signalingState);
          }
        }
      } catch (e) {
        console.error('Error handling CallAnswer', e);
      }
    });
    this.chatService.callCandidate$.subscribe(async (payload: any) => {
      try {
        const fromId: string = String(payload.fromUserId ?? payload.participantId ?? '');
        const pc = this.peerConnections.get(fromId);
        if (pc && payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (e) {
        console.warn('Error adding ICE candidate', e);
      }
    });

    // (async () => { try { await this.callService.connectCallHub(); } catch {} })();
    // this.callService.incomingCall$.subscribe(payload => {
    //   console.log('Incoming call:', payload);
    //   if (!payload) return;
    //   const accept = confirm(`Incoming ${payload.callType} call from ${payload.participantName ?? payload.participantId}. Accept?`);
    //   if (!accept) {
    //     this.callService.declineCall(payload.callId);
    //     return;
    //   }
    //   this.dialog.open(VedioCallPopupComponentComponent, {
    //     data: payload,
    //     disableClose: true,
    //     panelClass: 'draggable-dialog'
    //   });
    // });
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ensureCallHub().catch((e) => { console.error('Failed to connect CallHub after view init', e); });
    }, 10000); // 10 seconds delay
  }

  private getToken(): string {
    try {
      return localStorage.getItem('token') || '';
    } catch {
      return '';
    }
  }
  // Ensure dedicated CallHub connection exists (JWT passed as access_token)
  public async ensureCallHub(): Promise<void> {
    if (this.callHub) return;
    
    // Get current user to build proper connection URL
    const currentUser = this.userService.getUser();
    if (!currentUser) {
      console.error('No current user found, cannot establish CallHub connection');
      return;
    }
    
    const userId = currentUser.userId;
    this.username = currentUser.username;
    
    console.log("Connecting CallHub for user:", userId);
    
    this.callHub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.callHubUrl}?userId=${userId}`, {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        transport: signalR.HttpTransportType.WebSockets,
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register event handlers before starting connection
    this.callHub.on('IncomingCall', (p: any) => {
      console.log('IncomingCall', p);
      // cache callId so we can answer via AnswerCall
      try { this.callId = p?.callId ?? this.callId; } catch { }
      this.incomingCallSubject.next(p);
    });
    this.callHub.on('CallOffer', (p: any) => this.chatService.callOffer$.next(p));
    this.callHub.on('CallAnswer', (p: any) => this.chatService.callAnswer$.next(p));
    this.callHub.on('CallCandidate', (p: any) => this.chatService.callCandidate$.next(p));
    this.callHub.on('CallAccepted', (p: any) => this.chatService.callAccepted$.next(p));
    this.callHub.on('CallDeclined', (p: any) => this.chatService.callDeclined$.next(p));
    this.callHub.on('CallEnded', (p: any) => this.chatService.callEnded$.next(p));

    try {
      await this.callHub.start();
      console.log('CallHub connected successfully');
      
      // Verify connection with WhoAmI
      const me = await this.callHub.invoke<string | null>('WhoAmI');
      console.log('WhoAmI (callHub):', me);
      if (me !== null && me !== undefined) {
        const parsed = Number(me);
        this.selfUserId = Number.isNaN(parsed) ? undefined : parsed;
      }

      // Flush any queued ICE candidates once connected
      for (const [pid, list] of this.pendingIce.entries()) {
        for (const dto of list) {
          await this.callHub.invoke('SendCallCandidate', Number(pid), dto);
        }
      }
      this.pendingIce.clear();
      
    } catch (error) {
      console.error('Error connecting CallHub:', error);
      throw error;
    }
  }

  // Call this right after successful login (after token is saved)
  public async connectCallHub(): Promise<void> {
    if (this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) return;
    // Reset existing
    if (this.callHub) { try { await this.callHub.stop(); } catch { } this.callHub = undefined; }
    await this.ensureCallHub();
  }

  private isSecureContext(): boolean {
    try {
      // localhost is treated as secure even on http
      const isLocalhost = typeof location !== 'undefined' && (
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.hostname === '::1'
      );
      return (typeof window !== 'undefined' && window.isSecureContext) || isLocalhost;
    } catch {
      return true;
    }
  }

  private async preflightPermissions(callType: 'audio' | 'video'): Promise<'granted' | 'prompt' | 'denied' | 'unknown'> {
    if (!('permissions' in navigator)) return 'unknown';
    try {
      const mic = await (navigator as any).permissions.query({ name: 'microphone' as PermissionName });
      const cam = callType === 'video' ? await (navigator as any).permissions.query({ name: 'camera' as PermissionName }) : null;
      if (mic.state === 'denied' || (cam && cam.state === 'denied')) return 'denied';
      if (mic.state === 'granted' && (!cam || cam.state === 'granted')) return 'granted';
      return 'prompt';
    } catch {
      return 'unknown';
    }
  }

  // Prepare local media and peer connection without sending any offer (used for both directions)
  private async prepareLocalMedia(callType: 'audio' | 'video', participantId: string): Promise<'video' | 'audio'> {
    await this.connectCallHub();
    if (!this.isSecureContext()) {
      throw new Error('INSECURE_CONTEXT');
    }

    if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('MEDIA_API_UNAVAILABLE');
    }

    const permState = await this.preflightPermissions(callType);
    if (permState === 'denied') {
      throw new Error('PERMISSION_DENIED_PREVIOUSLY');
    }

    // Ensure any previous stream is released to avoid NotReadableError when switching
    if (this.localStream) {
      try { this.localStream.getTracks().forEach(t => t.stop()); } catch { }
      this.localStream = null;
    }

    const primaryConstraints: MediaStreamConstraints = {
      audio: true,
      video: callType === 'video' ? true : false
    };
    const secondaryConstraints: MediaStreamConstraints = {
      audio: true,
      video: callType === 'video' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      } : false
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(primaryConstraints)
        .catch(async (err) => {
          if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
            throw err;
          }
          try {
            return await navigator.mediaDevices.getUserMedia(secondaryConstraints);
          } catch {
            return await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
          }
        });
      try {
        const audioTracks = this.localStream?.getAudioTracks() || [];
        const videoTracks = this.localStream?.getVideoTracks() || [];
        console.log('Local stream ready', {
          audioTracks: audioTracks.map(t => ({ id: t.id, enabled: t.enabled, muted: (t as any).muted })),
          videoTracks: videoTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState }))
        });
      } catch { }
      const startTime = new Date();
      console.log('Setting call state - start time:', startTime);
      this.updateCallState({
        isInCall: true,
        callType,
        isVideoEnabled: callType === 'video',
        isAudioEnabled: true,
        callStartTime: startTime
      });
      this.startCallTimer();
      this.ensurePeerConnection(participantId);
      console.log('Call state updated, current state:', this.callStateSubject.value);
      return callType;
    } catch (error: any) {
      // Fallback to audio-only if video device is busy
      if (error?.name === 'NotReadableError' && callType === 'video') {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        try {
          const audioTracks = this.localStream?.getAudioTracks() || [];
          const videoTracks = this.localStream?.getVideoTracks() || [];
          console.log('Local stream fallback (audio-only)', {
            audioTracks: audioTracks.map(t => ({ id: t.id, enabled: t.enabled, muted: (t as any).muted })),
            videoTracks: videoTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState }))
          });
        } catch { }
        this.updateCallState({
          isInCall: true,
          callType: 'audio',
          isVideoEnabled: false,
          isAudioEnabled: true,
          callStartTime: new Date()
        });
        this.startCallTimer();
        this.ensurePeerConnection(participantId);
        return 'audio';
      }
      if (typeof error?.message === 'string') {
        if (error.message === 'INSECURE_CONTEXT') throw new Error('INSECURE_CONTEXT');
        if (error.message === 'MEDIA_API_UNAVAILABLE') throw new Error('MEDIA_API_UNAVAILABLE');
        if (error.message === 'PERMISSION_DENIED_PREVIOUSLY') throw new Error('PERMISSION_DENIED_PREVIOUSLY');
      }
      if (error?.name) throw new Error(error.name);
      throw new Error('UNKNOWN_MEDIA_ERROR');
    }
  }

  // Initialize outgoing call: prepares media, creates server call, and sends offer
  async initializeCall(callType: 'audio' | 'video', participantId: string, participantName?: string, participantAvatar?: string): Promise<void> {
    // Store participant information for call history
    this.currentCallParticipant = {
      id: participantId,
      name: participantName || 'Unknown',
      avatar: participantAvatar
    };

    console.log('Stored participant info for call:', this.currentCallParticipant);

    const effectiveType = await this.prepareLocalMedia(callType, participantId);
    // Create call session on server so callee receives IncomingCall
    try {
      await this.connectCallHub();
      if (this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) {
        this.callId = await this.callHub.invoke<string>('InitiateCall', Number(participantId), effectiveType);
      } else {
        throw new Error('CALL_HUB_NOT_CONNECTED');
      }
    } catch (e) {
      console.warn('Failed to create server call session (InitiateCall)', e);
      // Add failed call to history
      this.addFailedCall(
        participantId,
        participantName || 'Unknown',
        effectiveType,
        'Server connection failed'
      );
      throw e; // Re-throw to let the UI handle the error
    }
    // Create and send an SDP offer so the remote side is prompted to accept
    const pc = this.peerConnections.get(participantId)!;
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: effectiveType === 'video' });
    await pc.setLocalDescription(offer);
    if (this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) {
      await this.callHub.invoke('SendCallOffer', Number(participantId), { type: offer.type || 'offer', sdp: (offer as any).sdp });
    } else {
      // Add failed call to history
      this.addFailedCall(
        participantId,
        participantName || 'Unknown',
        effectiveType,
        'Call hub not connected'
      );
      throw new Error('CALL_HUB_NOT_CONNECTED');
    }
  }

  // Toggle video on/off
  toggleVideo(): void {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });

      this.updateCallState({
        isVideoEnabled: !this.callStateSubject.value.isVideoEnabled
      });
    }
  }

  // Toggle audio on/off
  toggleAudio(): void {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });

      this.updateCallState({
        isAudioEnabled: !this.callStateSubject.value.isAudioEnabled,
        isMuted: !this.callStateSubject.value.isAudioEnabled
      });
    }
  }

  // Start screen sharing
  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in local stream
      if (this.localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.getVideoSender();
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      this.updateCallState({
        isScreenSharing: true
      });

      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }

  // Stop screen sharing
  async stopScreenShare(): Promise<void> {
    try {
      // Switch back to camera
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      const sender = this.getVideoSender();
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      this.updateCallState({
        isScreenSharing: false
      });
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  // End call
  endCall(): void {
    this.stopCallTimer();
    this.cleanup();

    // Store call data before clearing the state
    const currentCallState = this.callStateSubject.value;
    const callStartTime = currentCallState.callStartTime;
    const callDuration = currentCallState.callDuration;
    const callType = currentCallState.callType;

    this.updateCallState({
      isInCall: false,
      isVideoEnabled: false,
      isAudioEnabled: false,
      isScreenSharing: false,
      isMuted: false,
      participants: [],
      callDuration: 0,
      callStartTime: null
    });

    // Add to call history
    if (callStartTime && this.currentCallParticipant) {
      console.log('Adding completed call to history:', {
        participantId: this.currentCallParticipant.id,
        participantName: this.currentCallParticipant.name,
        callType: callType,
        duration: callDuration,
        startTime: callStartTime
      });

      this.addToCallHistory({
        id: this.generateCallId(),
        participantId: this.currentCallParticipant.id,
        participantName: this.currentCallParticipant.name,
        callType: callType,
        duration: callDuration,
        startTime: callStartTime,
        endTime: new Date(),
        status: 'completed',
        isIncoming: false
      });
    } else {
      console.warn('Cannot add call to history - missing data:', {
        callStartTime: !!callStartTime,
        currentCallParticipant: !!this.currentCallParticipant,
        callState: currentCallState
      });
    }

    // Clear current call participant
    this.currentCallParticipant = undefined;
  }

  // Cancel call (when call is cancelled before being answered)
  cancelCall(): void {
    this.stopCallTimer();
    this.cleanup();

    this.updateCallState({
      isInCall: false,
      isVideoEnabled: false,
      isAudioEnabled: false,
      isScreenSharing: false,
      isMuted: false,
      participants: [],
      callDuration: 0,
      callStartTime: null
    });

    // Add cancelled call to history (short duration)
    if (this.currentCallParticipant) {
      this.addToCallHistory({
        id: this.generateCallId(),
        participantId: this.currentCallParticipant.id,
        participantName: this.currentCallParticipant.name,
        callType: this.callStateSubject.value.callType,
        duration: 0,
        startTime: new Date(),
        endTime: new Date(),
        status: 'failed',
        isIncoming: false
      });
    }

    // Clear current call participant
    this.currentCallParticipant = undefined;
  }

  // Answer incoming call
  async answerCall(callData: any): Promise<void> {
    try {
      // Cache callId for AnswerCall
      if (callData?.callId) this.callId = callData.callId;
      // Prepare local media only; do NOT create server session or send offer here
      const effectiveType = await this.prepareLocalMedia(callData.callType, String(callData.participantId));
      // If an offer was received before media was ready, handle it now
      const fromId = String(callData.participantId);
      const buffered = this.pendingOffers.get(fromId);
      if (buffered) {
        this.ensurePeerConnection(fromId);
        const pc = this.peerConnections.get(fromId)!;
        const remoteDesc = new RTCSessionDescription({ type: buffered.type as RTCSdpType, sdp: buffered.sdp });
        await pc.setRemoteDescription(remoteDesc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) {
          if (this.callId) {
            await this.callHub.invoke('AnswerCall', this.callId, { type: answer.type || 'answer', sdp: (answer as any).sdp });
          } else {
            await this.callHub.invoke('SendCallAnswer', Number(fromId), { type: answer.type || 'answer', sdp: (answer as any).sdp });
          }
        }
        this.pendingOffers.delete(fromId);
      }
    } finally {
      this.incomingCallSubject.next(null);
    }
  }

  // Decline incoming call
  async declineCall(callId?: string): Promise<void> {
    try {
      await this.ensureCallHub();
      if (callId && this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) {
        await this.callHub.invoke('DeclineCall', callId);
      }
    } catch { }

    // Add declined call to history
    this.addToCallHistory({
      id: this.generateCallId(),
      participantId: this.currentCallParticipant?.id || 'unknown',
      participantName: this.currentCallParticipant?.name || 'Unknown',
      callType: 'audio', // Default type for declined calls
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
      status: 'declined',
      isIncoming: true
    });

    this.incomingCallSubject.next(null);
  }

  // Add missed call to history
  addMissedCall(participantId: string, participantName: string, callType: 'audio' | 'video'): void {
    this.addToCallHistory({
      id: this.generateCallId(),
      participantId: participantId,
      participantName: participantName,
      callType: callType,
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
      status: 'missed',
      isIncoming: true
    });
  }

  // Handle call timeout (when outgoing call is not answered)
  handleCallTimeout(participantId: string, participantName: string, callType: 'audio' | 'video'): void {
    this.addToCallHistory({
      id: this.generateCallId(),
      participantId: participantId,
      participantName: participantName,
      callType: callType,
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
      status: 'missed',
      isIncoming: false
    });
  }

  // Add failed call to history
  addFailedCall(participantId: string, participantName: string, callType: 'audio' | 'video', reason?: string): void {
    this.addToCallHistory({
      id: this.generateCallId(),
      participantId: participantId,
      participantName: participantName,
      callType: callType,
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
      status: 'failed',
      isIncoming: false
    });
  }

  // Get call quality based on connection stats
  private async updateConnectionQuality(): Promise<void> {
    // This would typically involve checking WebRTC stats
    // For now, we'll simulate quality updates
    const quality = this.calculateConnectionQuality();
    this.updateCallState({ connectionQuality: quality });
  }

  private calculateConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    // Simulate quality calculation based on various factors
    const random = Math.random();
    if (random > 0.8) return 'excellent';
    if (random > 0.6) return 'good';
    if (random > 0.4) return 'fair';
    return 'poor';
  }

  // Private helper methods
  private updateCallState(updates: Partial<CallState>): void {
    const currentState = this.callStateSubject.value;
    this.callStateSubject.next({ ...currentState, ...updates });
  }

  private ensurePeerConnection(participantId: string): void {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.updateParticipant(participantId, { stream: remoteStream });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const dto: any = {
          candidate: (event.candidate as any).candidate,
          sdpMid: (event.candidate as any).sdpMid ?? null,
          sdpMLineIndex: (event.candidate as any).sdpMLineIndex ?? null,
        };
        try {
          await this.ensureCallHub();
          if (this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) {
            await this.callHub.invoke('SendCallCandidate', Number(participantId), dto);
          } else {
            const list = this.pendingIce.get(participantId) || [];
            list.push(dto);
            this.pendingIce.set(participantId, list);
            console.warn('Queued ICE (call hub not ready) for', participantId);
          }
        } catch (err) {
          console.warn('Error sending ICE candidate', err);
        }
      }
    };

    this.peerConnections.set(participantId, peerConnection);
  }

  private updateParticipant(participantId: string, updates: Partial<CallParticipant>): void {
    const currentState = this.callStateSubject.value;
    let found = false;
    const participants = currentState.participants.map(p => {
      if (p.id === participantId) {
        found = true;
        return { ...p, ...updates };
      }
      return p;
    });
    if (!found) {
      participants.push({
        id: participantId,
        name: updates['name'] || 'Remote',
        avatar: updates['avatar'],
        isVideoEnabled: true,
        isAudioEnabled: true,
        isScreenSharing: !!updates['isScreenSharing'],
        stream: updates['stream'],
        connectionQuality: 'good',
        isSpeaking: false
      });
    }
    this.updateCallState({ participants });
  }

  private getVideoSender(): RTCRtpSender | null {
    for (const peerConnection of this.peerConnections.values()) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(sender =>
        sender.track && sender.track.kind === 'video'
      );
      if (videoSender) return videoSender;
    }
    return null;
  }

  private startCallTimer(): void {
    this.callTimer = setInterval(() => {
      const currentState = this.callStateSubject.value;
      if (currentState.callStartTime) {
        const duration = Math.floor((Date.now() - currentState.callStartTime.getTime()) / 1000);
        this.updateCallState({ callDuration: duration });
      }
    }, 1000);
  }

  private stopCallTimer(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }

  private cleanup(): void {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach(connection => connection.close());
    this.peerConnections.clear();
  }

  private addToCallHistory(call: CallHistory): void {
    console.log('Adding call to history:', call);
    this.callHistory.unshift(call);
    console.log('Updated call history array length:', this.callHistory.length);
    this.callHistorySubject.next([...this.callHistory]);
    this.saveCallHistory();
    console.log('Call history saved to localStorage');
  }

  private loadCallHistory(): void {
    const saved = localStorage.getItem('callHistory');
    if (saved) {
      this.callHistory = JSON.parse(saved).map((call: any) => ({
        ...call,
        startTime: new Date(call.startTime),
        endTime: new Date(call.endTime)
      }));
      this.callHistorySubject.next([...this.callHistory]);
    }
  }

  private saveCallHistory(): void {
    const historyJson = JSON.stringify(this.callHistory);
    console.log('Saving call history to localStorage:', historyJson);
    localStorage.setItem('callHistory', historyJson);

    // Verify it was saved
    const saved = localStorage.getItem('callHistory');
    console.log('Verified saved call history:', saved);
  }

  private addSampleCallHistoryIfEmpty(): void {
    if (this.callHistory.length === 0) {
      const sampleCalls: CallHistory[] = [
        {
          id: this.generateCallId(),
          participantId: '1',
          participantName: 'John Doe',
          callType: 'video',
          duration: 180, // 3 minutes
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 180 * 1000),
          status: 'completed',
          isIncoming: false
        },
        {
          id: this.generateCallId(),
          participantId: '2',
          participantName: 'Jane Smith',
          callType: 'audio',
          duration: 0,
          startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          endTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'missed',
          isIncoming: true
        },
        {
          id: this.generateCallId(),
          participantId: '3',
          participantName: 'Mike Johnson',
          callType: 'video',
          duration: 0,
          startTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          endTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'declined',
          isIncoming: true
        },
        {
          id: this.generateCallId(),
          participantId: '4',
          participantName: 'Sarah Wilson',
          callType: 'audio',
          duration: 420, // 7 minutes
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 420 * 1000),
          status: 'completed',
          isIncoming: false
        }
      ];

      this.callHistory = sampleCalls;
      this.callHistorySubject.next([...this.callHistory]);
      this.saveCallHistory();
    }
  }

  // Public methods for call history management
  clearCallHistory(): void {
    this.callHistory = [];
    this.callHistorySubject.next([]);
    this.saveCallHistory();
  }

  deleteCallFromHistory(callId: string): void {
    this.callHistory = this.callHistory.filter(call => call.id !== callId);
    this.callHistorySubject.next([...this.callHistory]);
    this.saveCallHistory();
  }

  retryCall(call: CallHistory): Promise<void> {
    // Store participant info for the retry
    this.currentCallParticipant = {
      id: call.participantId,
      name: call.participantName
    };

    // Initialize the call with the same type
    return this.initializeCall(call.callType, call.participantId, call.participantName);
  }

  // Test method to simulate different call scenarios
  simulateCallScenarios(): void {
    console.log('Simulating call scenarios for testing...');

    // Simulate a completed call
    this.addToCallHistory({
      id: this.generateCallId(),
      participantId: 'test1',
      participantName: 'Test User 1',
      callType: 'video',
      duration: 120, // 2 minutes
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      endTime: new Date(Date.now() - 30 * 60 * 1000 + 120 * 1000),
      status: 'completed',
      isIncoming: false
    });

    // Simulate a missed call
    this.addMissedCall('test2', 'Test User 2', 'audio');

    // Simulate a declined call
    this.addToCallHistory({
      id: this.generateCallId(),
      participantId: 'test3',
      participantName: 'Test User 3',
      callType: 'video',
      duration: 0,
      startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      endTime: new Date(Date.now() - 60 * 60 * 1000),
      status: 'declined',
      isIncoming: true
    });

    // Simulate a failed call
    this.addFailedCall('test4', 'Test User 4', 'audio', 'Connection timeout');

    console.log('Call scenarios simulated. Check call history.');
  }

  private generateCallId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Format call duration for display
  formatCallDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Get call quality color
  getQualityColor(quality: string): string {
    switch (quality) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#9e9e9e';
    }
  }
}
