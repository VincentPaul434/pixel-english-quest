import type { ChangeEventHandler, FormEventHandler } from 'react';
import type { Role, User } from '../../academy/models/types';

export type AuthMode = 'login' | 'register';

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: User;
};

export type AuthViewProps = {
  onAuthenticated: (user: User) => void;
};

export type AuthFormField = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export type AuthViewModel = {
  mode: AuthMode;
  role: Role;
  busy: boolean;
  error: string;
  submitLabel: string;
  modeLinkLabel: string;
  nameField: AuthFormField;
  emailField: AuthFormField;
  passwordField: AuthFormField;
  teacherInviteCodeField: AuthFormField;
  submit: FormEventHandler<HTMLFormElement>;
  toggleMode: () => void;
  selectRole: (role: Role) => void;
  startDemo: (role: Role) => void;
};
