import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { User } from '../Models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ApiResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}`;
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    // const token = localStorage.getItem('token');
    // const user = localStorage.getItem('user');

    // if (token && user) {
    // this.currentUserSubject.next(JSON.parse(user));
    //}

    this.verifyAuth().subscribe();
  }

  register(user: User): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/User/register`, user);
  }

  login(email: string, password: string) {
    return this.http
      .post<ApiResponse>(
        `${this.baseUrl}/User/login`,
        { email, password },
        {
          withCredentials: true,
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
          }),
        }
      )
      .pipe(
        tap((res) => {
          if (res.success && res.token && res.user) {
            // localStorage.setItem('token', res.token);
            // localStorage.setItem('user', JSON.stringify(res.user));
            this.currentUserSubject.next(res.user);
          }
        })
      );
  }

  // local storage related changes.
  // getToken() {
  //   return localStorage.getItem('token');
  // }
  // logout() {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  //   this.currentUserSubject.next(null);
  // }

  logout(): Observable<void> {
    return this.http
      .post<void>(
        `${this.baseUrl}/logout`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
        })
      );
  }

  isLoggedIn() {
    // return !!this.getToken();
    return this.currentUserSubject.value !== null;
  }

  verifyAuth(): Observable<ApiResponse> {
    return this.http
      .get<ApiResponse>(`${this.baseUrl}/User/verify-auth`, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          if (res.success && res.user) {
            this.currentUserSubject.next(res.user);
          } else {
            this.currentUserSubject.next(null);
          }
        })
      );
  }
}
