// OneDesk — LocalStorage Persistence
// Handles safe read/write with fallback to seed data and user authentication

import type { Case, OverlapCandidate, User } from '../types';
import { SAMPLE_CASES, SEED_OVERLAPS, DEFAULT_USERS } from '../data/sampleData';

const CASES_KEY = 'onedesk_cases_v2';
const OVERLAPS_KEY = 'onedesk_overlaps_v2';
const USER_KEY = 'onedesk_auth_user_v2';

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[OneDesk] Failed to parse localStorage key "${key}". Using fallback.`);
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[OneDesk] Failed to write to localStorage key "${key}".`, e);
  }
}

export function loadCases(): Case[] {
  return safeRead<Case[]>(CASES_KEY, SAMPLE_CASES);
}

export function saveCases(cases: Case[]): void {
  safeWrite(CASES_KEY, cases);
}

export function loadOverlaps(): OverlapCandidate[] {
  return safeRead<OverlapCandidate[]>(OVERLAPS_KEY, SEED_OVERLAPS);
}

export function saveOverlaps(overlaps: OverlapCandidate[]): void {
  safeWrite(OVERLAPS_KEY, overlaps);
}

export function loadSavedUser(): User | null {
  return safeRead<User | null>(USER_KEY, DEFAULT_USERS[0]); // default logged in as Admin for demo ease, or can log out
}

export function saveAuthUser(user: User | null): void {
  if (user) {
    safeWrite(USER_KEY, user);
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function resetToSeedData(): { cases: Case[]; overlaps: OverlapCandidate[] } {
  safeWrite(CASES_KEY, SAMPLE_CASES);
  safeWrite(OVERLAPS_KEY, SEED_OVERLAPS);
  return { cases: SAMPLE_CASES, overlaps: SEED_OVERLAPS };
}
