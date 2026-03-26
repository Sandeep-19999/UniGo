// import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// import { api } from '../api/axios';

// const AuthContext = createContext(null);
// const TOKEN_KEY = 'unigo_token';

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [driverOnboarding, setDriverOnboarding] = useState(null);
//   const [driverOnboardingLoading, setDriverOnboardingLoading] = useState(false);
//   const inFlight = useRef(null);

//   const clearAuthState = useCallback(() => {
//     setUser(null);
//     setDriverOnboarding(null);
//     setDriverOnboardingLoading(false);
//   }, []);

//   const logout = useCallback(() => {
//     localStorage.removeItem(TOKEN_KEY);
//     clearAuthState();
//     setLoading(false);
//   }, [clearAuthState]);

//   const refreshDriverOnboarding = useCallback(async () => {
//     const token = localStorage.getItem(TOKEN_KEY);
//     if (!token) {
//       setDriverOnboarding(null);
//       return null;
//     }

//     setDriverOnboardingLoading(true);
//     try {
//       const { data } = await api.get('/driver/onboarding/status');
//       const onboarding = data?.onboarding || null;
//       setDriverOnboarding(onboarding);
//       return onboarding;
//     } catch {
//       setDriverOnboarding(null);
//       return null;
//     } finally {
//       setDriverOnboardingLoading(false);
//     }
//   }, []);

//   const syncDriverState = useCallback(
//     async (nextUser) => {
//       if (nextUser?.role === 'driver') {
//         return refreshDriverOnboarding();
//       }

//       setDriverOnboarding(null);
//       setDriverOnboardingLoading(false);
//       return null;
//     },
//     [refreshDriverOnboarding]
//   );

//   const refreshMe = useCallback(async () => {
//     const token = localStorage.getItem(TOKEN_KEY);
//     if (!token) {
//       clearAuthState();
//       setLoading(false);
//       return null;
//     }

//     if (inFlight.current) return inFlight.current;

//     inFlight.current = (async () => {
//       try {
//         const { data } = await api.get('/auth/me');
//         const nextUser = data.user;
//         setUser(nextUser);
//         await syncDriverState(nextUser);
//         return nextUser;
//       } catch {
//         logout();
//         return null;
//       } finally {
//         setLoading(false);
//         inFlight.current = null;
//       }
//     })();

//     return inFlight.current;
//   }, [clearAuthState, logout, syncDriverState]);

//   useEffect(() => {
//     refreshMe();
//   }, [refreshMe]);

//   const login = useCallback(
//     async (email, password) => {
//       const { data } = await api.post('/auth/login', { email, password });
//       localStorage.setItem(TOKEN_KEY, data.token);
//       setUser(data.user);
//       const onboarding = await syncDriverState(data.user);
//       setLoading(false);
//       return { user: data.user, onboarding };
//     },
//     [syncDriverState]
//   );

//   const register = useCallback(
//     async (name, email, password, role, adminInviteCode) => {
//       const { data } = await api.post('/auth/register', { name, email, password, role, adminInviteCode });
//       localStorage.setItem(TOKEN_KEY, data.token);
//       setUser(data.user);
//       const onboarding = await syncDriverState(data.user);
//       setLoading(false);
//       return { user: data.user, onboarding };
//     },
//     [syncDriverState]
//   );

//   const value = useMemo(
//     () => ({
//       user,
//       loading,
//       driverOnboarding,
//       driverOnboardingLoading,
//       login,
//       register,
//       logout,
//       refreshMe,
//       refreshDriverOnboarding,
//       setDriverOnboarding
//     }),
//     [
//       user,
//       loading,
//       driverOnboarding,
//       driverOnboardingLoading,
//       login,
//       register,
//       logout,
//       refreshMe,
//       refreshDriverOnboarding
//     ]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }




import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { api } from '../api/axios';

const AuthContext = createContext(null);
const TOKEN_KEY = 'unigo_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverOnboarding, setDriverOnboarding] = useState(null);
  const [driverOnboardingLoading, setDriverOnboardingLoading] = useState(false);
  const inFlight = useRef(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setDriverOnboarding(null);
    setDriverOnboardingLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    clearAuthState();
    setLoading(false);
  }, [clearAuthState]);

  const refreshDriverOnboarding = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setDriverOnboarding(null);
      return null;
    }

    if (!silent) {
      setDriverOnboardingLoading(true);
    }

    try {
      const { data } = await api.get('/driver/onboarding/status');
      const onboarding = data?.onboarding || null;
      setDriverOnboarding(onboarding);
      return onboarding;
    } catch {
      setDriverOnboarding(null);
      return null;
    } finally {
      if (!silent) {
        setDriverOnboardingLoading(false);
      }
    }
  }, []);

  const syncDriverState = useCallback(
    async (nextUser) => {
      if (nextUser?.role === 'driver') {
        return refreshDriverOnboarding();
      }

      setDriverOnboarding(null);
      setDriverOnboardingLoading(false);
      return null;
    },
    [refreshDriverOnboarding]
  );

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clearAuthState();
      setLoading(false);
      return null;
    }

    if (inFlight.current) return inFlight.current;

    inFlight.current = (async () => {
      try {
        const { data } = await api.get('/auth/me');
        const nextUser = data.user;
        setUser(nextUser);
        await syncDriverState(nextUser);
        return nextUser;
      } catch {
        logout();
        return null;
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();

    return inFlight.current;
  }, [clearAuthState, logout, syncDriverState]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (user?.role !== 'driver') return undefined;

    function handleFocus() {
      refreshDriverOnboarding({ silent: true });
    }

    const intervalId = setInterval(() => {
      refreshDriverOnboarding({ silent: true });
    }, 15000);

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.role, refreshDriverOnboarding]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      const onboarding = await syncDriverState(data.user);
      setLoading(false);
      return { user: data.user, onboarding };
    },
    [syncDriverState]
  );

  const register = useCallback(
    async (name, email, password, role, adminInviteCode) => {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        adminInviteCode
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      const onboarding = await syncDriverState(data.user);
      setLoading(false);
      return { user: data.user, onboarding };
    },
    [syncDriverState]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      driverOnboarding,
      driverOnboardingLoading,
      login,
      register,
      logout,
      refreshMe,
      refreshDriverOnboarding,
      setDriverOnboarding
    }),
    [
      user,
      loading,
      driverOnboarding,
      driverOnboardingLoading,
      login,
      register,
      logout,
      refreshMe,
      refreshDriverOnboarding
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}