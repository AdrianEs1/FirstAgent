import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    // Mostrar loading mientras verifica autenticación
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-600"></div>
            </div>
        );
    }

    // Si no está autenticado, redirigir a home
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Si está autenticado, mostrar el componente
    return children;
}

export default ProtectedRoute;