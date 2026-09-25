import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  apiClient,
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  removeUser,
} from "../services/apiClient";
import { AuthUser, LoginRequest, AuthResponse, RolUsuario } from "../types";
import { ENDPOINTS } from "../constants/api";

interface AuthContextValue {
  arbitro: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [arbitro, setArbitro] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión al arrancar
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setArbitro(storedUser);
        }
      } catch (e) {
        console.warn("Error restaurando sesion:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(credentials: LoginRequest): Promise<void> {
    const { data } = await apiClient.post<AuthResponse>(
      ENDPOINTS.LOGIN,
      credentials,
    );

    const jwtToken = data.jwt;
    if (!jwtToken) {
      throw new Error(data.message || "No se recibio token JWT");
    }

    const rolesArray: RolUsuario[] = Array.isArray(data.roles)
      ? (data.roles as RolUsuario[])
      : [];

    const userObj: AuthUser = {
      idArbitro: data.idArbitro,
      nombreCompleto: data.nombreCompleto,
      nombre: data.nombreCompleto
        ? data.nombreCompleto.split(" ")[0]
        : data.username,
      apellido: data.nombreCompleto
        ? data.nombreCompleto.split(" ").slice(1).join(" ")
        : "",
      roles: rolesArray,
      username: data.username,
    };

    await saveToken(jwtToken);
    await saveUser(userObj);
    setToken(jwtToken);
    setArbitro(userObj);
  }

  async function logout(): Promise<void> {
    await removeToken();
    await removeUser();
    setToken(null);
    setArbitro(null);
  }

  return (
    <AuthContext.Provider value={{ arbitro, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
