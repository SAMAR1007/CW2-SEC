import { z } from 'zod';

export const registerDTO = z.object({
  body: z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Invalid email address'),
      phoneNumber: z.string().min(7, 'Phone number must be at least 7 digits'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]{8,}$/,
          'Password must include uppercase, lowercase, and a digit'
        ),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
      role: z.enum(['user', 'admin']).optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const loginDTO = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    // Optional MFA code and CAPTCHA token
    mfaCode: z.string().length(6).optional(),
    recaptchaToken: z.string().optional(),
  }),
});

export const forgotPasswordDTO = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordDTO = z
  .object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      otp: z.string().min(6, 'OTP must be at least 6 characters'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]{8,}$/,
          'Password must include uppercase, lowercase, and a digit'
        ),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    }),
  })
  .refine((data) => data.body.password === data.body.confirmPassword, {
    message: 'Passwords do not match',
    path: ['body', 'confirmPassword'],
  });

export const changePasswordDTO = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]{8,}$/,
        'New password must include uppercase, lowercase, and a digit'
      ),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }),
});
