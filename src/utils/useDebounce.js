import { useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing values or function calls
 * @param {function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @param {array} dependencies - Dependency array for the callback
 * @returns {void}
 */
export const useDebounce = (callback, delay = 500, dependencies = []) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
};

/**
 * Custom hook for debouncing a value
 * Useful for search inputs
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {*} Debounced value
 */
export const useDebouncedValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = require('react').useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
