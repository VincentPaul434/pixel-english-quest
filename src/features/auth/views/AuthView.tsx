import { PixelIcon } from '../../../shared-components/PixelIcon';
import pixelWizard from '../../../assets/pixel-wizard.png';
import type { AuthViewProps } from '../models/types';
import { useAuthViewModel } from '../viewModels/useAuthViewModel';

export function AuthView(props: AuthViewProps) {
  const vm = useAuthViewModel(props);

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
        <form className="auth-panel panel" onSubmit={vm.submit}>
          <div className="auth-mobile-brand"><PixelIcon name="academy" /> English Pixel Academy</div>
          <span className="overline">{vm.mode === 'login' ? 'Welcome back' : 'Begin your journey'}</span>
          <h2>{vm.mode === 'login' ? 'Enter the academy' : 'Create your account'}</h2>
          <p>{vm.mode === 'login' ? 'Continue learning or manage your classroom.' : 'Choose the workspace that matches your adventure.'}</p>

          {vm.mode === 'register' && (
            <>
              <div className="role-switch" aria-label="Account role">
                <button type="button" className={vm.role === 'student' ? 'active' : ''} onClick={() => vm.selectRole('student')}><PixelIcon name="book" /> Student</button>
                <button type="button" className={vm.role === 'teacher' ? 'active' : ''} onClick={() => vm.selectRole('teacher')}><PixelIcon name="academy" /> Teacher</button>
              </div>
              <label>Display name<input {...vm.nameField} maxLength={40} required autoComplete="name" /></label>
            </>
          )}
          <label>Email address<input type="email" {...vm.emailField} required autoComplete="email" /></label>
          <label>Password<input type="password" {...vm.passwordField} required minLength={8} autoComplete={vm.mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {vm.mode === 'register' && vm.role === 'teacher' && <label>Teacher invite code <small>Required only when the academy administrator configured one.</small><input type="password" {...vm.teacherInviteCodeField} autoComplete="off" /></label>}
          {vm.error && <div className="form-error" role="alert"><PixelIcon name="close" size={16} /> {vm.error}</div>}
          <button className="primary-button auth-submit" disabled={vm.busy}>{vm.submitLabel} <PixelIcon name="play" /></button>

          <button type="button" className="auth-mode-link" onClick={vm.toggleMode}>
            {vm.modeLinkLabel}
          </button>

          <div className="demo-divider"><span>or explore the demo</span></div>
          <div className="demo-actions">
            <button type="button" onClick={() => vm.startDemo('student')} disabled={vm.busy}><PixelIcon name="book" /> Student demo</button>
            <button type="button" onClick={() => vm.startDemo('teacher')} disabled={vm.busy}><PixelIcon name="academy" /> Teacher demo</button>
          </div>
        </form>
      </section>
    </main>
  );
}
