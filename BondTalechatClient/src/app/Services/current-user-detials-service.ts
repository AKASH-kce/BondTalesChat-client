import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { IUserDetial } from '../Models/user.detials.model';

@Injectable({
  providedIn: 'root'
})
export class currentUserDetialsService {

  constructor() { }

  private messageSubject = new Subject<IUserDetial>();
  getMessage(): Observable<IUserDetial> {
    return this.messageSubject.asObservable();
  }


  sendUserDetials(User: IUserDetial) {
    this.messageSubject.next(User);
  }
}
