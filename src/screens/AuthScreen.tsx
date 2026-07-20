import { useState, type FormEvent } from 'react';
import { PixelIcon } from '../components/PixelIcon';
import { request, setToken } from '../services/api';
import pixelWizard from '../assets/pixel-wizard.png';
import type { Role, User } from '../types/academy';

type AuthResponse = { token: string; expiresAt: string; user: User };

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherInviteCode, setTeacherInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const authenticate = async (payload: Record<string, string>, endpoint: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await request<AuthResponse>(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      setToken(result.token);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enter the academy.');
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void authenticate(mode === 'login' ? { email, password } : { name, email, password, role, teacherInviteCode }, `/api/auth/${mode}`);
  };

  const demo = (demoRole: Role) => {
    setRole(demoRole);
    void authenticate(
      demoRole === 'teacher'
        ? { email: 'teacher@pixel.academy', password: 'Teach123!' }
        : { email: 'student@pixel.academy', password: 'Learn123!' },
      '/api/auth/login'
    );
  };

  return (
    <main className="auth-screen">
      <section className="auth-story">
        <div className="auth-brand"><span><PixelIcon name="academy" /></span> English Pixel <em>Academy</em></div>
        <div className="auth-copy">
          <span className="overline"><PixelIcon name="sparkle" size={16} /> A complete learning adventure</span>
          <h1>Learn bravely.<br /><em>Teach brilliantly.</em></h1>
          <p>Structured courses, meaningful mastery, teacher-created quests, and progress that follows every learner.</p>
          <div className="auth-feature-grid">
            <div><PixelIcon name="book" /><span><strong>Guided curriculum</strong><small>Courses, modules, and assignments</small></span></div>
            <div><PixelIcon name="brain" /><span><strong>Real mastery</strong><small>Attempts, feedback, and skill insights</small></span></div>
            <div><PixelIcon name="mic" /><span><strong>Speaking practice</strong><small>Browser-based pronunciation feedback</small></span></div>
            <div><PixelIcon name="trophy" /><span><strong>Motivation</strong><small>Goals, streaks, XP, and achievements</small></span></div>
          </div>
        </div>
        <img className="auth-wizard" src={pixelWizard} alt="Pixel wizard welcoming learners" />
      </section>

      <section className="auth-panel-wrap">
        <form className="auth-panel panel" onSubmit={submit}>
          <div className="auth-mobile-brand"><PixelIcon name="academy" /> English Pixel Academy</div>
          <span className="overline">{mode === 'login' ? 'Welcome back' : 'Begin your journey'}</span>
          <h2>{mode === 'login' ? 'Enter the academy' : 'Create your account'}</h2>
          <p>{mode === 'login' ? 'Continue learning or manage your classroom.' : 'Choose the workspace that matches your adventure.'}</p>

          {mode === 'register' && (
            <>
              <div className="role-switch" aria-label="Account role">
                <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}><PixelIcon name="book" /> Student</button>
                <button type="button" className={role === 'teacher' ? 'active' : ''} onClick={() => setRole('teacher')}><PixelIcon name="academy" /> Teacher</button>
              </div>
              <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required autoComplete="name" /></label>
            </>
          )}
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {mode === 'register' && role === 'teacher' && <label>Teacher invite code <small>Required only when the academy administrator configured one.</small><input type="password" value={teacherInviteCode} onChange={(event) => setTeacherInviteCode(event.target.value)} autoComplete="off" /></label>}
          {error && <div className="form-error" role="alert"><PixelIcon name="close" size={16} /> {error}</div>}
          <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Opening the gates...' : mode === 'login' ? 'Sign in' : `Create ${role} account`} <PixelIcon name="play" /></button>

          <button type="button" className="auth-mode-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'New to the academy? Create an account' : 'Already have an account? Sign in'}
          </button>

          <div className="demo-divider"><span>or explore the demo</span></div>
          <div className="demo-actions">
            <button type="button" onClick={() => demo('student')} disabled={busy}><PixelIcon name="book" /> Student demo</button>
            <button type="button" onClick={() => demo('teacher')} disabled={busy}><PixelIcon name="academy" /> Teacher demo</button>
          </div>
        </form>
      </section>
    </main>
  );
}
