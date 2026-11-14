import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

function getTokenExpiry(token) {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [startup, setStartup] = useState(null);
  const [isApiSession, setIsApiSession] = useState(false);
  const [startupLoading, setStartupLoading] = useState(false);
  const [startupError, setStartupError] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiSessionToken, setApiSessionToken] = useState(null);
  const authRevisionRef = useRef(0);

  useEffect(() => {
    let active = true;
    const handleExpiredSession = () => {
      authRevisionRef.current += 1;
      setUser(null);
      setStartup(null);
      setIsApiSession(false);
      setApiSessionToken(null);
      setStartupError('');
      setLoading(false);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    };
    window.addEventListener('ayush:auth-expired', handleExpiredSession);

    const restoreSession = async () => {
      const revision = authRevisionRef.current;
      const isCurrentRestore = () => active && revision === authRevisionRef.current;
      const stored = getStoredSession();
      const token = localStorage.getItem(TOKEN_KEY);

      if (token) {
        try {
          const apiUser = normalizeApiUser(readResponseData(await authAPI.getProfile()));
          if (isCurrentRestore()) {
            setUser(apiUser);
            setStartupLoading(true);
            setIsApiSession(true);
            setApiSessionToken(token);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: apiUser, source: 'api' }));
          }
        } catch (error) {
          if (!isCurrentRestore()) return;
          if (error?.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(STORAGE_KEY);
            if (isCurrentRestore()) {
              setUser(null);
              setStartup(null);
              setIsApiSession(false);
              setApiSessionToken(null);
            }
          } else if (stored?.source === 'api' && stored.user) {
            // Keep the cached UI session during a temporary network/server outage.
            try {
              const cachedUser = normalizeApiUser(stored.user);
              if (isCurrentRestore()) {
                setUser(cachedUser);
                setStartupLoading(true);
                setIsApiSession(true);
                setApiSessionToken(token);
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
        if (isCurrentRestore()) {
          setUser(stored.user);
          setIsApiSession(false);
          setApiSessionToken(null);
          setStartup(cachedDemoStartup(stored.user));
        }
      } else if (stored?.source === 'api') {
        // An API user cache is not a login session without its bearer token.
        localStorage.removeItem(STORAGE_KEY);
      }

      if (isCurrentRestore()) setLoading(false);
    };

    restoreSession();
    return () => {
      active = false;
      window.removeEventListener('ayush:auth-expired', handleExpiredSession);
    };
  }, []);

  useEffect(() => {
    if (!isApiSession || !apiSessionToken) return undefined;

    const expiresAt = getTokenExpiry(apiSessionToken);
    if (!expiresAt) {
      window.dispatchEvent(new Event('ayush:auth-expired'));
      return undefined;
    }

    let timerId;
    const checkExpiry = () => {
      if (localStorage.getItem(TOKEN_KEY) !== apiSessionToken) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        window.dispatchEvent(new Event('ayush:auth-expired'));
        return;
      }
      // Browser timers have a maximum delay of roughly 24.8 days.
      timerId = window.setTimeout(checkExpiry, Math.min(remaining, 2_147_000_000));
    };

    checkExpiry();
    return () => window.clearTimeout(timerId);
  }, [apiSessionToken, isApiSession]);

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
      authRevisionRef.current += 1;
      setUser(authenticatedUser);
      setLoading(false);
      setStartupLoading(true);
      setIsApiSession(true);
      setApiSessionToken(payload.token);
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
      authRevisionRef.current += 1;
      setUser(authenticatedUser);
      setLoading(false);
      setStartupLoading(true);
      setIsApiSession(true);
      setApiSessionToken(payload.token);
      setStartup(null);
      return authenticatedUser;
    } catch (error) {
      throw authError(error, 'Registration failed. Please try again.');
    }
  }, []);

  const logout = useCallback(async () => {
    authRevisionRef.current += 1;
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
    setApiSessionToken(null);
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
    authRevisionRef.current += 1;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: demoUser, source: 'demo' }));
    setUser(demoUser);
    setLoading(false);
    setIsApiSession(false);
    setApiSessionToken(null);
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
