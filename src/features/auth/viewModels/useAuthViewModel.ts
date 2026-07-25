import { useState, type FormEvent } from 'react';
import { avatarOptionsByRole, defaultAvatarIdByRole } from '../../academy/models/avatars';
import type { Role } from '../../academy/models/types';
import { useAuthenticateMutation, useConfirmPasswordResetMutation, useRequestPasswordResetMutation } from '../../../hooks/mutations/sessionMutations';
import type { AuthMode, AuthViewModel, AuthViewProps } from '../models/types';

export function useAuthViewModel({ onAuthenticated }: AuthViewProps): AuthViewModel {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role>('student');
  const [avatarId, setAvatarId] = useState(defaultAvatarIdByRole.student);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [teacherInviteCode, setTeacherInviteCode] = useState('');
  const [error, setError] = useState('');
  const authenticateMutation = useAuthenticateMutation();
  const requestResetMutation = useRequestPasswordResetMutation();
  const confirmResetMutation = useConfirmPasswordResetMutation();
  const busy = authenticateMutation.isPending || requestResetMutation.isPending || confirmResetMutation.isPending;

  const authenticateUser = async (payload: Record<string, string>, endpoint: string) => {
    setError('');
    try {
      onAuthenticated(await authenticateMutation.mutateAsync({ payload, endpoint }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enter the academy.');
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void authenticateUser(mode === 'login' ? { email, password, mfaCode } : { name, email, password, role, avatarId, teacherInviteCode }, `/api/auth/${mode}`);
  };

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    setAvatarId(defaultAvatarIdByRole[nextRole]);
  };

  const startDemo = (demoRole: Role) => {
    setRole(demoRole);
    void authenticateUser(
      demoRole === 'teacher'
        ? { email: 'teacher@pixel.academy', password: 'Teach123!' }
        : { email: 'student@pixel.academy', password: 'Learn123!' },
      '/api/auth/login'
    );
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const forgotPassword = async () => {
    const accountEmail = window.prompt('Enter the email address for your account', email);
    if (!accountEmail) return;
    setError('');
    try {
      const result = await requestResetMutation.mutateAsync(accountEmail);
      if (!result.developmentToken) {
        setError('If the account exists, reset instructions were sent by email.');
        return;
      }
      const password = window.prompt('Development mode: enter a new password (8+ characters with a letter and number)');
      if (!password) return;
      await confirmResetMutation.mutateAsync({ token: result.developmentToken, password });
      setError('Password updated. You can sign in now.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not reset the password.'); }
  };

  return {
    mode,
    role,
    avatarId,
    avatarOptions: avatarOptionsByRole[role],
    busy,
    error,
    submitLabel: busy ? 'Opening the gates...' : mode === 'login' ? 'Sign in' : `Create ${role} account`,
    modeLinkLabel: mode === 'login' ? 'New to the academy? Create an account' : 'Already have an account? Sign in',
    nameField: { value: name, onChange: (event) => setName(event.target.value) },
    emailField: { value: email, onChange: (event) => setEmail(event.target.value) },
    passwordField: { value: password, onChange: (event) => setPassword(event.target.value) },
    mfaCodeField: { value: mfaCode, onChange: (event) => setMfaCode(event.target.value.toUpperCase()) },
    teacherInviteCodeField: { value: teacherInviteCode, onChange: (event) => setTeacherInviteCode(event.target.value) },
    submit,
    toggleMode,
    selectRole,
    selectAvatar: setAvatarId,
    startDemo,
    forgotPassword: () => void forgotPassword()
  };
}
