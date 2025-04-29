import React, { ComponentType, useState } from "react";
import { Skeleton } from "./Skeleton";
import { toast } from "../../utils/toast";
import { useLanguage } from "../../store/LanguageContext";

// Define withLoadingAsync function type
export type WithLoadingAsyncFn = <T extends any>(
  asyncFn: () => Promise<T>,
  options?: {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    successMessage?: { en: string; fr: string };
    errorMessage?: { en: string; fr: string };
    showToast?: boolean;
  },
) => Promise<T | undefined>;

// Types for the HOC props and wrapped component
export interface WithLoadingProps {
  isLoading?: boolean;
  error?: Error | null;
  withLoadingAsync?: WithLoadingAsyncFn;
}

interface LoadingText {
  loading: { en: string; fr: string };
  error: { en: string; fr: string };
  success: { en: string; fr: string };
}

const defaultLoadingText: LoadingText = {
  loading: { en: "Loading...", fr: "Chargement..." },
  error: { en: "An error occurred", fr: "Une erreur est survenue" },
  success: {
    en: "Operation completed successfully",
    fr: "Opération terminée avec succès",
  },
};

export function withLoading<P extends object>(
  WrappedComponent: ComponentType<P & WithLoadingProps>,
  options?: {
    loadingComponent?: React.ReactNode;
    showToast?: boolean;
    loadingText?: Partial<LoadingText>;
  },
) {
  // Create the enhanced component
  const WithLoadingComponent = (props: P & WithLoadingProps) => {
    const { t } = useLanguage();
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState<Error | null>(null);

    const isLoading = props.isLoading || localLoading;
    const error = props.error || localError;
    const text = { ...defaultLoadingText, ...options?.loadingText };

    // Create wrapped async handler
    const withLoadingAsync: WithLoadingAsyncFn = async <T extends any>(
      asyncFn: () => Promise<T>,
      {
        onSuccess,
        onError,
        successMessage,
        errorMessage,
        showToast = options?.showToast ?? true,
      }: {
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        successMessage?: { en: string; fr: string };
        errorMessage?: { en: string; fr: string };
        showToast?: boolean;
      } = {},
    ): Promise<T | undefined> => {
      try {
        setLocalLoading(true);
        const result = await asyncFn();
        setLocalLoading(false);

        if (showToast) {
          toast.success(t(successMessage || text.success));
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setLocalError(error);
        setLocalLoading(false);

        if (showToast) {
          toast.error(t(errorMessage || text.error));
        }

        onError?.(error);
        console.error("Operation failed:", error);
        return undefined;
      }
    };

    // Render loading state or component
    if (isLoading && options?.loadingComponent) {
      return <>{options.loadingComponent}</>;
    }

    // Render skeleton fallback if loading and no custom component provided
    if (isLoading) {
      return (
        <div className="space-y-2 w-full" aria-busy="true" aria-live="polite">
          <p className="sr-only">{t(text.loading)}</p>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      );
    }

    // Pass the withLoadingAsync helper to the wrapped component
    return (
      <WrappedComponent
        {...props}
        isLoading={isLoading}
        error={error}
        withLoadingAsync={withLoadingAsync}
      />
    );
  };

  // Set display name for debugging
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";
  WithLoadingComponent.displayName = `withLoading(${displayName})`;

  return WithLoadingComponent;
}

// Skeleton component for specific admin components
export const AdminSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = "",
}) => {
  return (
    <div
      className={`space-y-4 animate-pulse ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="sr-only">Loading content...</div>
      <Skeleton className="h-10 w-full mb-6" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
};
