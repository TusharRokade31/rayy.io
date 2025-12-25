import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authService} from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const {token: newToken, user: newUser} = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return {success: true};
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      return {success: false, error: message};
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      const {token: newToken, user: newUser} = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return {success: true};
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      return {success: false, error: message};
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedUser) => {
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
