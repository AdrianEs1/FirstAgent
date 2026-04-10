import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './components/Home';
import AgentPage from './components/AgentPage';
import ProtectedRoute from './privateRoute/ProtectedRoute';
import LoginCard from './components/Login';
import RegisterCard from './components/Register';
import ResetPassword from './components/ResetPassword';
import ForgotPassword from './components/ForgotPassword';
import ConfirmDeleteAccount from './components/ConfirmDeleteAccount';
import Pricing from './components/Pricing';
import Settings from './components/Settings';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import RefundPolicy from './components/RefundPolicy';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1f" }}>
        <div className="text-center">
          <div
            className="rounded-full mx-auto mb-4"
            style={{
              width: 56, height: 56,
              border: "3px solid rgba(0,210,255,0.15)",
              borderTop: "3px solid #00d2ff",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Cargando AssistWork...</p>
        </div>
      </div>
    );
  }

  

  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Home />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/delete-account" element={<ConfirmDeleteAccount/>}/>
      <Route path='/privacy' element={<PrivacyPolicy/>}/>
      <Route path='/terms' element={<TermsOfService/>}/>
      <Route path='/refund' element={<RefundPolicy/>}/>


      {/* Auth */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginCard /> : <Navigate to="/agentPage" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <RegisterCard /> : <Navigate to="/agentPage" />}
      />

      <Route
        path="/pricing"
        element={<Pricing />}
      />

      {/* Privada */}
      <Route
        path="/agentPage"
        element={
          <ProtectedRoute>
            <AgentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
