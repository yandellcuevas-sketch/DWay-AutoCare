"use client";

import React, { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import { MobileViewportGuard } from "./MobileViewportGuard";
import { SmartScrollManager } from "./SmartScrollManager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SessionProvider>
        <MobileViewportGuard />
        <Suspense fallback={null}>
          <SmartScrollManager />
        </Suspense>
        {children}
      </SessionProvider>
    </MotionConfig>
  );
}
