import React from "react";
import { Toaster as HotToaster } from "react-hot-toast";

/**
 * Toast container component for use in the app
 */
const Toaster: React.FC = () => {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        success: {
          duration: 3000,
          className: "toast-success",
        },
        error: {
          duration: 5000,
          className: "toast-error",
        },
      }}
    />
  );
};

export default Toaster;
