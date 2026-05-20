import { createContext, useContext, useState, useEffect } from 'react';
import { fetchLibrary, loginUser, registerUser } from '../data/api';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(localStorage.getItem('access') || null);
  const [refresh, setRefresh] = useState(localStorage.getItem('refresh') || null);
  const [loading, setLoading] = useState(true);
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  useEffect(() => {
    if (access) {
      setUser(JSON.parse(localStorage.getItem('user')));
    }
    setLoading(false);
  }, [access]);

  // Fetch library when user logs in
  useEffect(() => {
    if (user) {
      refreshLibrary();
    } else {
      setLibrary([]);
    }
  }, [user]);

  const refreshLibrary = async () => {
    setLibraryLoading(true);
    try {
      const lib = await fetchLibrary();
      setLibrary(lib);
    } catch (err) {
      setLibrary([]);
    }
    setLibraryLoading(false);
  };

  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password);
      setAccess(data.access);
      setRefresh(data.refresh);
      setUser(data.user);
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      let error = err.response?.data || 'Login failed';
      if (typeof error === 'object' && error.detail) error = error.detail;
      return { success: false, error };
    }
  };

  const register = async (data) => {
    try {
      const responseData = await registerUser(data);
      setAccess(responseData.access);
      setRefresh(responseData.refresh);
      setUser(responseData.user);
      localStorage.setItem('access', responseData.access);
      localStorage.setItem('refresh', responseData.refresh);
      localStorage.setItem('user', JSON.stringify(responseData.user));
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
    setLibrary([]);
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
    library,
    libraryLoading,
    refreshLibrary,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}; 
