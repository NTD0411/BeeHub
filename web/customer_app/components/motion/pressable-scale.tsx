"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export function PressableScale({ children, className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
