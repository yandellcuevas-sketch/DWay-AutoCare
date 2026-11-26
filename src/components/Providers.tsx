"use client";

import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import { MobileViewportGuard } from "./MobileViewportGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SessionProvider>
        <MobileViewportGuard />
        {children}
      </SessionProvider>
    </MotionConfig>
  );
}
