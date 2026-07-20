import { AcademyRoutes } from './routes';
import { PixelIcon } from './shared-components/PixelIcon';
import { useAcademySession } from './features/session';

function App() {
  const { user, loading, setUser, logout } = useAcademySession();

  if (loading) return <main className="loading-screen"><PixelIcon className="loading-rune" name="sparkle" size={58} /><p>Restoring your academy session...</p></main>;
  return <AcademyRoutes user={user} onAuthenticated={setUser} onLogout={() => void logout()} />;
}

export default App;
