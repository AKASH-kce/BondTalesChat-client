import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { User } from '../Models/user.model';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

export interface ApiResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    phoneNumber: string;
    profilePicture: string;
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}`;
  public currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    this.loadUserData();
  }

  public loadUserData() {
    this.verifyAuth().subscribe();
  }

  getUser(): User {
    return this.currentUserSubject.value;
  }

  getUserName(): string {
    return this.currentUserSubject.value?.username || '';
  }

  register(user: User): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/User/register`, user, {
        withCredentials: true, // 👈 Critical: allows cookies to be sent/set
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(
        tap((res) => {
          if (res.success && res.token && res.user) {
            this.currentUserSubject.next(res.user);
          }
        })
      );
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
            this.currentUserSubject.next(res.user);
          }
        })
      );
  }

  logout(): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(
        `${this.baseUrl}/User/logout`,
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

  // Services/user.service.ts

  updateProfile(data: {
    username: string;
    email: string;
    phoneNumber?: string;
    currentPassword: string;
    newPassword?: string | null;
  }): Observable<ApiResponse> {
    return this.http
      .put<ApiResponse>(`${this.baseUrl}/User/update`, data, {
        withCredentials: true,
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(
        tap((res) => {
          if (res.success && res.user) {
            this.currentUserSubject.next(res.user); // Update global state
          }
        })
      );
  }

  // Add this method
  updateProfilePicture(imageFile: File | null): Observable<ApiResponse> {
    // Case 1: Remove image (set to null)
    if (imageFile === null) {
      return this.http
        .put<ApiResponse>(
          `${this.baseUrl}/User/update-profile-picture`,
          { profilePictureUrl: null },
          {
            withCredentials: true,
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
          }
        )
        .pipe(
          tap((res) => {
            if (res.success && res.user) {
              this.currentUserSubject.next(res.user);
            }
          }),
          catchError((error) => {
            console.error('Failed to remove profile picture', error);
            return throwError(
              () => new Error('Could not remove profile picture.')
            );
          })
        );
    }

    // Case 2: Upload new image
    const imgbbApiKey = '7b5a1be1baf098bc5f38a6a1a8c26c83';
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('key', imgbbApiKey);

    return this.http
      .post<any>('https://api.imgbb.com/1/upload', formData) // ← Fixed: removed extra space
      .pipe(
        switchMap((imgbbResponse) => {
          if (!imgbbResponse?.data?.url) {
            return throwError(
              () => new Error('Failed to upload to ImgBB: Invalid response')
            );
          }

          const imageUrl = imgbbResponse.data.url;

          // Update backend with new image URL
          return this.http
            .put<ApiResponse>(
              `${this.baseUrl}/User/update-profile-picture`,
              { profilePictureUrl: imageUrl },
              {
                withCredentials: true,
                headers: new HttpHeaders({
                  'Content-Type': 'application/json',
                }),
              }
            )
            .pipe(
              tap((res) => {
                if (res.success && res.user) {
                  this.currentUserSubject.next(res.user);
                }
              })
            );
        }),
        catchError((error) => {
          console.error('Profile picture upload failed', error);
          return throwError(
            () => new Error('Could not upload image. Please try again.')
          );
        })
      );
  }
}
