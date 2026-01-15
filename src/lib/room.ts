import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Room configuration
const APP_URL_BASE = 'https://glo.app';
const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

// Generate secure room ID (non-guessable)
export function generateRoomId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Generate 6-character display code (human readable)
export function generateDisplayCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate signed token (simplified HMAC-like)
// In production, this would use proper JWT signing
export function generateToken(roomId: string, expiresAt: number): string {
  // Simple token format: base64(roomId:expiresAt:signature)
  const payload = `${roomId}:${expiresAt}`;
  // In production: HMAC signature with server secret
  const signature = btoa(payload).slice(0, 8);
  return btoa(`${payload}:${signature}`);
}

// Validate token
export function validateToken(token: string): { roomId: string; expiresAt: number; valid: boolean } {
  try {
    const decoded = atob(token);
    const [roomId, expiresAtStr, signature] = decoded.split(':');
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check expiry
    if (Date.now() > expiresAt) {
      return { roomId, expiresAt, valid: false };
    }

    // Verify signature (simplified)
    const expectedSig = btoa(`${roomId}:${expiresAt}`).slice(0, 8);
    const valid = signature === expectedSig;

    return { roomId, expiresAt, valid };
  } catch {
    return { roomId: '', expiresAt: 0, valid: false };
  }
}

// Create room invite
export interface RoomInvite {
  roomId: string;
  code: string;
  token: string;
  joinUrl: string;
  expiresAt: number;
}

export function createRoomInvite(mode: 'couch' | 'spellage'): RoomInvite {
  const roomId = generateRoomId();
  const code = generateDisplayCode();
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
  const token = generateToken(roomId, expiresAt);
  const joinUrl = `${APP_URL_BASE}/join/${roomId}?t=${encodeURIComponent(token)}`;

  return {
    roomId,
    code,
    token,
    joinUrl,
    expiresAt,
  };
}

// Share link via native share sheet
export async function shareRoomLink(
  joinUrl: string,
  language: 'sv' | 'en'
): Promise<boolean> {
  const message = language === 'sv'
    ? `Joina mitt Glo-rum ${joinUrl}`
    : `Join my Glo room ${joinUrl}`;

  try {
    const result = await Share.share({
      message,
      url: Platform.OS === 'ios' ? joinUrl : undefined,
    });

    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

// Copy link to clipboard
export async function copyRoomLink(joinUrl: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(joinUrl);
    return true;
  } catch {
    return false;
  }
}

// Parse join URL
export function parseJoinUrl(url: string): { roomId: string; token: string } | null {
  try {
    const urlObj = new URL(url);

    // Match /join/:roomId
    const pathMatch = urlObj.pathname.match(/\/join\/([a-z0-9]+)/i);
    if (!pathMatch) return null;

    const roomId = pathMatch[1];
    const token = urlObj.searchParams.get('t') || '';

    return { roomId, token };
  } catch {
    return null;
  }
}
