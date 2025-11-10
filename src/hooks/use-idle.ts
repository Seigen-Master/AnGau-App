
'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook to detect when a user is idle.
 * @param timeout The amount of time in milliseconds before the user is considered idle.
 * @param onIdle The callback function to execute when the user becomes idle.
 * @param enabled A boolean to enable or disable the idle timer.
 */
const useIdle = (timeout: number, onIdle: () => void, enabled: boolean = true) => {
  const timeoutId = useRef<NodeJS.Timeout>();

  // Resets the timer. If the timer is enabled, it sets a new timeout.
  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    if (enabled) {
      timeoutId.current = setTimeout(onIdle, timeout);
    }
  }, [timeout, onIdle, enabled]);

  // Sets up and tears down the event listeners.
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'mousedown'];

    const handleEvent = () => {
        resetTimer();
    };
    
    if (enabled) {
        events.forEach(event => window.addEventListener(event, handleEvent, { passive: true }));
        resetTimer(); // Initialize timer when enabled
    }

    return () => {
      // Cleanup: remove listeners and clear the timeout.
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (enabled) {
          events.forEach(event => window.removeEventListener(event, handleEvent));
      }
    };
  }, [resetTimer, enabled]);

  return null; // This hook manages a side-effect and doesn't need to return a value.
};

export default useIdle;
