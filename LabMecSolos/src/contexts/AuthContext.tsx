import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { login as authLogin, logout as authLogout, checkSession } from '../services/AuthService';
import { SessionData } from '../models/types';

interface AuthContextType {
  usuario: SessionData | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  atualizarUsuario: (dados: SessionData) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const sess = await checkSession();
      setUsuario(sess);
      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const result = await authLogin(email, senha);
    if (result.success && result.user) {
      setUsuario(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, atualizarUsuario: setUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};
