import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/storage/auth.js';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const store = useAuthStore();
    expect(store.accessToken).toBe('');
    expect(store.isRegistered).toBe(false);
    expect(store.isInitialising).toBe(false);
  });

  it('sets access token', () => {
    const store = useAuthStore();
    store.setAccessToken('test-token-123');
    expect(store.accessToken).toBe('test-token-123');
  });

  it('persists token to localStorage', () => {
    const store = useAuthStore();
    store.setAccessToken('test-token-123');
    expect(localStorage.getItem('webex-access-token')).toBe('test-token-123');
    expect(localStorage.getItem('webex-token-date')).toBeTruthy();
  });

  it('loads stored token', () => {
    localStorage.setItem('webex-access-token', 'stored-token');
    localStorage.setItem('webex-token-date', String(Date.now() + 10000));

    const store = useAuthStore();
    const loaded = store.loadStoredToken();

    expect(loaded).toBe(true);
    expect(store.accessToken).toBe('stored-token');
  });

  it('rejects expired token', () => {
    localStorage.setItem('webex-access-token', 'expired-token');
    localStorage.setItem('webex-token-date', String(Date.now() - 1000));

    const store = useAuthStore();
    const loaded = store.loadStoredToken();

    expect(loaded).toBe(false);
    expect(store.accessToken).toBe('');
  });

  it('clears auth data', () => {
    const store = useAuthStore();
    store.setAccessToken('test-token');
    store.setRegistered(true);

    store.clearAuth();

    expect(store.accessToken).toBe('');
    expect(store.isRegistered).toBe(false);
    expect(localStorage.getItem('webex-access-token')).toBeNull();
  });
});
