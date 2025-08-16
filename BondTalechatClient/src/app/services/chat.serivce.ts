import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private hubConnection!: signalR.HubConnection; 
    public message$ = new BehaviorSubject<any>(null);

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

    public async getAllMessageOfCurrentLoginUser(loginUserId: number): Promise<any[]> {
        await this.waitUntilConnected();

        try {
            const allMsg = await this.hubConnection.invoke<any[]>('GetLoginUserAllMessagesByID', loginUserId);
            return allMsg;
        } catch (err) {
            console.error('Error fetching messages:', err);
            return [];
        }
    }
}
