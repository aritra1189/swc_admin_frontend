// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage if available
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    return storedUser ? { ...JSON.parse(storedUser), token: storedToken } : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Set axios base URL and headers
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL|| 'http://localhost:6524/api/v1';
    
    if (user?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // Clear error when location changes
  useEffect(() => {
    setError(null);
  }, [location.pathname]);

  const login = async (loginId, password) => {
    setLoading(true);
    setError(null);
   
    try {
      const params = new URLSearchParams();
      params.append('loginId', loginId);
      params.append('password', password);

      const response = await axios.post('/auth/admin/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { token, user: userData } = response.data;
      
      // Store user data and token
      const authUser = { ...userData, token };
      setUser(authUser);
      localStorage.setItem('user', JSON.stringify(authUser));
      localStorage.setItem('token', token);

      // Redirect to intended path or home
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response) {
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      errorMessage;
      } else if (err.request) {
        errorMessage = 'No response from server. Please try again.';
      }

      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  const logout = (options = {}) => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    if (options.showSuccess) {
      navigate('/login?logout=true', { state: { from: location } });
    } else {
      navigate('/login');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user?.token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}