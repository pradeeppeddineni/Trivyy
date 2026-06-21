import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface PageTransitionProps {
  readonly children: ReactNode;
}

/** Fade-and-rise entry for a screen; collapses to instant under reduced motion. */
export function PageTransition({ children }: PageTransitionProps): JSX.Element {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.28, ease: [0.34, 1.42, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
