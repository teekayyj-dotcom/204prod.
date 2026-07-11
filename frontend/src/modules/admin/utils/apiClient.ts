export const API_BASE_URL = '/api/v1';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    ...options.headers,
  } as Record<string, string>;

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // Prevent browser caching for GET requests by default unless explicitly set
  if (!fetchOptions.method || fetchOptions.method.toUpperCase() === 'GET') {
    if (!fetchOptions.cache) {
      fetchOptions.cache = 'no-store';
    }
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        
        // Use dynamic import to avoid circular dependencies and sign out of Firebase
        import('../../../shared/config/firebase').then(({ auth }) => {
          import('firebase/auth').then(({ signOut }) => {
            signOut(auth).catch(() => {});
          });
        });
        
        window.location.href = '/login';
      }
    }

    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || '';
    } catch {
      errorDetail = await response.text().catch(() => '');
    }
    throw new Error(errorDetail || `API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}
