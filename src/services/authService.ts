// Hesap servisi: online modda Supabase Auth + profiles, değilse localStorage mock.
// Oyun kullanıcıdan e-posta istemez; kullanıcı adı sentetik e-postaya çevrilir.
import type { User } from '../types';
import { uid } from '../utils/random';
import { load, save, remove } from './storage';
import { isOnline, supabase, usernameToEmail } from './supabaseClient';

const USER_KEY = 'user';

interface ProfileRow {
  id: string;
  username: string;
  total_points: number;
  best_streak: number;
  classic_wins: number;
  classic_losses: number;
  created_at: string;
}

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    totalPoints: row.total_points,
    bestStreak: row.best_streak,
    classicWins: row.classic_wins,
    classicLosses: row.classic_losses,
    createdAt: Date.parse(row.created_at) || Date.now(),
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase().from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}

export async function getCurrentUser(): Promise<User | null> {
  if (isOnline) {
    try {
      const { data } = await supabase().auth.getSession();
      if (!data.session) return null;
      return await fetchProfile(data.session.user.id);
    } catch {
      return null;
    }
  }
  return load<User>(USER_KEY);
}

/** Giriş: online modda şifre zorunlu; mock modda kullanıcı adı yeterli */
export async function login(username: string, password?: string): Promise<User> {
  if (isOnline) {
    if (!password) throw new Error('Şifre gerekli.');
    const { data, error } = await supabase().auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error || !data.user) throw new Error('Giriş başarısız — kullanıcı adı veya şifre hatalı.');
    const profile = await fetchProfile(data.user.id);
    if (!profile) throw new Error('Profil bulunamadı. (Kurulum: supabase/schema.sql çalıştırıldı mı?)');
    return profile;
  }

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

/** Kayıt: online modda yeni hesap açar; mock modda login ile aynıdır */
export async function register(username: string, password: string): Promise<User> {
  if (!isOnline) return login(username);
  const clean = username.trim();
  if (clean.length < 2) throw new Error('Kullanıcı adı en az 2 karakter olmalı.');
  if (password.length < 6) throw new Error('Şifre en az 6 karakter olmalı.');
  const { data, error } = await supabase().auth.signUp({
    email: usernameToEmail(clean),
    password,
    options: { data: { username: clean } },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('duplicate') || msg.includes('unique')) {
      throw new Error('Bu kullanıcı adı alınmış — başka bir isim dene.');
    }
    throw new Error(`Kayıt başarısız: ${error.message}`);
  }
  if (!data.user) throw new Error('Kayıt tamamlanamadı.');
  if (!data.session) {
    throw new Error('Hesap açıldı ama oturum başlamadı. (Supabase’te "Confirm email" kapalı olmalı — DEPLOY.md)');
  }
  const profile = await fetchProfile(data.user.id);
  if (!profile) throw new Error('Profil oluşturulamadı. (Kurulum: supabase/schema.sql çalıştırıldı mı?)');
  return profile;
}

export async function logout(): Promise<void> {
  if (isOnline) {
    try {
      await supabase().auth.signOut();
    } catch {
      // oturum zaten kapalıysa sorun değil
    }
    return;
  }
  await remove(USER_KEY);
}

/** Online modda statlar sunucuda (apply_match_outcome RPC) tutulur — burada no-op */
export async function updateUser(user: User): Promise<void> {
  if (isOnline) return;
  await save(USER_KEY, user);
}
