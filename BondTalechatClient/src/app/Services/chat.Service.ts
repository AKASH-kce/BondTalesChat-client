import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { User } from '../Models/user.model';
import { UserService } from './user.service';
import { currentUserDetialsService } from './current-user-detials-service';
import { IConversation } from '../Models/user.detials.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private hubConnection!: signalR.HubConnection;
    public message$ = new BehaviorSubject<any>(null);
    // Call event channels
    public incomingCall$ = new Subject<any>();
    public callAccepted$ = new Subject<any>();
    public callDeclined$ = new Subject<any>();
    public callEnded$ = new Subject<any>();
    public callOffer$ = new Subject<any>();
    public callAnswer$ = new Subject<any>();
    public callCandidate$ = new Subject<any>();

    constructor(private userService: UserService, private currentUserSetialService: currentUserDetialsService, private currentUserDetialService: currentUserDetialsService) { }

    public async startConnection(): Promise<void> {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(environment.signalRUrl, {
                accessTokenFactory: () => this.getToken(),
                withCredentials: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.registerOnServerEvents();

        await this.hubConnection.start();
        console.log("SignalR connected");

        // Optional: verify identity if backend supports WhoAmI
        try {
            const me = await this.hubConnection.invoke<string | null>('WhoAmI');
            console.log('WhoAmI:', me);
        } catch {}

        // Wait until actually connected
        await this.waitUntilConnected();
    }

    private getToken(): string {
        try {
            return localStorage.getItem('token') || '';
        } catch {
            return '';
        }
    }

    private registerOnServerEvents() {
        this.hubConnection.on('ReceiveMessage', (msg: any) => {
            this.message$.next(msg);
        });

        // Call-related events
        this.hubConnection.on('IncomingCall', (payload: any) => {
            console.log('Incoming call:', payload);
            this.incomingCall$.next(payload);
        });

        this.hubConnection.on('CallAccepted', (payload: any) => {
            console.log('Call accepted:', payload);
            this.callAccepted$.next(payload);
        });

        this.hubConnection.on('CallDeclined', (payload: any) => {
            console.log('Call declined:', payload);
            this.callDeclined$.next(payload);
        });

        this.hubConnection.on('CallEnded', (payload: any) => {
            console.log('Call ended:', payload);
            this.callEnded$.next(payload);
        });

        this.hubConnection.on('CallOffer', (payload: any) => {
            console.log('Call offer:', payload);
            this.callOffer$.next(payload);
        });

        this.hubConnection.on('CallAnswer', (payload: any) => {
            console.log('Call answer:', payload);
            this.callAnswer$.next(payload);
        });

        this.hubConnection.on('CallCandidate', (payload: any) => {
            console.log('CallCandidate', payload);
            this.callCandidate$.next(payload);
        });
    }

    private async waitUntilConnected(): Promise<void> {
        while (!this.isConnected()) {
            await new Promise(r => setTimeout(r, 50));
        }
    }

    private isConnected(): boolean {
        return this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected;
    }

    public sendMessage(conversationId: number, senderId: number, text: string) {
        if (this.isConnected()) {
            this.hubConnection.invoke('SendMessage', conversationId, senderId, text, null, 0, false, false)
                .catch(err => console.error(err));
        } else {
            console.warn('SignalR not connected');
        }
    }

    public async getAllMessageOfCurrentLoginUser(loginUserId: number | unknown): Promise<any[]> {
        await this.waitUntilConnected();

        try {
            const id = Number(loginUserId);
            const allMsg = await this.hubConnection.invoke<any[]>('GetLoginUserAllMessagesByID', id);
            return allMsg;
        } catch (err) {
            console.error('Error fetching messages:', err);
            return [];
        }
    }
    public async getAllUserList(): Promise<User[]> {
        await this.waitUntilConnected();
        try {
            const allUsers = await this.hubConnection.invoke<any[]>('GetAllUsers')
            return allUsers;
        }
        catch (err) {
            console.log("error in getting user list:" + err);
            return [];
        }
    }

    public getOrCreateConversation(otherUserId: number | undefined): Observable<number> {
        return new Observable<number>(observer => {
            this.userService.currentUserSubject.subscribe((user: User) => {
                let currentUserId = Number(user?.userId);
                if (!currentUserId) {
                    observer.error("no looged in user found");
                    return;
                }

                this.hubConnection.invoke<number>('GetOrCreateConversation', currentUserId, otherUserId).
                    then(convId => {
                        this.currentUserDetialService.setCurrentConversation(convId);
                        observer.next(convId);
                        observer.complete();
                    }).catch(err => observer.error(err));
            })
        })
    }

    async GetMessagesByConversation(): Promise<any[]> {
        await this.waitUntilConnected();

        // Try to get currently selected conversation
        let conversationId = this.currentUserDetialService["currentConversationId"].getValue();

        if (!conversationId) {
            try {
                // 1️⃣ Get top friend id from server
                const topFriendId = await this.hubConnection.invoke<number>(
                    "getFrndTop1Id",
                    Number(this.userService.currentUserSubject.getValue()?.userId)
                );
                console.log(Number(this.userService.currentUserSubject.getValue()?.userId));

                if (!topFriendId) {
                    console.log("No friends found for this user");
                    return [];
                }

                // 2️⃣ Get or create conversation with that friend
                conversationId = await this.hubConnection.invoke<number>(
                    "GetOrCreateConversation",
                    Number(this.userService.currentUserSubject.getValue()?.userId),
                    topFriendId
                );
                console.log(conversationId);
                // 3️⃣ Save it to currentUserDetialService so UI knows
                this.currentUserDetialService.setCurrentConversation(conversationId);
            } catch (err) {
                console.error("Error getting top friend conversation:", err);
                return [];
            }
        }

        // 4️⃣ Finally fetch messages
        try {
            return await this.hubConnection.invoke<any[]>(
                "GetMessagesByConversation",
                conversationId
            );
        } catch (err) {
            console.error("Error fetching messages by conversation", err);
            return [];
        }
    }

   
    public async getUserConversations(): Promise<IConversation[]> {
        await this.waitUntilConnected();

        try {
            const userId = Number(this.userService.currentUserSubject.getValue()?.userId);
            const conversations = await this.hubConnection.invoke<IConversation[]>('GetUserConversations', userId);

            return conversations.map(conv => ({
                ...conv,
                lastMessageTime: this.formatMessageTime(conv.lastMessageTime)
            }));
        } catch (err) {
            console.error('Error fetching user conversations:', err);
            return [];
        }
    }

    private formatMessageTime(dateString: string): string {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays < 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    // Call-related methods
    // Return callId assigned by server
    public initiateCall(participantId: number, callType: 'audio' | 'video'): Promise<string> {
        if (!this.isConnected()) return Promise.reject('SignalR not connected');
        return this.hubConnection.invoke<string>('InitiateCall', participantId, callType);
    }

    public answerCall(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.isConnected()) return Promise.reject('SignalR not connected');
        const dto = { type: answer.type || 'answer', sdp: (answer as any).sdp };
        return this.hubConnection.invoke('AnswerCall', callId, dto);
    }

    public declineCall(callId: string): void {
        if (this.isConnected()) {
            this.hubConnection.invoke('DeclineCall', callId)
                .catch(err => console.error('Error declining call:', err));
        }
    }

    public endCall(callId: string): void {
        if (this.isConnected()) {
            this.hubConnection.invoke('EndCall', callId)
                .catch(err => console.error('Error ending call:', err));
        }
    }

    public sendCallCandidate(participantId: number, candidate: RTCIceCandidate): Promise<void> {
        if (!this.isConnected()) return Promise.reject('SignalR not connected');
        const dto = {
            candidate: (candidate as any).candidate,
            sdpMid: (candidate as any).sdpMid ?? null,
            sdpMLineIndex: (candidate as any).sdpMLineIndex ?? null,
        };
        return this.hubConnection.invoke('SendCallCandidate', participantId, dto);
    }

    public sendCallOffer(participantId: number, offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.isConnected()) return Promise.reject('SignalR not connected');
        const dto = { type: offer.type || 'offer', sdp: (offer as any).sdp };
        return this.hubConnection.invoke('SendCallOffer', participantId, dto);
    }

    public sendCallAnswer(participantId: number, answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.isConnected()) return Promise.reject('SignalR not connected');
        const dto = { type: answer.type || 'answer', sdp: (answer as any).sdp };
        return this.hubConnection.invoke('SendCallAnswer', participantId, dto);
    }

}
