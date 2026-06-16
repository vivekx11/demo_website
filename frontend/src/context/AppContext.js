"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

const BACKEND_URL = 'http://localhost:5000';

export function AppProvider({ children }) {
  const [lang, setLang] = useState('hi'); // Default: Hindi
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [deviceId, setDeviceId] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [deviceWarning, setDeviceWarning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize client settings
  useEffect(() => {
    // 1. Language settings
    const savedLang = localStorage.getItem('sumity_lang');
    if (savedLang) setLang(savedLang);

    // 2. Dark Mode settings
    const savedDark = localStorage.getItem('sumity_dark_mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedDark === 'true' || (!savedDark && prefersDark);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Unique Device ID (client fingerprint simulation)
    let savedDeviceId = localStorage.getItem('sumity_device_id');
    if (!savedDeviceId) {
      savedDeviceId = 'dev-' + uuidv4().substring(0, 12);
      localStorage.setItem('sumity_device_id', savedDeviceId);
    }
    setDeviceId(savedDeviceId);

    // 4. User session recovery
    const savedToken = localStorage.getItem('sumity_token');
    const savedUser = localStorage.getItem('sumity_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    // 5. Wishlist loading
    const savedWish = localStorage.getItem('sumity_wishlist');
    if (savedWish) setWishlist(JSON.parse(savedWish));

    setLoading(false);
  }, []);

  // Save updates
  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('sumity_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'hi' ? 'en' : 'hi';
    setLang(nextLang);
    localStorage.setItem('sumity_lang', nextLang);
  };

  const loginUser = (userToken, userData, warning) => {
    setToken(userToken);
    setUser(userData);
    setDeviceWarning(warning);
    localStorage.setItem('sumity_token', userToken);
    localStorage.setItem('sumity_user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    setDeviceWarning(null);
    localStorage.removeItem('sumity_token');
    localStorage.removeItem('sumity_user');
  };

  const toggleWishlist = (productId) => {
    let updated;
    if (wishlist.includes(productId)) {
      updated = wishlist.filter(id => id !== productId);
    } else {
      updated = [...wishlist, productId];
    }
    setWishlist(updated);
    localStorage.setItem('sumity_wishlist', JSON.stringify(updated));
    return updated.includes(productId);
  };

  // Helper fetch request client pre-configured with headers (JWT, Device ID)
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return res;
  };

  return (
    <AppContext.Provider value={{
      lang,
      toggleLanguage,
      user,
      token,
      deviceId,
      wishlist,
      deviceWarning,
      setDeviceWarning,
      loginUser,
      logoutUser,
      toggleWishlist,
      apiFetch,
      loading,
      BACKEND_URL,
      darkMode,
      toggleDarkMode
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
