import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  Validators,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UserService } from '../../Services/user.service';
import { Router } from '@angular/router';
import { from, Subscription } from 'rxjs';
import { passwordMatchValidator } from '../../validators/password-match.validator';
import { requireOldPasswordValidator } from '../../validators/change-password.validator';
import { CommonModule } from '@angular/common';
import { User } from '../../Models/user.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  private userSubscription!: Subscription;
  isLoading = false;
  
  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.profileForm = new FormGroup(
      {
        username: new FormControl('', Validators.required),
        email: new FormControl(''),
        phoneNumber: new FormControl('', [
          Validators.required,
          Validators.pattern('^[0-9]{10}$'),
        ]),
        password: new FormControl('', Validators.required),
        newPassword: new FormControl(''),
        confirmNewPassword: new FormControl(''),
      },
      {
        validators: [
          passwordMatchValidator('newPassword', 'confirmNewPassword'), // Custom Cross Field Validator
        ],
      }
    );

    // this.loadUserData();

    this.userSubscription = this.userService.currentUserSubject.subscribe({
      next: (user) => {
        if( user)
        {
          this.patchForm(user);
        }
      }
    })
  }

  private patchForm(user: any): void {
    this.profileForm.patchValue({
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber
    })
  }


  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    this.isLoading = true;

    const formValue = this.profileForm.value;

    const payload = {
      username: formValue.username,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      currentPassword: formValue.password,
      newPassword: formValue.newPassword || null
    };

    this.userService.updateProfile(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          alert('✅ Profile updated successfully!');
          // Clear password fields
          this.profileForm.patchValue({
            password: '',
            newPassword: '',
            confirmNewPassword: ''
          });
          this.profileForm.markAsPristine();
        } else {
          alert(`❌ Error: ${response.message}`);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Update failed', err);
        alert('❌ Failed to update profile. Please try again.');
      }
    });
  }

}
