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
  selectedImage: string | null = null;
  isUploading = false;
  currentUserId!: number;

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
        if (user) {
          this.patchForm(user);
          this.selectedImage =
            user.profilePicture ||
            'https://static.vecteezy.com/system/resources/thumbnails/029/271/062/small_2x/avatar-profile-icon-in-flat-style-male-user-profile-illustration-on-isolated-background-man-profile-sign-business-concept-vector.jpg';
          this.currentUserId = user.id;
        }
      },
    });
    console.log('this is the selected Image: ' + this.selectedImage);
  }

  private patchForm(user: any): void {
    this.profileForm.patchValue({
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
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
      userId: this.currentUserId,
      username: formValue.username,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      currentPassword: formValue.password,
      newPassword: formValue.newPassword || null,
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
            confirmNewPassword: '',
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
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImage = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Upload to ImgBB → then update profile picture
      this.uploadProfilePicture(file);
    }
  }

  uploadProfilePicture(file: File): void {
    this.isUploading = true;

    this.userService.updateProfilePicture(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res.success) {
          alert('✅ Profile picture updated!');
        }
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload failed', err);
        alert('❌ Failed to upload image. Please try again.');
      },
    });
  }

  removeProfilePicture(): void {
    if (confirm('Are you sure you want to remove your profile picture?')) {
      // Just set to null on backend
      this.userService.updateProfilePicture(null).subscribe({
        next: (res) => {
          if (res.success) {
            this.selectedImage =
              'https://static.vecteezy.com/system/resources/thumbnails/029/271/062/small_2x/avatar-profile-icon-in-flat-style-male-user-profile-illustration-on-isolated-background-man-profile-sign-business-concept-vector.jpg';
          }
        },
        error: () => {
          alert('Failed to remove picture.');
        },
      });
    }
  }
}
