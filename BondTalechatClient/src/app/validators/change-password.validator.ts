import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function requireOldPasswordValidator(
  passwordControlName: string,
  newPasswordControlName: string,
  confirmNewPasswordControlName: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordControlName);
    const newPassword = group.get(newPasswordControlName);
    const confirmNewPassword = group.get(confirmNewPasswordControlName);

    if (!password || !newPassword || !confirmNewPassword) {
      return null;
    }

    const shouldRequireOldPassword = 
      newPassword.value?.trim() || confirmNewPassword.value?.trim();

    if (shouldRequireOldPassword && !password.value?.trim()) {
      // Merge with existing errors
      password.setErrors({ ...password.errors, requireOldPassword: true });
      return { requireOldPassword: true };
    } else {
      // Only remove our specific error
      if (password.errors?.['requireOldPassword']) {
        const errors = { ...password.errors };
        delete errors['requireOldPassword'];
        password.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }
  };
}