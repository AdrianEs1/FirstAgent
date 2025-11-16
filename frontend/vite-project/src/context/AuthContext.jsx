import { createContext, useContext, useState, useEffect } from "react";
import { fetchCurrentUser } from "../services/agentServices";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log("🔍 Iniciando verificación de auth...");
      const token = localStorage.getItem("token");
      console.log("🎫 Token encontrado:", token ? "SÍ" : "NO");
      
      if (token) {
        try {
          console.log("📡 Llamando a fetchCurrentUser...");
          const userData = await fetchCurrentUser(token);
          console.log("✅ Usuario obtenido:", userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("❌ Error en fetchCurrentUser:", error);
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log("⚠️ No hay token, usuario no autenticado");
      }
      setIsLoading(false);
      console.log("✅ Verificación completada");
    };
    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };
  //MODIFICAR URL DEL FETCH EN PRODUCCION o LOCAL: "https://adrianarchitecia-optimusagent.hf.space" 
  // http://localhost:5000

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("https://adrianarchitecia-optimusagent.hf.space/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedData) =>
    setUser((prev) => ({ ...prev, ...updatedData }));

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}

export { AuthProvider, useAuth };
