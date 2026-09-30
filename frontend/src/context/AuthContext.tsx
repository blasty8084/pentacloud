import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, tokenStorage, type User } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from memory (tokenStorage) on app load
  useEffect(() => {
    const storedToken = tokenStorage.getToken();
    // We don't persist user in localStorage anymore - we'll fetch from /me
    if (storedToken) {
      // Try to restore session via /me endpoint
      const restoreSession = async () => {
        try {
          const response = await authApi.me();
          setUser(response.data.user);
        } catch {
          // Session invalid, clear token
          tokenStorage.clearToken();
        } finally {
          setLoading(false);
        }
      };
      restoreSession();
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { accessToken: newToken, user: newUser } = response.data;
    tokenStorage.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const response = await authApi.signup({ email, password, name });
    const { accessToken: newToken, user: newUser } = response.data;
    tokenStorage.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      tokenStorage.clearToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}