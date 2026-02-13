import { Variants } from "framer-motion";

// Fade In Animation
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: "easeIn" }
    }
};

// Slide In Animations
export const slideInFromBottom: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: {
        opacity: 0,
        y: 20,
        transition: { duration: 0.2, ease: "easeIn" }
    }
};

export const slideInFromTop: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.2, ease: "easeIn" }
    }
};

export const slideInFromLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: { duration: 0.2, ease: "easeIn" }
    }
};

export const slideInFromRight: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: 0.2, ease: "easeIn" }
    }
};

// Scale In Animation
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.25, ease: "easeOut" }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2, ease: "easeIn" }
    }
};

// Stagger Container
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

// Stagger Item
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

// Hover Animation
export const hoverScale = {
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeOut" }
};

export const hoverLift = {
    y: -4,
    transition: { duration: 0.2, ease: "easeOut" }
};

export const hoverGlow = {
    boxShadow: "0 0 20px rgba(102, 126, 234, 0.5)",
    transition: { duration: 0.2, ease: "easeOut" }
};

// Tap Animation
export const tapScale = {
    scale: 0.95,
    transition: { duration: 0.1, ease: "easeInOut" }
};

// Modal/Overlay Animations
export const modalBackdrop: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2 }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

export const modalContent: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: { duration: 0.2 }
    }
};

// Sidebar Animation
export const sidebarVariants: Variants = {
    hidden: { x: -280 },
    visible: {
        x: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
        }
    },
    exit: {
        x: -280,
        transition: { duration: 0.2 }
    }
};

// Page Transition
export const pageTransition: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
        }
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: 0.3 }
    }
};

// Loading Spinner
export const spinnerVariants: Variants = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: "linear"
        }
    }
};

// Pulse Animation
export const pulseVariants: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};
