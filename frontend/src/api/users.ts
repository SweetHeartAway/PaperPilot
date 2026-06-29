import client from './client';
import type { User } from '../types/user';

export function fetchProfile(): Promise<User> {
  return client.get('/api/v1/users/me').then((res) => res.data);
}

export function updateProfile(data: Partial<{ username: string; email: string }>): Promise<User> {
  return client.put('/api/v1/users/me', data).then((res) => res.data);
}
