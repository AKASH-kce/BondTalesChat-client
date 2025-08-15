import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import { MediaPreviewComponent } from './components/media-preview/media-preview.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signUp', component: SignupComponent },
  { path: 'forgotPassword', component: ForgotPasswordComponent },
  { path: 'home', component: HomeComponent },
  { path: 'userProfile', component: UserProfileComponent }
];
