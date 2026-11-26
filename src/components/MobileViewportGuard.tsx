"use client";

import { useEffect } from "react";

const INPUT_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea';

/**
 * Protects mobile browsers (especially iOS Safari) from horizontal layout drift
 * after soft-keyboard / native select dismissal, and exposes `data-keyboard-open`
 * on `<html>` so fixed bottom navigation hides while typing.
 */
export function MobileViewportGuard() {
  useEffect(() => {
    const root = document.documentElement;
    let focusBlurTimer: number | null = null;
    let baselineHeight = window.visualViewport?.height ?? window.innerHeight;

    const resetHorizontalDrift = () => {
      if (window.scrollX !== 0) {
        window.scrollTo({ left: 0, top: window.scrollY, behavior: "instant" as ScrollBehavior });
      }
      if (document.documentElement.scrollLeft !== 0) {
        document.documentElement.scrollLeft = 0;
      }
      if (document.body.scrollLeft !== 0) {
        document.body.scrollLeft = 0;
      }
    };

    const handleViewportResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      if (vv.height > baselineHeight) {
        baselineHeight = vv.height;
      }
      const heightDiff = baselineHeight - vv.height;
      const isKeyboardLikelyOpen = heightDiff > 140;
      if (isKeyboardLikelyOpen) {
        root.setAttribute("data-keyboard-open", "true");
      } else {
        root.removeAttribute("data-keyboard-open");
        resetHorizontalDrift();
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.matches(INPUT_SELECTOR)) {
        if (focusBlurTimer) {
          window.clearTimeout(focusBlurTimer);
          focusBlurTimer = null;
        }
        root.setAttribute("data-keyboard-open", "true");
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.matches(INPUT_SELECTOR)) {
        if (focusBlurTimer) window.clearTimeout(focusBlurTimer);
        focusBlurTimer = window.setTimeout(() => {
          const active = document.activeElement as HTMLElement | null;
          if (!active || !active.matches(INPUT_SELECTOR)) {
            root.removeAttribute("data-keyboard-open");
            resetHorizontalDrift();
          }
        }, 120);
      }
    };

    window.visualViewport?.addEventListener("resize", handleViewportResize);
    window.addEventListener("orientationchange", resetHorizontalDrift);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      if (focusBlurTimer) window.clearTimeout(focusBlurTimer);
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
      window.removeEventListener("orientationchange", resetHorizontalDrift);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}
