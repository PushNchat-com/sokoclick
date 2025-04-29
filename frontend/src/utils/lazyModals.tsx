import { lazyWithSpinner } from "./lazyImport";

/**
 * Lazy loaded ConfirmModal component
 */
export const LazyConfirmModal = lazyWithSpinner(() =>
  import("../components/ui/ConfirmModal").then((module) => ({
    default: module.ConfirmModal,
  })),
);

/**
 * Lazy loaded Dialog component
 */
export const LazyDialog = lazyWithSpinner(() =>
  import("../components/ui/Dialog").then((module) => ({
    default: module.Dialog,
  })),
);

/**
 * Lazy loaded ConfirmDialog provider
 */
export const LazyConfirmDialogProvider = lazyWithSpinner(() =>
  import("../components/ui/ConfirmDialog").then((module) => ({
    default: module.ConfirmDialogProvider,
  })),
);

/**
 * Lazy loaded Modal component
 */
export const LazyModal = lazyWithSpinner(() =>
  import("../components/ui/molecules/Modal").then((module) => ({
    default: module.default,
  })),
);
