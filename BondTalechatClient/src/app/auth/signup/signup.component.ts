import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { passwordMatchValidator } from '../../validators/password-match.validator';
import { UserService } from '../../Services/user.service';
import { User } from '../../Models/user.model';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.signupForm = new FormGroup(
      {
        username: new FormControl('', Validators.required),
        phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', Validators.required),
        confirmPassword: new FormControl('', Validators.required),
      },
      {
        validators: passwordMatchValidator('password', 'confirmPassword'), // Custom Cross Field Validator
      }
    );
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  onFormSubmit(): void {
    if (this.signupForm.valid) {
      // const { username, email, password } = this.signupForm.value;
      const user: User = {
        username: this.signupForm.value.username!,
        email: this.signupForm.value.email!,
        password: this.signupForm.value.password!,
        phoneNumber: this.signupForm.value.phoneNumber!
      };
      this.userService.register(user).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Registration successful', response);
            this.navigateToHome();
          }
        },
        error: (error) => {
          console.error('Registration failed', error.error.message);
          alert(error.error.message);
        },
      });
    } else {
      console.log('Form is invalid', this.signupForm);
    }
  }
}
