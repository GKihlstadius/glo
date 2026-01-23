// Session Registry for Together Mode
// Stores active sessions in AsyncStorage so other devices can join
// Note: In production, this would be a real-time backend (Firebase, Supabase, etc.)
// For now, sessions are stored locally and joining is simulated

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from './types';

const SESSION_PREFIX = 'glo_session_';
const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface SessionRegistryEntry {
  session: Session;
  createdAt: number;
}

// Save session to registry (called when host creates a session)
export async function registerSession(session: Session): Promise<void> {
  if (!session.code) return;

  const entry: SessionRegistryEntry = {
    session,
    createdAt: Date.now(),
  };

  await AsyncStorage.setItem(
    `${SESSION_PREFIX}${session.code}`,
    JSON.stringify(entry)
  );
}

// Update session in registry
export async function updateSessionInRegistry(session: Session): Promise<void> {
  if (!session.code) return;

  const existing = await getSessionByCode(session.code);
  if (existing) {
    await registerSession(session);
  }
}

// Get session by code
export async function getSessionByCode(code: string): Promise<Session | null> {
  try {
    const data = await AsyncStorage.getItem(`${SESSION_PREFIX}${code}`);
    if (!data) return null;

    const entry: SessionRegistryEntry = JSON.parse(data);

    // Check if expired
    if (Date.now() > entry.session.expiresAt) {
      await AsyncStorage.removeItem(`${SESSION_PREFIX}${code}`);
      return null;
    }

    return entry.session;
  } catch {
    return null;
  }
}

// Validate if session can be joined
export interface JoinValidationResult {
  valid: boolean;
  error?: 'not_found' | 'expired' | 'already_started' | 'full';
  session?: Session;
}

export async function validateJoinCode(code: string): Promise<JoinValidationResult> {
  const session = await getSessionByCode(code);

  if (!session) {
    return { valid: false, error: 'not_found' };
  }

  if (Date.now() > session.expiresAt) {
    return { valid: false, error: 'expired' };
  }

  if (session.status !== 'waiting') {
    return { valid: false, error: 'already_started' };
  }

  // Together mode is 2 players
  if (session.participants.length >= 2) {
    return { valid: false, error: 'full' };
  }

  return { valid: true, session };
}

// Join session (add participant)
export async function joinSession(
  code: string,
  deviceId: string
): Promise<{ success: boolean; session?: Session; error?: string }> {
  const validation = await validateJoinCode(code);

  if (!validation.valid || !validation.session) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Check if already a participant
  if (validation.session.participants.includes(deviceId)) {
    // Already joined, just return the session
    return { success: true, session: validation.session };
  }

  // Add participant
  const updatedSession: Session = {
    ...validation.session,
    participants: [...validation.session.participants, deviceId],
  };

  // Save updated session
  await registerSession(updatedSession);

  return { success: true, session: updatedSession };
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sessionKeys = keys.filter(k => k.startsWith(SESSION_PREFIX));

    for (const key of sessionKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const entry: SessionRegistryEntry = JSON.parse(data);
        if (Date.now() > entry.session.expiresAt) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch {
    // Silently fail cleanup
  }
}
