import { useEffect, useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { getToken, request, setToken } from './api';
import { PixelIcon } from './PixelIcon';
import { StudentWorkspace } from './StudentWorkspace';
import { TeacherWorkspace } from './TeacherWorkspace';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    const unauthorized = () => { setToken(''); setUser(null); setLoading(false); };
    window.addEventListener('academy:unauthorized', unauthorized);
    if (getToken()) {
      request<User>('/api/me').then(setUser).catch(() => { setToken(''); setUser(null); }).finally(() => setLoading(false));
    }
    return () => window.removeEventListener('academy:unauthorized', unauthorized);
  }, []);

  const logout = async () => {
    try { await request('/api/auth/logout', { method: 'POST' }); } catch { /* Clear the local session even if the server is unavailable. */ }
    setToken('');
    setUser(null);
  };

  if (loading) return <main className="loading-screen"><PixelIcon className="loading-rune" name="sparkle" size={58} /><p>Restoring your academy session...</p></main>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  return user.role === 'teacher'
    ? <TeacherWorkspace initialUser={user} onLogout={() => void logout()} />
    : <StudentWorkspace initialUser={user} onLogout={() => void logout()} />;
}

export default App;
