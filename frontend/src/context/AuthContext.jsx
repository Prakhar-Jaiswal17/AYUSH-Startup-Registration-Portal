import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockUsers, mockStartups } from '../data/mockData';
import { authAPI, getApiErrorMessage, startupAPI } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ayush_setu_auth';
const TOKEN_KEY = 'ayush_setu_token';
const API_TO_UI_ROLE = {
  STARTUP: 'startup',
  OFFICER: 'officer',
  ADMIN: 'admin',
};

function readResponseData(response) {
  const body = response?.data;
  if (!body?.success || body.data === undefined || body.data === null) {
    throw new Error(body?.error || 'The authentication service returned an unexpected response.');
  }
  return body.data;
}

function normalizeApiUser(apiUser) {
  const role = API_TO_UI_ROLE[apiUser?.role] || apiUser?.role?.toLowerCase();
  if (!apiUser?.id || !['startup', 'officer', 'admin'].includes(role)) {
    throw new Error('The authentication service returned an invalid user profile.');
  }

  return {
    ...apiUser,
    name: apiUser.name || apiUser.fullName || apiUser.email,
    role,
  };
}

function cachedDemoStartup(user) {
  if (user?.role !== 'startup') return null;
  return mockStartups.find((startup) => startup.userId === user.id) || null;
}

function getStoredSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function storeApiSession(token, apiUser) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('The authentication service did not return a token.');
  }

  const user = normalizeApiUser(apiUser);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, source: 'api' }));
  return user;
}

function authError(error, fallback) {
  return new Error(error?.apiMessage || getApiErrorMessage(error, fallback));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [startup, setStartup] = useState(null);
  const [isApiSession, setIsApiSession] = useState(false);
  const [startupLoading, setStartupLoading] = useState(false);
  const [startupError, setStartupError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const handleExpiredSession = () => {
      setUser(null);
      setStartup(null);
      setIsApiSession(false);
      setStartupError('');
      setLoading(false);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    };
    window.addEventListener('ayush:auth-expired', handleExpiredSession);

    const restoreSession = async () => {
      const stored = getStoredSession();
      const token = localStorage.getItem(TOKEN_KEY);

      if (token) {
        try {
          const apiUser = normalizeApiUser(readResponseData(await authAPI.getProfile()));
          if (active) {
            setUser(apiUser);
            setStartupLoading(true);
            setIsApiSession(true);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: apiUser, source: 'api' }));
          }
        } catch (error) {
          if (error?.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(STORAGE_KEY);
            if (active) {
              setUser(null);
              setStartup(null);
              setIsApiSession(false);
            }
          } else if (stored?.source === 'api' && stored.user) {
            // Keep the cached UI session during a temporary network/server outage.
            try {
              const cachedUser = normalizeApiUser(stored.user);
              if (active) {
                setUser(cachedUser);
                setStartupLoading(true);
                setIsApiSession(true);
              }
            } catch {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } else if (
        (stored?.source === 'demo' || !stored?.source)
        && mockUsers.some((demoUser) => demoUser.id === stored.user?.id)
      ) {
        if (active) {
          setUser(stored.user);
          setIsApiSession(false);
          setStartup(cachedDemoStartup(stored.user));
        }
      } else if (stored?.source === 'api') {
        // An API user cache is not a login session without its bearer token.
        localStorage.removeItem(STORAGE_KEY);
      }

      if (active) setLoading(false);
    };

    restoreSession();
    return () => {
      active = false;
      window.removeEventListener('ayush:auth-expired', handleExpiredSession);
    };
  }, []);

  const refreshStartupProfile = useCallback(async () => {
    if (!isApiSession || user?.role !== 'startup') return null;

    setStartupLoading(true);
    setStartupError('');
    try {
      const profile = readResponseData(await startupAPI.getMyProfile());
      setStartup(profile);
      return profile;
    } catch (error) {
      if (error?.response?.status === 404) {
        setStartup(null);
        return null;
      }
      const message = error?.apiMessage || getApiErrorMessage(error, 'Unable to load your startup profile.');
      setStartupError(message);
      throw new Error(message);
    } finally {
      setStartupLoading(false);
    }
  }, [isApiSession, user?.role]);

  useEffect(() => {
    if (isApiSession && user?.role === 'startup') {
      refreshStartupProfile().catch(() => {});
    } else if (!isApiSession) {
      setStartup(cachedDemoStartup(user));
      setStartupLoading(false);
      setStartupError('');
    } else {
      setStartup(null);
      setStartupLoading(false);
      setStartupError('');
    }
  }, [isApiSession, refreshStartupProfile, user]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const payload = readResponseData(response);
      const authenticatedUser = storeApiSession(payload.token, payload.user);
      setUser(authenticatedUser);
      setStartupLoading(true);
      setIsApiSession(true);
      setStartup(null);
      return authenticatedUser;
    } catch (error) {
      throw authError(error, 'Login failed. Please try again.');
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const payload = readResponseData(response);
      const authenticatedUser = storeApiSession(payload.token, payload.user);
      setUser(authenticatedUser);
      setStartupLoading(true);
      setIsApiSession(true);
      setStartup(null);
      return authenticatedUser;
    } catch (error) {
      throw authError(error, 'Registration failed. Please try again.');
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    let logoutRequest = null;

    if (token) {
      try {
        // Pass the token explicitly so local sign-out can happen immediately.
        logoutRequest = authAPI.logout(token);
      } catch {
        // Clear the local session even if the request cannot be started.
      }
    }

    setUser(null);
    setStartup(null);
    setIsApiSession(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);

    if (logoutRequest) {
      try {
        await logoutRequest;
      } catch {
        // Logout is complete on this device even if the server is unavailable.
      }
    }
  }, []);

  const loginAsRole = useCallback(async (role) => {
    const found = mockUsers.find((mockUser) => mockUser.role === role);
    if (!found) throw new Error('This demo account is unavailable.');

    const demoUser = { ...found };
    delete demoUser.password;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: demoUser, source: 'demo' }));
    setUser(demoUser);
    setIsApiSession(false);
    setStartup(cachedDemoStartup(demoUser));
    return demoUser;
  }, []);

  const value = {
    user,
    startup,
    isApiSession,
    loading,
    startupLoading,
    startupError,
    refreshStartupProfile,
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
