import React, { createContext, useContext, useState, ReactNode } from "react";
import { Button } from "./Button";
import { CloseIcon, InfoIcon } from "./Icons";

/**
 * Props for individual confirmation dialog instances
 */
export interface ConfirmDialogProps {
  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message
   */
  message: string;

  /**
   * Text for the confirm button
   */
  confirmText?: string;

  /**
   * Text for the cancel button
   */
  cancelText?: string;

  /**
   * Variant for the confirm button
   */
  confirmVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger";

  /**
   * Function to call when confirmed
   */
  onConfirm: () => void;

  /**
   * Optional function to call when canceled
   */
  onCancel?: () => void;

  /**
   * Optional icon to display
   */
  icon?: ReactNode;

  /**
   * Whether the dialog is open or not - This should be managed internally by the Provider
   */
  isOpen?: boolean;
}

/**
 * Context for handling confirmation dialogs
 */
interface ConfirmDialogContextType {
  openConfirmDialog: (props: ConfirmDialogProps) => void;
  closeConfirmDialog: () => void;
}

const ConfirmDialogContext = createContext<
  ConfirmDialogContextType | undefined
>(undefined);

/**
 * Provider component that wraps the application to provide confirm dialog functionality
 */
export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<ConfirmDialogProps | null>(
    null,
  );

  const openConfirmDialog = (props: ConfirmDialogProps) => {
    setDialogProps(props);
    setDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setDialogOpen(false);
    // Clear props after animation completes
    setTimeout(() => setDialogProps(null), 200);
  };

  const handleConfirm = () => {
    if (dialogProps?.onConfirm) {
      dialogProps.onConfirm();
    }
    closeConfirmDialog();
  };

  const handleCancel = () => {
    if (dialogProps?.onCancel) {
      dialogProps.onCancel();
    }
    closeConfirmDialog();
  };

  return (
    <ConfirmDialogContext.Provider
      value={{ openConfirmDialog, closeConfirmDialog }}
    >
      {children}

      {/* Overlay */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* Dialog */}
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {dialogProps?.title}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex items-start">
                {dialogProps?.icon || (
                  <InfoIcon className="w-6 h-6 text-blue-500 mt-0.5 mr-3" />
                )}
                <p className="text-gray-700">{dialogProps?.message}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                {dialogProps?.cancelText || "Cancel"}
              </Button>
              <Button
                variant={dialogProps?.confirmVariant || "primary"}
                onClick={handleConfirm}
              >
                {dialogProps?.confirmText || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};

/**
 * Hook to use the confirm dialog
 * @example
 * const { openConfirmDialog } = useConfirmDialog();
 *
 * // Later in your component:
 * const handleDelete = () => {
 *   openConfirmDialog({
 *     title: 'Confirm Deletion',
 *     message: 'Are you sure you want to delete this item?',
 *     confirmText: 'Delete',
 *     confirmVariant: 'danger',
 *     onConfirm: async () => {
 *       await deleteItem(id);
 *     }
 *   });
 * };
 */
export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within a ConfirmDialogProvider",
    );
  }

  return context;
};

export default ConfirmDialogProvider;
