import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import Loading from "../Components/Loading";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
  };

  // Call this when navigation or page loading begins
  const startLoading = useCallback(() => {
    clearTimers();
    setIsExiting(false);
    setIsVisible(true);
    setProgress(0);

    // Smoothly advance up to 90% while waiting for the next page to finish loading
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        const step = Math.max(1, Math.floor((90 - prev) * 0.15));
        return Math.min(prev + step, 90);
      });
    }, 80);
  }, []);

  // Call this when the target page has finished fetching its data and rendered
  const finishLoading = useCallback(() => {
    clearTimers();
    setProgress(100);

    // Brief pause at 100% so the user sees completion, then trigger slide-up exit
    exitTimerRef.current = setTimeout(() => {
      setIsExiting(true);

      exitTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
        setProgress(0);
      }, 500); // Match the duration of your `animate-slide-up` CSS animation
    }, 250);
  }, []);

  return (
    <LoadingContext.Provider value={{ startLoading, finishLoading, setProgress }}>
      {isVisible && <Loading progress={progress} isExiting={isExiting} />}
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);