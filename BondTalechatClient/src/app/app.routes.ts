import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signUp', component: SignupComponent },
  { path: 'forgotPassword', component: ForgotPasswordComponent },
];
