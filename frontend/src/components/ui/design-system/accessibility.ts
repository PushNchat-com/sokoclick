// Accessibility utilities for SokoClick
// Provides standardized ARIA attributes and focus management helpers

import { focus } from "./tokens";

// Common ARIA role attributes
export const roles = {
  button: "button",
  link: "link",
  checkbox: "checkbox",
  radio: "radio",
  tab: "tab",
  tabpanel: "tabpanel",
  menu: "menu",
  menuitem: "menuitem",
  dialog: "dialog",
  alertdialog: "alertdialog",
  alert: "alert",
  progressbar: "progressbar",
  status: "status",
  navigation: "navigation",
  banner: "banner",
  main: "main",
  complementary: "complementary",
  form: "form",
  search: "search",
  searchbox: "searchbox",
  contentinfo: "contentinfo",
};

// Helper for creating aria-label attributes
export const createAriaLabel = (label: string) => ({ "aria-label": label });

// Helper for creating aria-labelledby attributes
export const createAriaLabelledBy = (id: string) => ({ "aria-labelledby": id });

// Helper for creating aria-describedby attributes
export const createAriaDescribedBy = (id: string) => ({
  "aria-describedby": id,
});

// Helper for creating aria-expanded attributes
export const createAriaExpanded = (isExpanded: boolean) => ({
  "aria-expanded": isExpanded,
});

// Helper for creating aria-haspopup attributes
export const createAriaHasPopup = (
  hasPopup: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog",
) => ({ "aria-haspopup": hasPopup });

// Helper for creating aria-selected attributes
export const createAriaSelected = (isSelected: boolean) => ({
  "aria-selected": isSelected,
});

// Helper for creating aria-checked attributes
export const createAriaChecked = (isChecked: boolean | "mixed") => ({
  "aria-checked": isChecked,
});

// Helper for creating aria-current attributes
export const createAriaCurrent = (
  current: boolean | "page" | "step" | "location" | "date" | "time",
) => ({ "aria-current": current });

// Helper for creating aria-disabled attributes
export const createAriaDisabled = (isDisabled: boolean) => ({
  "aria-disabled": isDisabled,
});

// Helper for creating aria-hidden attributes
export const createAriaHidden = (isHidden: boolean) => ({
  "aria-hidden": isHidden,
});

// Helper for creating aria-live attributes
export const createAriaLive = (live: "polite" | "assertive" | "off") => ({
  "aria-live": live,
});

// Helper for creating aria-busy attributes
export const createAriaBusy = (isBusy: boolean) => ({ "aria-busy": isBusy });

// Helper for creating aria-atomic attributes
export const createAriaAtomic = (isAtomic: boolean) => ({
  "aria-atomic": isAtomic,
});

// Helper for creating aria-relevant attributes
export const createAriaRelevant = (
  relevant: "additions" | "removals" | "text" | "all" | "additions text",
) => ({ "aria-relevant": relevant });

// Focus management CSS styles
export const focusStyles = {
  // Default focus style
  default: {
    outline: focus.outline,
    outlineOffset: focus.outlineOffset,
  },

  // Focus style that only shows for keyboard navigation (not mouse clicks)
  keyboard: {
    outline: "none",
    "&:focus-visible": {
      outline: focus.outline,
      outlineOffset: focus.outlineOffset,
      boxShadow: focus.boxShadow,
    },
  },

  // Hidden focus for visually hidden elements that should be focusable
  hidden: {
    outline: "none",
  },
};

// Helper for visually hiding elements while keeping them accessible to screen readers
export const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
};

// Skip link component props to help keyboard users skip to main content
export const createSkipLinkProps = (mainContentId: string) => ({
  href: `#${mainContentId}`,
  className: "skip-link",
  style: {
    ...visuallyHidden,
    "&:focus": {
      ...focusStyles.default,
      position: "fixed",
      top: "16px",
      left: "16px",
      padding: "8px 16px",
      backgroundColor: "white",
      zIndex: 9999,
      width: "auto",
      height: "auto",
      clip: "auto",
      textDecoration: "none",
      fontWeight: "bold",
    },
  },
});

// Create standard keydown handlers for common interactive elements
export const keyboardHandlers = {
  // Handles Enter and Space for clickable elements like buttons
  button: (callback: () => void) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        callback();
      }
    },
  }),

  // Handles Enter for link-like elements
  link: (callback: () => void) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        callback();
      }
    },
  }),

  // Handles arrow keys for navigation
  navigation: (callbacks: {
    onUp?: () => void;
    onDown?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  }) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (callbacks.onUp) {
            e.preventDefault();
            callbacks.onUp();
          }
          break;
        case "ArrowDown":
          if (callbacks.onDown) {
            e.preventDefault();
            callbacks.onDown();
          }
          break;
        case "ArrowLeft":
          if (callbacks.onLeft) {
            e.preventDefault();
            callbacks.onLeft();
          }
          break;
        case "ArrowRight":
          if (callbacks.onRight) {
            e.preventDefault();
            callbacks.onRight();
          }
          break;
        case "Home":
          if (callbacks.onHome) {
            e.preventDefault();
            callbacks.onHome();
          }
          break;
        case "End":
          if (callbacks.onEnd) {
            e.preventDefault();
            callbacks.onEnd();
          }
          break;
        default:
          break;
      }
    },
  }),
};
