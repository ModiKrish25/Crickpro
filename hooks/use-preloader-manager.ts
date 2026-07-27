/**
 * usePreloaderManager — Bulletproof preloader lifecycle manager.
 * Uses a global session flag so once the preloader completes its exit,
 * it never re-mounts or blocks the screen again.
 */
import { useState, useEffect, useCallback, useRef } from "react";

export type PreloaderPhase = "loading" | "exit" | "hidden";

export interface PreloaderState {
  phase: PreloaderPhase;
  loadingProgress: number; // 0 to 1
  errorMessage?: string;
}

interface PreloaderManagerOptions {
  authLoading: boolean;
  appReady?: boolean;
}

// Global session flag — once exit is completed, preloader never shows again
let globalExitComplete = false;

export function usePreloaderManager({ authLoading }: PreloaderManagerOptions) {
  const [loadingProgress, setLoadingProgress] = useState(globalExitComplete ? 1 : 0);
  const [phase, setPhase] = useState<PreloaderPhase>(globalExitComplete ? "hidden" : "loading");
  const [exitComplete, setExitComplete] = useState(globalExitComplete);

  const authLoadingRef = useRef(authLoading);
  useEffect(() => {
    authLoadingRef.current = authLoading;
  }, [authLoading]);

  useEffect(() => {
    if (globalExitComplete) {
      setExitComplete(true);
      setPhase("hidden");
      return;
    }

    const startTime = Date.now();
    const duration = 800; // 0.8s smooth progress animation

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setLoadingProgress(progress);

      // Once progress completes and auth isn't blocking, exit immediately
      if (progress >= 1 && !authLoadingRef.current) {
        clearInterval(interval);
        setPhase("exit");
      }
    }, 20);

    // Check if auth becomes ready after progress reaches 100%
    const checkAuthInterval = setInterval(() => {
      if (!authLoadingRef.current && Date.now() - startTime >= duration) {
        clearInterval(checkAuthInterval);
        setPhase("exit");
      }
    }, 50);

    // Guaranteed max safety fallback: force exit after 1.2s max under any condition
    const maxTimer = setTimeout(() => {
      setLoadingProgress(1);
      setPhase("exit");
    }, 1200);

    return () => {
      clearInterval(interval);
      clearInterval(checkAuthInterval);
      clearTimeout(maxTimer);
    };
  }, []);

  const handleExitComplete = useCallback(() => {
    globalExitComplete = true;
    setExitComplete(true);
    setPhase("hidden");
  }, []);

  const handleRetry = useCallback(() => {
    globalExitComplete = false;
    setLoadingProgress(0);
    setPhase("loading");
    setExitComplete(false);
  }, []);

  return {
    state: { phase, loadingProgress },
    exitComplete,
    onRetry: handleRetry,
    onExitComplete: handleExitComplete,
  };
}

export default usePreloaderManager;
