import { useEffect, useState } from 'react';
import { clearSessionToken, hasSessionToken, logoutSession, restoreSession } from '../models/api';
import type { User } from '../../academy/models/types';
import type { AcademySessionViewModel } from '../models/types';

export function useAcademySessionViewModel(): AcademySessionViewModel {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSessionToken());

  useEffect(() => {
    const clearSession = () => {
      clearSessionToken();
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('academy:unauthorized', clearSession);
    if (hasSessionToken()) {
      restoreSession()
        .then(setUser)
        .catch(clearSession)
        .finally(() => setLoading(false));
    }

    return () => window.removeEventListener('academy:unauthorized', clearSession);
  }, []);

  const logout = async () => {
    try {
      await logoutSession();
    } catch {
      // Local logout still needs to work when the API is unavailable.
    }
    clearSessionToken();
    setUser(null);
  };

  return { user, loading, setUser, logout };
}
