import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { apiClient } from '../services/apiClient';
import { scaleFont } from '../utils/responsive';

interface LoadingContextType {
  isLoading: boolean;
  isBlocking: boolean;
  message: string;
  startLoading: (msg?: string, blocking?: boolean) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  isBlocking: false,
  message: '',
  startLoading: () => {},
  stopLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

interface Props {
  children: ReactNode;
}

export function LoadingProvider({ children }: Props) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [blockingCount, setBlockingCount] = useState(0);
  const [message, setMessage] = useState('Procesando...');

  const countRef = useRef(0);
  const blockingRef = useRef(0);

  const startLoading = (msg: string = 'Procesando...', blocking: boolean = true) => {
    countRef.current += 1;
    if (blocking) {
      blockingRef.current += 1;
    }
    setMessage(msg);
    setLoadingCount(countRef.current);
    setBlockingCount(blockingRef.current);
  };

  const stopLoading = () => {
    countRef.current = Math.max(0, countRef.current - 1);
    blockingRef.current = Math.max(0, blockingRef.current - 1);
    setLoadingCount(countRef.current);
    setBlockingCount(blockingRef.current);
  };

  useEffect(() => {
    // Interceptor de Request: detecta el tipo de método HTTP
    const reqInterceptor = apiClient.interceptors.request.use((config) => {
      if ((config.headers as any)?.['x-skip-loader']) {
        return config;
      }

      const method = config.method?.toUpperCase();
      let msg = 'Cargando datos...';
      let blocking = false;

      if (method === 'POST') {
        msg = 'Guardando información...';
        blocking = true;
      } else if (method === 'PUT') {
        msg = 'Actualizando cambios...';
        blocking = true;
      } else if (method === 'DELETE') {
        msg = 'Eliminando registro...';
        blocking = true;
      } else if (method === 'GET') {
        msg = 'Cargando...';
        blocking = false;
      }

      startLoading(msg, blocking);
      return config;
    });

    // Interceptor de Response (éxito o error)
    const resInterceptor = apiClient.interceptors.response.use(
      (response) => {
        if (!(response.config.headers as any)?.['x-skip-loader']) {
          stopLoading();
        }
        return response;
      },
      (error) => {
        if (!(error?.config?.headers as any)?.['x-skip-loader']) {
          stopLoading();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(reqInterceptor);
      apiClient.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const isLoading = loadingCount > 0;
  const isBlocking = blockingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, isBlocking, message, startLoading, stopLoading }}>
      {children}

      {/* 1. Modal bloqueante para operaciones de mutación (POST, PUT, DELETE) */}
      {isBlocking && (
        <Modal transparent animationType="fade" visible={isBlocking} statusBarTranslucent>
          <View style={styles.overlay}>
            <View style={styles.card}>
              <ActivityIndicator size="large" color="#1a1a2e" style={{ marginBottom: 12 }} />
              <Text style={styles.text}>{message}</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* 2. Badge discreto superior cuando se resuelven peticiones GET de fondo */}
      {isLoading && !isBlocking && (
        <View style={styles.topBadge} pointerEvents="none">
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.topBadgeText}>{message}</Text>
        </View>
      )}
    </LoadingContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleFont(20),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: scaleFont(22),
    paddingHorizontal: scaleFont(28),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scaleFont(180),
    maxWidth: scaleFont(300),
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  text: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  topBadge: {
    position: 'absolute',
    top: scaleFont(46),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    paddingVertical: scaleFont(6),
    paddingHorizontal: scaleFont(14),
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 9999,
  },
  topBadgeText: {
    color: '#ffffff',
    fontSize: scaleFont(11),
    fontWeight: '700',
  },
});
