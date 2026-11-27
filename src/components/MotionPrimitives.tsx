"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE_DWAY: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.28, delay, ease: EASE_DWAY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroEntrance({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: EASE_DWAY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StepTransition({
  stepKey,
  children,
}: {
  stepKey: string | number;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: EASE_DWAY }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimatedCollapse({
  isOpen,
  children,
  className = "",
}: {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: EASE_DWAY }}
          className={`overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
