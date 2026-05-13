// Reusable motion presets for page load, scroll reveal, and interactive states.
export const EASE_SMOOTH = [0.22, 1, 0.36, 1];

export const transitions = {
  fast: { duration: 0.3, ease: EASE_SMOOTH },
  medium: { duration: 0.45, ease: EASE_SMOOTH },
  slow: { duration: 0.6, ease: EASE_SMOOTH },
};

export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: transitions.medium },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: transitions.medium },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 34 },
  show: { opacity: 1, x: 0, transition: transitions.slow },
};

export const cardHover = {
  whileHover: {
    y: -6,
    scale: 1.015,
    boxShadow: '0 24px 56px rgb(0 212 255 / 0.16)',
  },
  whileTap: { scale: 0.99 },
  transition: transitions.medium,
};

export const buttonHover = {
  whileHover: {
    y: -2,
    scale: 1.02,
    boxShadow: '0 0 26px rgb(0 212 255 / 0.28)',
  },
  whileTap: { scale: 0.98 },
  transition: transitions.fast,
};
