// Fallback seguro para desarrollo
//Revisar más adelante esto
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Tipos de respuesta
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// Helper interno
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // Intentar refrescar el token si da 401 (Unauthorized)
  if (res.status === 401 && typeof window !== 'undefined' && path !== '/auth/refresh') {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const { accessToken: newAccess, refreshToken: newRefresh } = await refreshRes.json();
          localStorage.setItem("accessToken", newAccess);
          localStorage.setItem("refreshToken", newRefresh);

          // Reintentar la petición original con el nuevo token
          const newHeaders = new Headers(options.headers || {});
          newHeaders.set("Content-Type", "application/json");
          newHeaders.set("Authorization", `Bearer ${newAccess}`);

          res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: newHeaders,
          });
        } else {
          // Si el refresh falla, limpiamos la sesión
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (err) {
        // Ignoramos el error del refresh y dejamos que la petición original lance su error 401
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const rawMessage = body.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : rawMessage ?? "Error desconocido";
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

// Register
export interface RegisterPayload {
  fullName: string;
  nationalId: string;
  email: string;
  password: string;
  username?: string;
}

export function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Login
export interface LoginPayload {
  email: string;
  password: string;
}

export function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

//esto es para sacar la info de quien esta logueado
export function getMe(accessToken: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}