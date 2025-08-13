import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  register(username: string, email: string, password: string ) {
    return this.http.post(`${this.baseUrl}/User/register`, { username, email, password });
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
