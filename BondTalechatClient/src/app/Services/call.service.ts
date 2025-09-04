import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatService } from './chat.serivce';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

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
export class CallService {
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
  private pendingOffers: Map<string, { type: string; sdp: string } > = new Map();
  private pendingIce: Map<string, Array<{ candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }>> = new Map();
  private selfUserId?: number;

  public callState$ = this.callStateSubject.asObservable();
  public callHistory$ = this.callHistorySubject.asObservable();
  public incomingCall$ = this.incomingCallSubject.asObservable();

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  constructor(private chatService: ChatService) {
    this.loadCallHistory();
    // Ensure we are connected to CallHub early so we don't miss server events
    this.ensureCallHub().catch(() => {});
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
  }

  // Ensure dedicated CallHub connection exists (JWT passed as access_token)
  private async ensureCallHub(): Promise<void> {
    if (this.callHub) return;
    this.callHub = new signalR.HubConnectionBuilder()
      .withUrl(environment.callHubUrl, {
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Server → client events mirror ChatService; keep both for compatibility
    this.callHub.on('IncomingCall', (p: any) => {
      console.log('IncomingCall', p);
      // cache callId so we can answer via AnswerCall
      try { this.callId = p?.callId ?? this.callId; } catch {}
      this.incomingCallSubject.next(p);
    });
    this.callHub.on('CallOffer',  (p: any) => this.chatService.callOffer$.next(p));
    this.callHub.on('CallAnswer', (p: any) => this.chatService.callAnswer$.next(p));
    this.callHub.on('CallCandidate', (p: any) => this.chatService.callCandidate$.next(p));
    this.callHub.on('CallAccepted', (p: any) => this.chatService.callAccepted$.next(p));
    this.callHub.on('CallDeclined', (p: any) => this.chatService.callDeclined$.next(p));
    this.callHub.on('CallEnded', (p: any) => this.chatService.callEnded$.next(p));

    console.log('CallHub connecting to', environment.callHubUrl);
    await this.callHub.start();
    console.log('CallHub connected');
    try {
      const me = await this.callHub.invoke<string | null>('WhoAmI');
      console.log('WhoAmI (callHub):', me);
      if (me !== null && me !== undefined) {
        const parsed = Number(me);
        this.selfUserId = Number.isNaN(parsed) ? undefined : parsed;
      }
    } catch {}

    // Flush any queued ICE candidates once connected
    try {
      for (const [pid, list] of this.pendingIce.entries()) {
        for (const dto of list) {
          await this.callHub.invoke('SendCallCandidate', Number(pid), dto);
        }
      }
      this.pendingIce.clear();
    } catch (e) {
      console.warn('Failed flushing queued ICE', e);
    }
  }

  // Call this right after successful login (after token is saved)
  public async connectCallHub(): Promise<void> {
    if (this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) return;
    // Reset existing
    if (this.callHub) { try { await this.callHub.stop(); } catch {} this.callHub = undefined; }
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
      try { this.localStream.getTracks().forEach(t => t.stop()); } catch {}
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
      } catch {}
      this.updateCallState({
        isInCall: true,
        callType,
        isVideoEnabled: callType === 'video',
        isAudioEnabled: true,
        callStartTime: new Date()
      });
      this.startCallTimer();
      this.ensurePeerConnection(participantId);
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
        } catch {}
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
  async initializeCall(callType: 'audio' | 'video', participantId: string): Promise<void> {
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
    }
    // Create and send an SDP offer so the remote side is prompted to accept
    const pc = this.peerConnections.get(participantId)!;
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: effectiveType === 'video' });
    await pc.setLocalDescription(offer);
    if (this.callHub && this.callHub.state === signalR.HubConnectionState.Connected) {
      await this.callHub.invoke('SendCallOffer', Number(participantId), { type: offer.type || 'offer', sdp: (offer as any).sdp });
    } else {
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
    if (this.callStateSubject.value.callStartTime) {
      this.addToCallHistory({
        id: this.generateCallId(),
        participantId: 'unknown',
        participantName: 'Unknown',
        callType: this.callStateSubject.value.callType,
        duration: this.callStateSubject.value.callDuration,
        startTime: this.callStateSubject.value.callStartTime,
        endTime: new Date(),
        status: 'completed',
        isIncoming: false
      });
    }
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
    } catch {}
    this.incomingCallSubject.next(null);
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
    this.callHistory.unshift(call);
    this.callHistorySubject.next([...this.callHistory]);
    this.saveCallHistory();
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
    localStorage.setItem('callHistory', JSON.stringify(this.callHistory));
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
