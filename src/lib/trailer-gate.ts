// ============================================================================
// TRAILER GATE — AUTOPLAY STABILITY GATE (US-003)
// ============================================================================
// Tracks trailer playback metrics to ensure system stability before enabling
// autoplay. The gate only passes after proving reliable operation.
//
// Gate Requirements:
// - 50 consecutive autoplay successes
// - 50 consecutive swipe-stop successes
// - 0 blink-stops (video stopping within 2 seconds of starting)
//
// If ANY failure occurs, the gate fails permanently for the session.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export type MetricType = 'autoplay' | 'swipeStop';

export interface GateMetrics {
  autoplaySuccesses: number;
  autoplayFailures: number;
  swipeStopSuccesses: number;
  swipeStopFailures: number;
  blinkStopCount: number;
  lastUpdated: number;
  sessionFailed: boolean;
}

export interface GateStatus {
  passed: boolean;
  autoplayReady: boolean;
  swipeStopReady: boolean;
  blinkStopClear: boolean;
  sessionFailed: boolean;
  metrics: GateMetrics;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'trailer_gate_metrics';
const GATE_THRESHOLD = 50; // 50 consecutive successes required
const APP_VERSION_KEY = 'trailer_gate_app_version';
const CURRENT_APP_VERSION = '1.0.0'; // Update this when app version changes

// ============================================================================
// STATE
// ============================================================================

// In-memory state for fast access
let metrics: GateMetrics = {
  autoplaySuccesses: 0,
  autoplayFailures: 0,
  swipeStopSuccesses: 0,
  swipeStopFailures: 0,
  blinkStopCount: 0,
  lastUpdated: Date.now(),
  sessionFailed: false,
};

// Session failure flag (does not persist across app restarts)
let sessionFailed = false;

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load gate metrics from AsyncStorage
 */
export async function loadGateMetrics(): Promise<void> {
  try {
    // Check if app version changed (reset metrics if so)
    const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
    if (storedVersion !== CURRENT_APP_VERSION) {
      // App was updated - reset metrics
      await AsyncStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: GateMetrics = JSON.parse(stored);
      // Don't restore sessionFailed - that's per-session only
      metrics = {
        ...parsed,
        sessionFailed: false,
      };
    }
  } catch {
    // Failed to load - use defaults
  }
}

/**
 * Save gate metrics to AsyncStorage
 */
async function saveGateMetrics(): Promise<void> {
  try {
    metrics.lastUpdated = Date.now();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // Silent fail - persistence is best-effort
  }
}

// ============================================================================
// GATE API
// ============================================================================

/**
 * Check if the autoplay gate has passed
 * Gate passes when:
 * - 50 consecutive autoplay successes
 * - 50 consecutive swipe-stop successes
 * - 0 blink-stops
 * - No failures this session
 */
export function isGatePassed(): boolean {
  if (sessionFailed) {
    return false;
  }

  const autoplayReady = metrics.autoplaySuccesses >= GATE_THRESHOLD;
  const swipeStopReady = metrics.swipeStopSuccesses >= GATE_THRESHOLD;
  const blinkStopClear = metrics.blinkStopCount === 0;

  return autoplayReady && swipeStopReady && blinkStopClear;
}

/**
 * Get detailed gate status
 */
export function getGateStatus(): GateStatus {
  const autoplayReady = metrics.autoplaySuccesses >= GATE_THRESHOLD;
  const swipeStopReady = metrics.swipeStopSuccesses >= GATE_THRESHOLD;
  const blinkStopClear = metrics.blinkStopCount === 0;

  return {
    passed: isGatePassed(),
    autoplayReady,
    swipeStopReady,
    blinkStopClear,
    sessionFailed,
    metrics: { ...metrics },
  };
}

/**
 * Record a success for the specified metric type
 */
export function recordSuccess(type: MetricType): void {
  if (sessionFailed) {
    // Gate already failed for this session - don't record
    return;
  }

  switch (type) {
    case 'autoplay':
      metrics.autoplaySuccesses++;
      break;
    case 'swipeStop':
      metrics.swipeStopSuccesses++;
      break;
  }

  // Save asynchronously (don't block)
  saveGateMetrics();
}

/**
 * Record a failure for the specified metric type
 * Any failure causes the gate to fail permanently for this session
 */
export function recordFailure(type: MetricType): void {
  // Mark session as failed
  sessionFailed = true;
  metrics.sessionFailed = true;

  // Reset consecutive counters
  switch (type) {
    case 'autoplay':
      metrics.autoplayFailures++;
      metrics.autoplaySuccesses = 0; // Reset consecutive count
      break;
    case 'swipeStop':
      metrics.swipeStopFailures++;
      metrics.swipeStopSuccesses = 0; // Reset consecutive count
      break;
  }

  // Save asynchronously (don't block)
  saveGateMetrics();
}

/**
 * Record a blink-stop (video stopped within 2 seconds of starting)
 * This is treated as a failure condition
 */
export function recordBlinkStop(): void {
  metrics.blinkStopCount++;
  sessionFailed = true;
  metrics.sessionFailed = true;

  // Save asynchronously (don't block)
  saveGateMetrics();
}

/**
 * Reset the gate for a new session
 * Called when app restarts or user explicitly resets
 */
export function resetGate(): void {
  sessionFailed = false;
  metrics = {
    autoplaySuccesses: 0,
    autoplayFailures: 0,
    swipeStopSuccesses: 0,
    swipeStopFailures: 0,
    blinkStopCount: 0,
    lastUpdated: Date.now(),
    sessionFailed: false,
  };

  // Save asynchronously (don't block)
  saveGateMetrics();
}

/**
 * Reset only the session failure flag
 * Keeps accumulated metrics but allows gate to potentially pass again
 */
export function resetSessionFailure(): void {
  sessionFailed = false;
  metrics.sessionFailed = false;
}

// ============================================================================
// DEBUG/TESTING
// ============================================================================

/**
 * Force gate to pass (for testing only)
 */
export function forceGatePass(): void {
  sessionFailed = false;
  metrics = {
    autoplaySuccesses: GATE_THRESHOLD,
    autoplayFailures: 0,
    swipeStopSuccesses: GATE_THRESHOLD,
    swipeStopFailures: 0,
    blinkStopCount: 0,
    lastUpdated: Date.now(),
    sessionFailed: false,
  };
  saveGateMetrics();
}

/**
 * Get current metrics (for debugging)
 */
export function getMetrics(): GateMetrics {
  return { ...metrics };
}

/**
 * Get gate threshold constant (for UI display)
 */
export function getGateThreshold(): number {
  return GATE_THRESHOLD;
}
