import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Role } from '../types/auth';
import { api, setAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSetAccessToken = (token: string | null) => {
    setAccessToken(token);
    setAccessTokenState(token);
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { accessToken, user: loggedUser } = res.data;
      handleSetAccessToken(accessToken);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: Role): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/register', { name, email, password, role });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.error('Error logging out:', e);
    } finally {
      handleSetAccessToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Exchange refresh cookie for access token
        const refreshRes = await api.post('/api/auth/refresh');
        const token = refreshRes.data.accessToken;
        handleSetAccessToken(token);

        // Fetch current user details with newly generated access token
        const meRes = await api.get('/api/auth/me');
        setUser(meRes.data.user);
      } catch (e) {
        handleSetAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
