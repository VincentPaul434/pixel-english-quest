import { useState, type FormEvent } from 'react';
import type { Role } from '../../academy/models/types';
import { authenticate } from '../models/api';
import type { AuthMode, AuthViewModel, AuthViewProps } from '../models/types';

export function useAuthViewModel({ onAuthenticated }: AuthViewProps): AuthViewModel {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherInviteCode, setTeacherInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const authenticateUser = async (payload: Record<string, string>, endpoint: string) => {
    setBusy(true);
    setError('');
    try {
      onAuthenticated(await authenticate(payload, endpoint));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enter the academy.');
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void authenticateUser(mode === 'login' ? { email, password } : { name, email, password, role, teacherInviteCode }, `/api/auth/${mode}`);
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

  return {
    mode,
    role,
    busy,
    error,
    submitLabel: busy ? 'Opening the gates...' : mode === 'login' ? 'Sign in' : `Create ${role} account`,
    modeLinkLabel: mode === 'login' ? 'New to the academy? Create an account' : 'Already have an account? Sign in',
    nameField: { value: name, onChange: (event) => setName(event.target.value) },
    emailField: { value: email, onChange: (event) => setEmail(event.target.value) },
    passwordField: { value: password, onChange: (event) => setPassword(event.target.value) },
    teacherInviteCodeField: { value: teacherInviteCode, onChange: (event) => setTeacherInviteCode(event.target.value) },
    submit,
    toggleMode,
    selectRole: setRole,
    startDemo
  };
}
