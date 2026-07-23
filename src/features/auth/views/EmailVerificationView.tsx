import { useEffect, useState } from 'react';
import { confirmVerification } from '../../platform/models/api';
import { PixelIcon } from '../../../shared-components/PixelIcon';

export function EmailVerificationView({ token, homePath }: { token: string; homePath: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Confirming your email address...' : 'This verification link is missing its token.');

  useEffect(() => {
    if (!token) return;
    void confirmVerification(token).then(() => {
      setStatus('success');
      setMessage('Your email address is verified. Your account security status is now up to date.');
    }).catch((reason) => {
      setStatus('error');
      setMessage(reason instanceof Error ? reason.message : 'Could not verify this email address.');
    });
  }, [token]);

  return (
    <main className="account-action-screen">
      <section className="account-action-card panel" role={status === 'error' ? 'alert' : 'status'}>
        <span className={`account-action-icon ${status}`}><PixelIcon className={status === 'loading' ? 'loading-rune' : ''} name={status === 'success' ? 'check' : status === 'error' ? 'close' : 'sparkle'} size={52} /></span>
        <p className="overline">English Pixel Academy</p>
        <h1>{status === 'success' ? 'Email verified' : status === 'error' ? 'Verification unsuccessful' : 'Verifying email'}</h1>
        <p>{message}</p>
        {status !== 'loading' && <a className="primary-button" href={homePath}>{homePath === '/auth' ? 'Continue to sign in' : 'Return to the academy'}</a>}
      </section>
    </main>
  );
}
