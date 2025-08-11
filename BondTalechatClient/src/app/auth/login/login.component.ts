import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialization logic can go here
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  onFormSubmit(): void {
    if (this.loginForm.valid) {
      const formData = this.loginForm;
      console.log('Login data submitted:', formData);
      this.navigateToHome();
      
    } else {
      console.error('Form is invalid', this.loginForm);
    }
  }
}
