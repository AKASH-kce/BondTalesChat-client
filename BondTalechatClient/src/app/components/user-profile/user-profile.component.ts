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
import { from } from 'rxjs';
import { passwordMatchValidator } from '../../validators/password-match.validator';
import { requireOldPasswordValidator } from '../../validators/change-password.validator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.profileForm = new FormGroup(
      {
        username: new FormControl('', Validators.required),
        email: new FormControl('koushiik@gmail.com'),
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
          // requireOldPasswordValidator(
          //   'password',
          //   'newPassword',
          //   'confirmNewPassword'
          // ),
        ],
      }
    );

    // this.profileForm.valueChanges.subscribe(() => {
    //   if (
    //     this.profileForm.get('newPassword')?.value ||
    //     this.profileForm.get('confirmNewPassword')?.value
    //   ) {
    //     this.profileForm.updateValueAndValidity({
    //       onlySelf: false,
    //       emitEvent: false,
    //     });
    //   }
    // });
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
