"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type FadeSlideInProps = HTMLMotionProps<"div"> & { delay?: number; y?: number };

export function FadeSlideIn({ children, delay = 0, y = 16, className, ...props }: FadeSlideInProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = children as ReactNode;

  if (!mounted) {
    return <div className={className}>{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {content}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
