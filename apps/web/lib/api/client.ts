const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

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

          const newHeaders = new Headers(options.headers || {});
          newHeaders.set("Content-Type", "application/json");
          newHeaders.set("Authorization", `Bearer ${newAccess}`);

          res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: newHeaders,
          });
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (err) {}
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

export async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!options.body || typeof options.body === 'string') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return apiFetch<T>(path, { ...options, headers });
}
