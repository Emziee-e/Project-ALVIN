import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Interview integrity monitor.
 *
 * IMPORTANT: a web page cannot stop a person from opening other tabs or
 * programs. What it can do is
 *   1. ask the browser for fullscreen,
 *   2. detect when the candidate leaves the interview (tab switch, minimized
 *      window, lost focus, exited fullscreen), and
 *   3. respond: show a warning and end the interview after too many.
 *
 * Usage:
 *   const lockdown = useInterviewLockdown({
 *     active: sessionStarted && !isFinishing,
 *     maxViolations: 3,
 *     onLimitReached: () => endInterview(),
 *   });
 *   lockdown.enterFullscreen();   // call inside the "Start" click handler
 *   lockdown.warning;             // null | { reason, count }
 *   lockdown.dismissWarning();    // wire to the "Return to interview" button
 */

// Leaving the window can fire several events at once (blur + visibility +
// fullscreen). Anything inside this window counts as the same incident.
const SAME_INCIDENT_MS = 3000;

// Brief focus loss (a system popup, a permission prompt) is ignored unless
// the window is still unfocused after this delay.
const BLUR_GRACE_MS = 1500;

const fullscreenSupported = () =>
  typeof document !== "undefined" &&
  !!document.documentElement.requestFullscreen;

export default function useInterviewLockdown({
  active,
  maxViolations = 3,
  onLimitReached,
}) {
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState(null);

  const violationsRef = useRef(0);
  const lastViolationAtRef = useRef(0);
  const limitReachedRef = useRef(false);
  const wasFullscreenRef = useRef(false);
  const onLimitReachedRef = useRef(onLimitReached);

  useEffect(() => {
    onLimitReachedRef.current = onLimitReached;
  }, [onLimitReached]);

  const recordViolation = useCallback(
    (reason) => {
      const now = Date.now();
      if (now - lastViolationAtRef.current < SAME_INCIDENT_MS) return;
      lastViolationAtRef.current = now;

      violationsRef.current += 1;
      const count = violationsRef.current;

      setViolations(count);
      setWarning({ reason, count });

      if (count >= maxViolations && !limitReachedRef.current) {
        limitReachedRef.current = true;
        onLimitReachedRef.current?.();
      }
    },
    [maxViolations]
  );

  // Must be called synchronously from a user click (browser requirement).
  const enterFullscreen = useCallback(async () => {
    const element = document.documentElement;
    if (!element.requestFullscreen) return false;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen({ navigationUI: "hide" });
      }
      wasFullscreenRef.current = true;

      // Chromium only: stops a single Esc press from leaving fullscreen
      // (the candidate must hold Esc). Harmless where unsupported.
      try {
        await navigator.keyboard?.lock?.(["Escape"]);
      } catch {
        /* unsupported */
      }
      return true;
    } catch (error) {
      console.warn("Fullscreen request failed:", error);
      return false;
    }
  }, []);

  const dismissWarning = useCallback(async () => {
    if (fullscreenSupported() && !document.fullscreenElement) {
      const entered = await enterFullscreen();
      if (!entered) return; // keep the warning up until they are back
    }
    setWarning(null);
  }, [enterFullscreen]);

  // Monitoring runs only while the interview is live.
  useEffect(() => {
    if (!active) return undefined;

    let blurTimer = null;

    const onVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("You switched to another tab or minimized the window.");
      }
    };

    const onBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          recordViolation("You left the interview window.");
        }
      }, BLUR_GRACE_MS);
    };

    const onFocus = () => clearTimeout(blurTimer);

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        wasFullscreenRef.current = true;
        return;
      }
      if (wasFullscreenRef.current) {
        wasFullscreenRef.current = false;
        recordViolation("You exited fullscreen mode.");
      }
    };

    const block = (event) => event.preventDefault();
    const blockedEvents = ["contextmenu", "copy", "cut", "paste"];

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    blockedEvents.forEach((name) => document.addEventListener(name, block));

    // Fullscreen is required once the interview is live.
    if (fullscreenSupported() && !document.fullscreenElement) {
      queueMicrotask(() =>
        recordViolation("Fullscreen mode is required during the interview.")
      );
    }

    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      blockedEvents.forEach((name) =>
        document.removeEventListener(name, block)
      );
    };
  }, [active, recordViolation]);

  // Leave fullscreen and release the keyboard when the page goes away.
  useEffect(
    () => () => {
      try {
        navigator.keyboard?.unlock?.();
      } catch {
        /* unsupported */
      }
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    },
    []
  );

  return { violations, warning, enterFullscreen, dismissWarning };
}