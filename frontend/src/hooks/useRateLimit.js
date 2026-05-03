import { useState, useCallback, useRef } from 'react';

/**
 * useRateLimit
 *
 * Client-side mirror of the backend sliding window limiter.
 * ─────────────────────────────────────────────────────────
 * Tracks how many attempts have been made in the current 5-minute
 * window and provides:
 *   - attemptCount            current attempts used
 *   - remaining               slots left before lockout
 *   - isBlocked               whether the user is locked out
 *   - retryAfterSeconds       seconds until lock expires
 *   - blockMessage            user-facing warning message
 *   - recordAttempt()         call after each failed attempt
 *   - recordSuccess()         call on successful auth (resets)
 *   - handleRateLimitError()  parse a 429 API response and sync state
 *
 * Limits (mirrors backend):
 *   login       → 5 / 5 min
 *   admin_login → 3 / 5 min
 *   signup      → 5 / 5 min
 */
export default function useRateLimit(type = 'login') {
  const MAX         = type === 'admin_login' ? 3 : 5;
  const WINDOW_MS   = 5 * 60 * 1000;

  const [state, setState] = useState({
    attemptCount:      0,
    remaining:         MAX,
    isBlocked:         false,
    retryAfterSeconds: 0,
    blockMessage:      '',
  });

  // Store timestamps locally (mirrors backend log)
  const timestampsRef = useRef([]);
  const timerRef      = useRef(null);

  const cleanup = useCallback(() => {
    const now = Date.now();
    timestampsRef.current = timestampsRef.current.filter(ts => ts > now - WINDOW_MS);
    const count     = timestampsRef.current.length;
    const remaining = Math.max(0, MAX - count);
    setState(prev => ({ ...prev, attemptCount: count, remaining, isBlocked: false, blockMessage: '' }));
  }, [MAX, WINDOW_MS]);

  /** Call after each failed auth attempt */
  const recordAttempt = useCallback(() => {
    const now = Date.now();
    timestampsRef.current = [...timestampsRef.current.filter(ts => ts > now - WINDOW_MS), now];
    const count     = timestampsRef.current.length;
    const remaining = Math.max(0, MAX - count);

    if (count >= MAX) {
      const retryAfterSeconds = Math.ceil(
        (timestampsRef.current[0] + WINDOW_MS - now) / 1000
      );

      // Schedule auto-unblock
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(cleanup, retryAfterSeconds * 1000 + 500);

      setState({
        attemptCount:      count,
        remaining:         0,
        isBlocked:         true,
        retryAfterSeconds,
        blockMessage:      `Too many failed attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
      });
    } else {
      const warn = remaining <= 2 && remaining > 0;
      setState({
        attemptCount: count,
        remaining,
        isBlocked:    false,
        retryAfterSeconds: 0,
        blockMessage: warn
          ? `Warning: ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
          : '',
      });
    }
  }, [MAX, WINDOW_MS, cleanup]);

  /** Call after successful auth */
  const recordSuccess = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timestampsRef.current = [];
    setState({ attemptCount: 0, remaining: MAX, isBlocked: false, retryAfterSeconds: 0, blockMessage: '' });
  }, [MAX]);

  /**
   * Parse the 429 response from the server and sync client state
   * Call this in your catch block: handleRateLimitError(error.response?.data)
   */
  const handleRateLimitError = useCallback((apiErrorData) => {
    if (!apiErrorData) return;
    const { retryAfterSeconds, attemptsUsed, attemptsMax, message } = apiErrorData;

    const secs      = retryAfterSeconds || 300;
    const remaining = Math.max(0, (attemptsMax || MAX) - (attemptsUsed || MAX));

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(cleanup, secs * 1000 + 500);

    setState({
      attemptCount:      attemptsUsed || MAX,
      remaining,
      isBlocked:         true,
      retryAfterSeconds: secs,
      blockMessage:      message || `Too many attempts. Try again in ${Math.ceil(secs / 60)} minute(s).`,
    });
  }, [MAX, cleanup]);

  return { ...state, recordAttempt, recordSuccess, handleRateLimitError };
}
