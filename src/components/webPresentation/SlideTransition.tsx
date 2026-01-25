import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface SlideTransitionProps {
  children: ReactNode;
  slideKey: number;
  direction?: 'left' | 'right';
}

const slideVariants = {
  enter: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? '-100%' : '100%',
    opacity: 0,
  }),
};

const transition = {
  x: { type: 'spring' as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  slideKey,
  direction = 'right',
}) => {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={slideKey}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="absolute inset-0 flex items-center justify-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Staggered container for child animations
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  className = '',
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Fade in item for staggered lists
interface FadeInItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeInItem: React.FC<FadeInItemProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Scale in animation for cards
interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 200, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Count up animation hook
export const useCountUp = (end: number, duration: number = 1.5, delay: number = 0): number => {
  const { useMotionValue, useTransform, animate } = require('framer-motion');
  const { useEffect, useState } = require('react');

  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest: number) => Math.round(latest));

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v: number) => setDisplayValue(v));

    const timeout = setTimeout(() => {
      animate(motionValue, end, { duration });
    }, delay * 1000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [end, duration, delay, motionValue, rounded, animate]);

  return displayValue;
};

// Slide in from direction
interface SlideInProps {
  children: ReactNode;
  className?: string;
  from?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  className = '',
  from = 'left',
  delay = 0,
}) => {
  const directionMap = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    top: { x: 0, y: -50 },
    bottom: { x: 0, y: 50 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[from] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 100, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Spring bounce animation
interface BounceInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const BounceIn: React.FC<BounceInProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        type: 'spring',
        stiffness: 300,
        damping: 15,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Pulse animation for highlights
interface PulseProps {
  children: ReactNode;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.02, 1],
        opacity: [1, 0.9, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
