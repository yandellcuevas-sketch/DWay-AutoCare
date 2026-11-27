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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
      className={`dway-reveal ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className = "",
  index = 0,
  columns = 3,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  columns?: number;
}) {
  const staggerDelay = (index % columns) * 0.15;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: staggerDelay, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
      className={`dway-reveal ${className}`}
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
      transition={{ duration: 0.35, delay, ease: EASE_DWAY }}
      className={`dway-reveal ${className}`}
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
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.28, ease: EASE_DWAY }}
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
          transition={{ height: { duration: 0.32, ease: EASE_DWAY }, opacity: { duration: 0.24 } }}
          className={`overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
