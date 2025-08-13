import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { User } from '../Models/user.model';
import { Observable } from 'rxjs';

export interface ApiResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  register(user:User ): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/User/register`, user);
  }


  login(username: string, password: string) {
    return this.http
      .post<{ token: string }>(`${this.baseUrl}/login`, { username, password })
      .pipe(tap((res) => localStorage.setItem('token', res.token)));
  }

  getToken() {
    return localStorage.getItem('token');
  }
  logout() {
    localStorage.removeItem('token');
  }
  isLoggedIn() {
    return !!this.getToken();
  };
}
