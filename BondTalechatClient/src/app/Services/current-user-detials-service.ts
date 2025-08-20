import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { IUserDetial } from '../Models/user.detials.model';

@Injectable({
  providedIn: 'root'
})
export class currentUserDetialsService {

  constructor() { }

  private messageSubject = new Subject<IUserDetial>();
  private currentConversationId = new BehaviorSubject<number | null>(null)

  getMessage(): Observable<IUserDetial> {
    return this.messageSubject.asObservable();
  }


  sendUserDetials(User: IUserDetial) {
    this.messageSubject.next(User);
  }

  setCurrentConversation(id: number) {
    this.currentConversationId.next(id);
  }

  getCurrentConversation() {
    return this.currentConversationId.asObservable();
  }
}
