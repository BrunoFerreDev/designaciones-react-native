import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { BASE_URL } from '../constants/api';

const TOKEN_KEY = 'jwt_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyecta el JWT en cada request automáticamente
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expira (401), limpia sesion
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await removeToken();
      await removeUser();
    }
    return Promise.reject(error);
  }
);

import { Platform } from 'react-native';

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(TOKEN_KEY);
    return null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

const USER_KEY = 'auth_user';

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: any): Promise<void> {
  const serialized = JSON.stringify(user);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(USER_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, serialized);
}

export async function getUser(): Promise<any | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(USER_KEY);
      return val ? JSON.parse(val) : null;
    }
    return null;
  }
  const val = await SecureStore.getItemAsync(USER_KEY);
  return val ? JSON.parse(val) : null;
}

export async function removeUser(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(USER_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(USER_KEY);
}
