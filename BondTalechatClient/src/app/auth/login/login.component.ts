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
import { UserService } from '../../Services/user.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    // Initialization logic can go here
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
    });
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  onFormSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.userService.login(email, password).subscribe({
        next: (response) =>{
          if(response.success)
          {
            console.log("Login Successfull", response);
            this.navigateToHome();
          }
        },
        error: (error) =>{
          console.error('Login failed', error.error.message);
          alert(error.error.message);
        }
      })
      
    } else {
      console.error('Form is invalid', this.loginForm);
    }
  }
}
