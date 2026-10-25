import { ApiError, apiRequest } from '../../lib/api';

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

type AuthResponse = {
  user: User;
};

export function register(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  try {
    const response = await apiRequest<AuthResponse>('/auth/me');
    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
