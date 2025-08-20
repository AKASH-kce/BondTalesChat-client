import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../Services/user.service';
import { passwordMatchValidator } from '../../validators/password-match.validator';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
// export class ForgotPasswordComponent implements OnInit {
//   forgotPasswordForm!: FormGroup;
//   constructor() {}

//   ngOnInit(): void {
//     this.forgotPasswordForm = new FormGroup({
//       email: new FormControl('', [Validators.required, Validators.email]),
//       username: new FormControl('', Validators.required),
//       // newPassword: new FormControl('', Validators.required),
//       // confirmNewPassword: new FormControl('', Validators.required),
//     })
//   }

//   onFormSubmit(): void {
//    if(this.forgotPasswordForm.valid) {
//       const formData = this.forgotPasswordForm.value;
//       console.log('Forgot Password data submitted:', formData);
//     } else {
//       console.error('Form is invalid', this.forgotPasswordForm);
//     }
//   }
// }

// forgot-password.component.ts

export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  otpForm!: FormGroup;
  newPasswordForm!: FormGroup;

  step = 1; // 1: Email/Username, 2: OTP, 3: New Password

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      username: new FormControl('', Validators.required),
    });

    this.otpForm = new FormGroup({
      otp: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)])
    });

    this.newPasswordForm = new FormGroup({
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]),
      confirmNewPassword: new FormControl('', Validators.required)
    }, { validators: passwordMatchValidator('password', 'confirmPassword') });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmNewPassword')?.value
      ? null : { mismatch: true };
  }

  sendOtp() {
    if (this.forgotPasswordForm.invalid) return;

    const { email, username } = this.forgotPasswordForm.value;

    this.userService.forgotPassword(email, username).subscribe({
      next: (res) => {
        if (res.success) {
          alert('OTP sent to your email.');
          this.step = 2;
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to send OTP.');
      }
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;

    const email = this.forgotPasswordForm.get('email')?.value;
    console.log("this the email passed for verification "+ email);
    const otp = this.otpForm.get('otp')?.value;
    console.log("this the OTP passed for verification "+ otp);
    this.userService.verifyOtp(email, otp).subscribe({
      next: (res) => {
        if (res.success) {
          this.step = 3;
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Invalid OTP.');
      }
    });
  }

  resetPassword() {
    if (this.newPasswordForm.invalid) return;

    const email = this.forgotPasswordForm.get('email')?.value;
    const newPassword = this.newPasswordForm.get('newPassword')?.value;

    this.userService.resetPassword(email, newPassword).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Password reset successfully!');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to reset password.');
      }
    });
  }
}