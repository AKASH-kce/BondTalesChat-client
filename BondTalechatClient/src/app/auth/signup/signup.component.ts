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
      //const formData = this.signupForm.value;
      const { username, email, password } = this.signupForm.value;
      //console.log('Signup data submitted:', formData);
      this.userService.register(username, email, password).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          this.navigateToHome(); // Navigate to home on successful registration
        },
        error: (error) => {
          console.error('Registration failed', error);
          alert('Registration failed. Please try again.');
        },
      })
    } else {
      console.log('Form is invalid', this.signupForm);
    }
  }
}
