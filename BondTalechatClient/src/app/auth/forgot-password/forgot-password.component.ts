import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  constructor() {}

  ngOnInit(): void {
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      username: new FormControl('', Validators.required),
      // newPassword: new FormControl('', Validators.required),
      // confirmNewPassword: new FormControl('', Validators.required),
    })
  }

  onFormSubmit(): void {
   if(this.forgotPasswordForm.valid) {
      const formData = this.forgotPasswordForm.value;
      console.log('Forgot Password data submitted:', formData);
    } else {
      console.error('Form is invalid', this.forgotPasswordForm);
    }
  }
}
