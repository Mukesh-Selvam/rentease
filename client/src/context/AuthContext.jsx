/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('rentease_token');
    if (token) {
      authService.getCurrentUser()
        .then((user) => { if (isMounted) setCurrentUser(user); })
        .catch(() => {
          localStorage.removeItem('rentease_token');
          if (isMounted) setCurrentUser(null);
        })
        .finally(() => { if (isMounted) setLoading(false); });
    } else {
      // Async tick to avoid synchronous setState warning
      Promise.resolve().then(() => { if (isMounted) setLoading(false); });
    }
    return () => { isMounted = false; };
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (!res?.user) {
      throw new Error('The server did not return an authenticated user. Please try again.');
    }
    setCurrentUser(res.user);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    if (!res?.user) {
      throw new Error('The server did not return a new user. Please try again.');
    }
    setCurrentUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const updateProfile = async (data) => {
    const res = await authService.updateProfile(data);
    setCurrentUser(res.user);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        login,
        register,
        logout,
        updateProfile
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

export default AuthContext;
