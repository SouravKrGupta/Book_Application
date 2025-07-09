import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

const API_BASE = 'http://localhost:8000/api';

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(localStorage.getItem('access') || null);
  const [refresh, setRefresh] = useState(localStorage.getItem('refresh') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (access) {
      setUser(JSON.parse(localStorage.getItem('user')));
    }
    setLoading(false);
  }, [access]);

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_BASE}/login/`, { username, password });
      setAccess(res.data.access);
      setRefresh(res.data.refresh);
      setUser(res.data.user);
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true };
    } catch (err) {
      let error = err.response?.data || 'Login failed';
      if (typeof error === 'object' && error.detail) error = error.detail;
      return { success: false, error };
    }
  };

  const register = async (data) => {
    try {
      const res = await axios.post(`${API_BASE}/register/`, data);
      setAccess(res.data.access);
      setRefresh(res.data.refresh);
      setUser(res.data.user);
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true };
    } catch (err) {
      let error = err.response?.data || 'Registration failed';
      return { success: false, error };
    }
  };

  const logout = () => {
    setUser(null);
    setAccess(null);
    setRefresh(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    access,
    refresh,
    loading,
    login,
    register,
    logout,
    setUser,
    setAccess,
    setRefresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}; 