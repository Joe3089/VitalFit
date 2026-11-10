"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  onLogout: () => void;
  isEnabled: boolean;
  warningTimeMs: number;
  logoutTimeMs: number;
}

export const useSessionTimeout = ({ onLogout, isEnabled, warningTimeMs, logoutTimeMs }: Props) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isWarningActiveRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
    }
    if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
    }
  }, []);

  const fullReset = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    isWarningActiveRef.current = false;
  }, [clearAllTimers]);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    isWarningActiveRef.current = true;
    
    let secondsLeft = Math.floor(logoutTimeMs / 1000);
    setRemainingTime(secondsLeft);

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setRemainingTime(secondsLeft);
      
      if (secondsLeft <= 0) {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }
        fullReset(); 
        onLogout();
      }
    }, 1000);
  }, [logoutTimeMs, onLogout, fullReset]);

  const resetTimer = useCallback(() => {
    fullReset();
    
    if (isEnabled) {
      warningTimerRef.current = setTimeout(() => {
        startCountdown();
      }, warningTimeMs);
    }
  }, [isEnabled, warningTimeMs, fullReset, startCountdown]);

  useEffect(() => {
    if (!isEnabled) {
      fullReset();
      return;
    }

    const handleActivity = () => {
      if (!isWarningActiveRef.current) {
        resetTimer();
      }
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, handleActivity));
    
    resetTimer();

    return () => {
      fullReset();
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isEnabled, resetTimer, fullReset]);

  return { showWarning, remainingTime, resetTimer };
};