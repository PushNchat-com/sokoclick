import React, { useState, useEffect, useRef } from "react";
import { X, ArrowRight, Info, HelpCircle, CheckCircle2 } from "lucide-react";

export interface TourStep {
  id: string;
  title: string;
  content: string | React.ReactNode;
  target: string; // CSS selector for the element to highlight
  position?: "top" | "right" | "bottom" | "left" | "center";
  spotlightRadius?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
  onBeforeStep?: () => Promise<boolean> | boolean;
  highlightPadding?: number;
}

export interface GuidedTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  isOpen: boolean;
  onClose: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  showCloseButton?: boolean;
  className?: string;
  backdropClassName?: string;
  spotlightClassName?: string;
  tourName: string; // Used for local storage
  startAt?: number;
  disableInteraction?: boolean;
  disableKeyboardNavigation?: boolean;
  highlightClass?: string;
  zIndex?: number;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  onComplete,
  onSkip,
  isOpen,
  onClose,
  showProgress = true,
  showSkip = true,
  showCloseButton = true,
  className = "",
  backdropClassName = "",
  spotlightClassName = "",
  tourName,
  startAt = 0,
  disableInteraction = false,
  disableKeyboardNavigation = false,
  highlightClass = "guided-tour-highlight",
  zIndex = 9999,
}) => {
  const [currentStep, setCurrentStep] = useState(startAt);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [backdropStyle, setBackdropStyle] = useState<React.CSSProperties>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tourCompletedKey = `guided_tour_${tourName}_completed`;

  useEffect(() => {
    // Check if tour already completed
    const isTourCompleted = localStorage.getItem(tourCompletedKey) === "true";
    if (isTourCompleted && isOpen) {
      onClose();
      return;
    }

    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";

      if (!disableKeyboardNavigation) {
        document.addEventListener("keydown", handleKeyDown);
      }

      // Apply highlight class to the target element
      updateStepPosition();

      // Handle window resize
      window.addEventListener("resize", updateStepPosition);
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";

      if (!disableKeyboardNavigation) {
        document.removeEventListener("keydown", handleKeyDown);
      }

      // Remove highlight class
      const previousElement = document.querySelector(`.${highlightClass}`);
      if (previousElement) {
        previousElement.classList.remove(highlightClass);
      }

      window.removeEventListener("resize", updateStepPosition);
    }

    return () => {
      document.body.style.overflow = "";
      if (!disableKeyboardNavigation) {
        document.removeEventListener("keydown", handleKeyDown);
      }
      window.removeEventListener("resize", updateStepPosition);

      // Cleanup highlight class
      const highlightedElement = document.querySelector(`.${highlightClass}`);
      if (highlightedElement) {
        highlightedElement.classList.remove(highlightClass);
      }
    };
  }, [
    isOpen,
    disableKeyboardNavigation,
    highlightClass,
    onClose,
    tourCompletedKey,
  ]);

  useEffect(() => {
    if (isVisible) {
      updateStepPosition();
    }
  }, [currentStep, isVisible]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisible) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        handleSkip();
        break;
      case "ArrowRight":
      case "Enter":
        e.preventDefault();
        handleNext();
        break;
      case "ArrowLeft":
        e.preventDefault();
        handlePrev();
        break;
    }
  };

  const updateStepPosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    // Clean up previous highlight
    const previousElement = document.querySelector(`.${highlightClass}`);
    if (previousElement) {
      previousElement.classList.remove(highlightClass);
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      // Target not found, center in viewport
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: zIndex + 2,
      });

      setBackdropStyle({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: zIndex,
      });

      setSpotlightStyle({
        display: "none",
      });

      return;
    }

    // Add highlight class to target
    targetElement.classList.add(highlightClass);

    // Calculate positions
    const targetRect = targetElement.getBoundingClientRect();
    const padding = step.highlightPadding || 10;

    // Spotlight style
    setSpotlightStyle({
      position: "fixed",
      top: targetRect.top - padding + "px",
      left: targetRect.left - padding + "px",
      width: targetRect.width + padding * 2 + "px",
      height: targetRect.height + padding * 2 + "px",
      borderRadius: step.spotlightRadius ? `${step.spotlightRadius}px` : "4px",
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
      zIndex: zIndex + 1,
    });

    // Calculate tooltip position
    const position = step.position || "bottom";
    const tooltipWidth = tooltipRef.current?.offsetWidth || 300;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 150;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let transform = "";

    switch (position) {
      case "top":
        top = targetRect.top - tooltipHeight - 15;
        left = targetRect.left + targetRect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + 15;
        transform = "translateY(-50%)";
        break;
      case "bottom":
        top = targetRect.bottom + 15;
        left = targetRect.left + targetRect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - tooltipWidth - 15;
        transform = "translateY(-50%)";
        break;
      case "center":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left + targetRect.width / 2;
        transform = "translate(-50%, -50%)";
        break;
    }

    // Adjust if tooltip goes outside viewport
    if (top < 10) top = 10;
    if (top + tooltipHeight > viewportHeight - 10)
      top = viewportHeight - tooltipHeight - 10;
    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10)
      left = viewportWidth - tooltipWidth - 10;

    setTooltipStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      transform,
      zIndex: zIndex + 2,
    });

    setBackdropStyle({
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "transparent",
      zIndex: zIndex,
    });
  };

  const handleNext = async () => {
    const currentStepObj = steps[currentStep];

    // Execute before step hook if exists
    if (currentStepObj.onBeforeStep) {
      const canProceed = await currentStepObj.onBeforeStep();
      if (!canProceed) return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    handleClose();
  };

  const handleComplete = () => {
    localStorage.setItem(tourCompletedKey, "true");
    if (onComplete) onComplete();
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${backdropClassName}`}
        style={backdropStyle}
        onClick={disableInteraction ? undefined : handleSkip}
        aria-hidden="true"
      />

      {/* Spotlight */}
      <div
        className={`${spotlightClassName}`}
        style={spotlightStyle}
        onClick={disableInteraction ? undefined : (e) => e.stopPropagation()}
        role="presentation"
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`bg-white rounded-lg shadow-xl max-w-sm ${className}`}
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-step-title-${currentStep}`}
      >
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3
            id={`tour-step-title-${currentStep}`}
            className="font-semibold text-lg flex items-center gap-2"
          >
            <Info size={18} className="text-blue-500" />
            {step.title}
          </h3>

          {showCloseButton && (
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Close tour"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="text-gray-600 mb-4">{step.content}</div>

          <div className="flex items-center justify-between mt-4">
            {showProgress && (
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
            )}

            <div className="flex gap-2 ml-auto">
              {showSkip && currentStep < steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Skip
                </button>
              )}

              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-1 transition-colors"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Finish</span>
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Custom hook for managing tours
export const useTour = (tourName: string) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const tourCompletedKey = `guided_tour_${tourName}_completed`;

  const openTour = () => {
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  const resetTour = () => {
    localStorage.removeItem(tourCompletedKey);
  };

  const isTourCompleted = () => {
    return localStorage.getItem(tourCompletedKey) === "true";
  };

  return {
    isTourOpen,
    openTour,
    closeTour,
    resetTour,
    isTourCompleted,
  };
};

// Feature Spotlight Component
export interface FeatureSpotlightProps {
  title: string;
  description: string;
  target: string;
  isOpen: boolean;
  onClose: () => void;
  position?: "top" | "right" | "bottom" | "left";
  showArrow?: boolean;
  showDismiss?: boolean;
  showDontShowAgain?: boolean;
  featureId: string;
  autoClose?: number; // Time in ms
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  title,
  description,
  target,
  isOpen,
  onClose,
  position = "bottom",
  showArrow = true,
  showDismiss = true,
  showDontShowAgain = true,
  featureId,
  autoClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const featureSpotlightKey = `feature_spotlight_${featureId}_dismissed`;

  useEffect(() => {
    const isFeatureDismissed =
      localStorage.getItem(featureSpotlightKey) === "true";
    if (isFeatureDismissed && isOpen) {
      onClose();
      return;
    }

    if (isOpen) {
      setIsVisible(true);
      updatePosition();
      window.addEventListener("resize", updatePosition);

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      window.removeEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, featureId, autoClose, onClose, featureSpotlightKey]);

  const updatePosition = () => {
    const targetElement = document.querySelector(target);
    if (!targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current?.offsetWidth || 250;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 100;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = targetRect.top - tooltipHeight - 10;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + 10;
        break;
      case "bottom":
        top = targetRect.bottom + 10;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - 10;
        break;
    }

    // Adjust if tooltip goes outside viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (top < 10) top = 10;
    if (top + tooltipHeight > viewportHeight - 10)
      top = viewportHeight - tooltipHeight - 10;
    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10)
      left = viewportWidth - tooltipWidth - 10;

    setTooltipStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9000,
      filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
    });
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(featureSpotlightKey, "true");
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={tooltipRef}
      className={`bg-white rounded-lg p-4 max-w-xs transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={tooltipStyle}
      role="tooltip"
    >
      {showArrow && (
        <div
          className="w-4 h-4 bg-white absolute transform"
          style={{
            ...(position === "top"
              ? {
                  bottom: "-8px",
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                }
              : {}),
            ...(position === "right"
              ? {
                  left: "-8px",
                  top: "50%",
                  transform: "translateY(-50%) rotate(45deg)",
                }
              : {}),
            ...(position === "bottom"
              ? {
                  top: "-8px",
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                }
              : {}),
            ...(position === "left"
              ? {
                  right: "-8px",
                  top: "50%",
                  transform: "translateY(-50%) rotate(45deg)",
                }
              : {}),
          }}
        />
      )}

      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-base flex items-center gap-1.5 text-blue-600">
          <HelpCircle size={16} />
          {title}
        </h4>

        {showDismiss && (
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 -mt-1 -mr-1"
            aria-label="Dismiss spotlight"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-1.5">{description}</p>

      {showDontShowAgain && (
        <button
          onClick={handleDontShowAgain}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <span>Don't show again</span>
        </button>
      )}
    </div>
  );
};

// Hook for managing feature spotlights
export const useFeatureSpotlight = () => {
  const [activeSpotlight, setActiveSpotlight] = useState<string | null>(null);

  const showSpotlight = (featureId: string) => {
    const isDismissed =
      localStorage.getItem(`feature_spotlight_${featureId}_dismissed`) ===
      "true";
    if (isDismissed) return false;

    setActiveSpotlight(featureId);
    return true;
  };

  const hideSpotlight = () => {
    setActiveSpotlight(null);
  };

  const resetSpotlight = (featureId: string) => {
    localStorage.removeItem(`feature_spotlight_${featureId}_dismissed`);
  };

  return {
    activeSpotlight,
    showSpotlight,
    hideSpotlight,
    resetSpotlight,
    isActive: (featureId: string) => activeSpotlight === featureId,
  };
};

export default GuidedTour;
