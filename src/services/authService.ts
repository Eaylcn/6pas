import type { User } from '../types';
import { uid } from '../utils/random';
import { load, save } from './storage';

const USER_KEY = 'user';

export async function getCurrentUser(): Promise<User | null> {
  return load<User>(USER_KEY);
}

/** Mock login: kullanıcı adıyla profil oluşturur veya mevcut profili günceller */
export async function login(username: string): Promise<User> {
  const existing = await load<User>(USER_KEY);
  if (existing) {
    const updated = { ...existing, username };
    await save(USER_KEY, updated);
    return updated;
  }
  const user: User = {
    id: uid('user'),
    username,
    totalPoints: 0,
    bestStreak: 0,
    classicWins: 0,
    classicLosses: 0,
    createdAt: Date.now(),
  };
  await save(USER_KEY, user);
  return user;
}

export async function updateUser(user: User): Promise<void> {
  await save(USER_KEY, user);
}
