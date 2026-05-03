import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce — debounces a value change
 * @param {any}    value  - value to debounce
 * @param {number} delay  - milliseconds to wait
 * @returns debounced value
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback — debounces a function call
 * @param {Function} callback  - function to debounce
 * @param {number}   delay     - ms
 * @param {Array}    deps      - dependencies
 * @returns debounced function + cancel function
 */
export function useDebouncedCallback(callback, delay = 400, deps = []) {
  const timerRef = useRef(null);

  const debouncedFn = useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...deps]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cancel(), [cancel]);

  return [debouncedFn, cancel];
}

/**
 * useFieldValidation — live async field validation with debounce
 * Used to check email/mobile availability without spamming the server
 *
 * @param {string}   value     - field value to validate
 * @param {Function} validator - async (value) => { valid: bool, message: string }
 * @param {number}   delay     - debounce delay in ms
 * @returns { isChecking, result: { valid, message } }
 */
export function useFieldValidation(value, validator, delay = 600) {
  const debouncedValue = useDebounce(value, delay);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 3) {
      setResult(null);
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    validator(debouncedValue)
      .then((res) => { if (!cancelled) setResult(res); })
      .catch(() => { if (!cancelled) setResult(null); })
      .finally(() => { if (!cancelled) setIsChecking(false); });

    return () => { cancelled = true; };
  }, [debouncedValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isChecking, result };
}
