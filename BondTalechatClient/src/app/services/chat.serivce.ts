import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { User } from '../Models/user.model';

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

    public async getAllMessageOfCurrentLoginUser(loginUserId: number|unknown): Promise<any[]> {
        await this.waitUntilConnected();

        try {
            const id=Number(loginUserId);
            const allMsg = await this.hubConnection.invoke<any[]>('GetLoginUserAllMessagesByID', id);
            return allMsg;
        } catch (err) {
            console.error('Error fetching messages:', err);
            return [];
        }
    }
     public async getAllUserList():Promise<User[]>{
        await this.waitUntilConnected();
        try{
            const allUsers=await this.hubConnection.invoke<any[]>('GetAllUsers')
            return allUsers;
        }
        catch(err){
            console.log("error in getting user list:"+err);
            return [];
        }
     }
}
