"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "dway_scroll_positions_v1";

function markPop() {
  if (typeof window !== "undefined") {
    (window as unknown as { __dwayLastPopAt?: number }).__dwayLastPopAt = Date.now();
  }
}

function getLastPopAt(): number {
  if (typeof window === "undefined") return 0;
  return (window as unknown as { __dwayLastPopAt?: number }).__dwayLastPopAt || 0;
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", markPop, true);
}

function readPositions(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePosition(key: string, y: number) {
  try {
    const map = readPositions();
    map[key] = y;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota / private mode restrictions
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Manages route-aware scroll behavior across DWay AutoCare:
 * - Hash links (#section) scroll smoothly to the target section.
 * - Browser Back/Forward (popstate) restores the user's prior scroll position
 *   once the destination page height is ready.
 * - Forward navigation (e.g. "Agendar" from footer or bottom mobile nav)
 *   never strands the user in the footer; it lands on [data-scroll-target="primary"]
 *   or the top of the new route's main content.
 */
export function SmartScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  const currentKeyRef = useRef(routeKey);
  const isPopRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const suppressSaveUntilRef = useRef(0);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const handlePopState = () => {
      isPopRef.current = true;
      markPop();
      suppressSaveUntilRef.current = Date.now() + 1200;
    };

    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("a[href]")) {
        writePosition(currentKeyRef.current, window.scrollY);
        suppressSaveUntilRef.current = Date.now() + 500;
      }
    };

    let scrollTimer: number | null = null;
    const handleScroll = () => {
      if (Date.now() < suppressSaveUntilRef.current) return;
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        if (Date.now() < suppressSaveUntilRef.current) return;
        writePosition(currentKeyRef.current, window.scrollY);
      }, 120);
    };

    window.addEventListener("popstate", handlePopState, true);
    document.addEventListener("click", handleCaptureClick, true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      window.removeEventListener("popstate", handlePopState, true);
      document.removeEventListener("click", handleCaptureClick, true);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    currentKeyRef.current = routeKey;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) {
          target.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
        }
      }
      return;
    }

    const wasPop = isPopRef.current || Date.now() - getLastPopAt() < 1500;
    isPopRef.current = false;

    if (wasPop) {
      const saved = readPositions()[routeKey];
      if (typeof saved === "number" && saved > 0) {
        const restore = () => {
          if (document.documentElement.scrollHeight >= saved + window.innerHeight * 0.4) {
            const html = document.documentElement;
            const prev = html.style.scrollBehavior;
            html.style.scrollBehavior = "auto";
            window.scrollTo(0, saved);
            html.style.scrollBehavior = prev;
          }
        };
        const observer = new ResizeObserver(restore);
        observer.observe(document.body);
        const rafId = window.requestAnimationFrame(restore);
        const t1 = window.setTimeout(restore, 160);
        const t2 = window.setTimeout(restore, 380);
        const t3 = window.setTimeout(() => {
          restore();
          observer.disconnect();
        }, 900);
        return () => {
          observer.disconnect();
          window.cancelAnimationFrame(rafId);
          window.clearTimeout(t1);
          window.clearTimeout(t2);
          window.clearTimeout(t3);
        };
      }
    }

    const applyForwardScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          target.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
          return;
        }
      }

      const primaryTarget = document.querySelector<HTMLElement>('[data-scroll-target="primary"]');
      if (primaryTarget) {
        const rect = primaryTarget.getBoundingClientRect();
        const top = Math.max(0, rect.top + window.scrollY - 88);
        window.scrollTo({ top, left: 0, behavior: "instant" as ScrollBehavior });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    };

    const rafId = window.requestAnimationFrame(applyForwardScroll);
    const settleId = window.setTimeout(applyForwardScroll, 90);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleId);
    };
  }, [routeKey]);

  return null;
}
