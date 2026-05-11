/**
 * Debouncing utilities for API calls and state updates
 */

import React from 'react';

/**
 * Debounce an async function
 * @param {Function} fn - Async function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with cancel method
 */
export const debounceAsync = (fn, delay) => {
  let timeoutId;
  let lastArgs;
  let lastThis;

  const debounced = function (...args) {
    lastThis = this;
    lastArgs = args;

    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(lastThis, lastArgs);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };

  /**
   * Cancel pending debounced calls
   */
  debounced.cancel = () => {
    clearTimeout(timeoutId);
    lastArgs = null;
    lastThis = null;
  };

  /**
   * Immediately execute the debounced function
   */
  debounced.flush = async function () {
    clearTimeout(timeoutId);
    if (lastArgs) {
      try {
        return await fn.apply(lastThis, lastArgs);
      } finally {
        lastArgs = null;
        lastThis = null;
      }
    }
    return null;
  };

  /**
   * Check if a call is pending
   */
  debounced.isPending = () => {
    return lastArgs !== null;
  };

  return debounced;
};

/**
 * Debounce a regular synchronous function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with cancel method
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  let lastArgs;
  let lastThis;

  const debounced = function (...args) {
    lastThis = this;
    lastArgs = args;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      try {
        fn.apply(lastThis, lastArgs);
      } finally {
        lastArgs = null;
        lastThis = null;
      }
    }, delay);
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = function () {
    clearTimeout(timeoutId);
    if (lastArgs) {
      try {
        return fn.apply(lastThis, lastArgs);
      } finally {
        lastArgs = null;
        lastThis = null;
      }
    }
    return null;
  };

  debounced.isPending = () => {
    return lastArgs !== null;
  };

  return debounced;
};

/**
 * Throttle a function - executes at most once every `delay` milliseconds
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (fn, delay) => {
  let lastCallTime = 0;
  let timeoutId;

  const throttled = function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      fn.apply(this, args);
      lastCallTime = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        lastCallTime = Date.now();
      }, delay - timeSinceLastCall);
    }
  };

  throttled.cancel = () => {
    clearTimeout(timeoutId);
    lastCallTime = 0;
  };

  return throttled;
};

/**
 * React hook for debounced values
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * React hook for debounced async functions
 * @param {Function} asyncFn - Async function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {[Function, boolean]} Debounced function and isLoading state
 */
export const useDebouncedAsyncFn = (asyncFn, delay = 500) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const debouncedFn = React.useMemo(() => {
    return debounceAsync(async (...args) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, delay);
  }, [asyncFn, delay]);

  const cancel = React.useCallback(() => {
    debouncedFn.cancel();
    setIsLoading(false);
  }, [debouncedFn]);

  return [debouncedFn, isLoading, error, cancel];
};
