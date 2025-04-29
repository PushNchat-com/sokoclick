import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useTourPreferences } from "../../hooks/useTourPreferences";

// Types for tour steps
export interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: "top" | "right" | "bottom" | "left";
  spotlightRadius?: number;
  disableOverlay?: boolean;
}

// Props for the GuidedTour component
export interface GuidedTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  className?: string;
}

/**
 * GuidedTour component for onboarding users with step-by-step tutorials
 */
export const GuidedTour: React.FC<GuidedTourProps> = ({
  tourId,
  steps,
  onComplete,
  onSkip,
  autoStart = false,
  className = "",
}) => {
  const [isActive, setIsActive] = useState(autoStart);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const tooltipRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const { isTourCompleted, markTourCompleted, hideAllTours } =
    useTourPreferences();

  // Calculate position of tooltip based on target element and placement
  const calculatePosition = useCallback(() => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const target = document.querySelector(currentStep.target) as HTMLElement;
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width || 300;
    const tooltipHeight = tooltipRect?.height || 150;
    const placement = currentStep.placement || "bottom";

    // Update spotlight position
    if (spotlightRef.current) {
      spotlightRef.current.style.top = `${targetRect.top + window.scrollY}px`;
      spotlightRef.current.style.left = `${targetRect.left + window.scrollX}px`;
      spotlightRef.current.style.width = `${targetRect.width}px`;
      spotlightRef.current.style.height = `${targetRect.height}px`;
      spotlightRef.current.style.borderRadius = `${currentStep.spotlightRadius || 4}px`;
    }

    // Calculate tooltip position based on placement
    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = targetRect.top + window.scrollY - tooltipHeight - 10;
        left =
          targetRect.left +
          window.scrollX +
          targetRect.width / 2 -
          tooltipWidth / 2;
        break;
      case "right":
        top =
          targetRect.top +
          window.scrollY +
          targetRect.height / 2 -
          tooltipHeight / 2;
        left = targetRect.right + window.scrollX + 10;
        break;
      case "bottom":
        top = targetRect.bottom + window.scrollY + 10;
        left =
          targetRect.left +
          window.scrollX +
          targetRect.width / 2 -
          tooltipWidth / 2;
        break;
      case "left":
        top =
          targetRect.top +
          window.scrollY +
          targetRect.height / 2 -
          tooltipHeight / 2;
        left = targetRect.left + window.scrollX - tooltipWidth - 10;
        break;
    }

    // Make sure tooltip stays within viewport
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipHeight > window.innerHeight - 10) {
      top = window.innerHeight - tooltipHeight - 10;
    }

    setTooltipPosition({ top, left });

    // Scroll target into view if needed
    const isInViewport =
      targetRect.top >= 0 &&
      targetRect.left >= 0 &&
      targetRect.bottom <= window.innerHeight &&
      targetRect.right <= window.innerWidth;

    if (!isInViewport) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentStepIndex, steps]);

  // Check if tour is already completed
  useEffect(() => {
    if (isTourCompleted(tourId) || hideAllTours) {
      setIsActive(false);
    }
  }, [tourId, isTourCompleted, hideAllTours]);

  // Recalculate position when step changes or window resizes
  useEffect(() => {
    if (!isActive) return;

    calculatePosition();

    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, currentStepIndex, calculatePosition]);

  // Handle tour navigation
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    if (onSkip) onSkip();
  };

  const completeTour = () => {
    setIsActive(false);
    markTourCompleted(tourId);
    if (onComplete) onComplete();
  };

  // Start tour programmatically
  const startTour = () => {
    if (!isTourCompleted(tourId) && !hideAllTours) {
      setCurrentStepIndex(0);
      setIsActive(true);
    }
  };

  // Export startTour method
  React.useImperativeHandle(
    React.forwardRef((props, ref) => ref),
    () => ({
      startTour,
    }),
  );

  if (!isActive || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      {!currentStep.disableOverlay &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-50">
            {/* Spotlight */}
            <div
              ref={spotlightRef}
              className="absolute box-content bg-transparent -m-2 border-2 border-primary z-10 pointer-events-none"
              style={{ boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)" }}
            />
          </div>,
          document.body,
        )}

      {/* Tooltip */}
      {createPortal(
        <div
          ref={tooltipRef}
          className={`fixed z-[60] w-[300px] p-4 bg-white shadow-lg rounded-md ${className}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{currentStep.title}</h3>
            <button
              onClick={skipTour}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Close tour"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="mb-4">{currentStep.content}</div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  className="p-1 rounded hover:bg-gray-100 flex items-center gap-1"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}

              {!isLastStep ? (
                <button
                  onClick={nextStep}
                  className="bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 flex items-center gap-1"
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={completeTour}
                  className="bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 flex items-center gap-1"
                >
                  Finish <Check size={16} />
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

// Hook to use with GuidedTour
export const useGuidedTour = (tourId: string) => {
  const tourRef = useRef<{ startTour: () => void }>(null);
  const { isTourCompleted, resetTour } = useTourPreferences();

  return {
    startTour: () => tourRef.current?.startTour(),
    tourRef,
    isTourCompleted: () => isTourCompleted(tourId),
    resetTour: () => resetTour(tourId),
  };
};
