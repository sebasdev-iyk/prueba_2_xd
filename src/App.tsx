import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-blue-600 flex items-center justify-center">
        <img src="/carga.gif" alt="Cargando..." className="w-32 h-32" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Layout />;
}

export default App;
