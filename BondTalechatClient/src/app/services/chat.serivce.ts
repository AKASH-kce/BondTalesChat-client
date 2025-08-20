import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../Models/user.model';
import { UserService } from './user.service';
import { currentUserDetialsService } from './current-user-detials-service';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private hubConnection!: signalR.HubConnection;
    public message$ = new BehaviorSubject<any>(null);

    constructor(private userService: UserService, private currentUserSetialService: currentUserDetialsService, private currentUserDetialService: currentUserDetialsService) { }

    public async startConnection(): Promise<void> {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(environment.signalRUrl)
            .withAutomaticReconnect()
            .build();

        this.registerOnServerEvents();

        await this.hubConnection.start();
        console.log("SignalR connected");

        // Wait until actually connected
        await this.waitUntilConnected();
    }

    private registerOnServerEvents() {
        this.hubConnection.on('ReceiveMessage', (msg: any) => {
            this.message$.next(msg);
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


}
