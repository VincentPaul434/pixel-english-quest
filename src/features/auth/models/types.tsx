import type { ChangeEventHandler, FormEventHandler } from 'react';
import type { AvatarOption } from '../../academy/models/avatars';
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
  avatarId: string;
  avatarOptions: readonly AvatarOption[];
  busy: boolean;
  error: string;
  submitLabel: string;
  modeLinkLabel: string;
  nameField: AuthFormField;
  emailField: AuthFormField;
  passwordField: AuthFormField;
  mfaCodeField: AuthFormField;
  teacherInviteCodeField: AuthFormField;
  submit: FormEventHandler<HTMLFormElement>;
  toggleMode: () => void;
  selectRole: (role: Role) => void;
  selectAvatar: (avatarId: string) => void;
  startDemo: (role: Role) => void;
  forgotPassword: () => void;
};
