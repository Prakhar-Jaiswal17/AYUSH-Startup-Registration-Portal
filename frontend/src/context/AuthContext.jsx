import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockUsers, mockStartups } from '../data/mockData';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ayush_setu_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        if (parsed.user?.role === 'startup') {
          const s = mockStartups.find(st => st.userId === parsed.user.id);
          setStartup(s || null);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const found = mockUsers.find(
      u => u.email === email && u.password === password
    );

    if (!found) {
      throw new Error('Invalid email or password. Please try again.');
    }

    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: safeUser }));

    if (safeUser.role === 'startup') {
      const s = mockStartups.find(st => st.userId === safeUser.id);
      setStartup(s || null);
    }

    return safeUser;
  }, []);

  const register = useCallback(async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newUser = {
      id: `usr_startup_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      role: 'startup',
      avatar: null,
      startupId: null,
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser }));
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStartup(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loginAsRole = useCallback(async (role) => {
    const roleEmails = {
      startup: 'startup@ayushsetu.demo',
      officer: 'officer@ayushsetu.demo',
      admin: 'admin@ayushsetu.demo',
    };
    return login(roleEmails[role], 'demo1234');
  }, [login]);

  const value = {
    user,
    startup,
    loading,
    login,
    register,
    logout,
    loginAsRole,
    isAuthenticated: !!user,
    isStartup: user?.role === 'startup',
    isOfficer: user?.role === 'officer',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
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

