import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './components/Home';
import AgentPage from './components/AgentPage';
import ProtectedRoute from './privateRoute/ProtectedRoute';
import LoginCard from './components/Login';
import RegisterCard from './components/Register';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando OptimusAgent...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/home" element={<Home />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/agentPage" /> : <LoginCard />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/agentPage" /> : <RegisterCard />}
      />

      {/* Rutas protegidas */}
      <Route
        path="/agentPage"
        element={
          <ProtectedRoute>
            <AgentPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/agentPage" : "/login"} />}
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
