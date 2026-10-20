import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { apiFetch, imageFile } from "../config/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

// Holds the logged in user. Token and user are saved in SecureStore,
// so the user stays logged in after closing the app.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // true while the saved login is read on app start
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // Nothing saved or not readable – the user just has to log in again.
      } finally {
        setRestoring(false);
      }
    };

    restore();
  }, []);

  // The API answers /login and /register with { token, user }
  const saveSession = async (session) => {
    await SecureStore.setItemAsync(TOKEN_KEY, session.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  };

  const login = async (email, password) => {
    await saveSession(await apiFetch("/login", { body: { email, password } }));
  };

  const register = async (username, email, password) => {
    await saveSession(await apiFetch("/register", { body: { username, email, password } }));
  };

  // asset: picked image from expo-image-picker. The API answers with the updated user.
  const uploadAvatar = async (asset) => {
    const form = new FormData();
    form.append("image", imageFile(asset));

    const updatedUser = await apiFetch("/me/avatar", { token, body: form, method: "PUT" });
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ token, user, restoring, login, register, uploadAvatar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
