import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class ChatService {
    private hubConnection:signalR.HubConnection | undefined;

    public message$=new BehaviorSubject<any>(null);

    public startConnection(){
        this.hubConnection=new signalR.HubConnectionBuilder().withUrl(environment.signalRUrl).withAutomaticReconnect().build();
        this.hubConnection.start().then(()=>console.log("signalR connected"))
        .catch(err=>console.error('error while connecting signalR'+err));

        this.registerOnServerEvents();
    }

    private registerOnServerEvents(){
        this.hubConnection?.on('ReceiveMessage',(msg:any)=>{
            this.message$.next(msg)
        });
    }

    public sendMessage(conversationId:number,senderId:number,text:string){
        if(this.hubConnection?.state===signalR.HubConnectionState.Connected){
            this.hubConnection.invoke('SendMessage',conversationId,senderId,text,null,0,false,false)
            .catch(err=>console.error(err));
        }
        else{
            console.warn('signalR not connected');
        }
    }
}