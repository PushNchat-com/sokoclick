import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Circle, HelpCircle } from "lucide-react";

export interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: "top" | "right" | "bottom" | "left" | "auto";
  spotlightPadding?: number;
  disableOverlay?: boolean;
  disableScrolling?: boolean;
  offset?: number;
  action?: () => void; // Action to perform when reaching this step
  condition?: () => boolean; // Condition that must be true to show this step
}

export interface TourConfig {
  id: string;
  name: string;
  steps: TourStep[];
  showProgress?: boolean;
  showSkip?: boolean;
  showClose?: boolean;
  allowClose?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  stepDelay?: number; // Milliseconds to wait before showing next step
  highlightClass?: string;
  zIndex?: number;
  keyboard?: boolean; // Enable keyboard navigation
  scrollOffset?: number;
}

const HIGHLIGHT_CLASS = "tour-highlight";
const SPOTLIGHT_CLASS = "tour-spotlight";
const OVERLAY_CLASS = "tour-overlay";

export const FeatureTour: React.FC<{
  tour: TourConfig;
  onComplete?: () => void;
  onSkip?: () => void;
  isOpen?: boolean;
}> = ({ tour, onComplete, onSkip, isOpen = false }) => {
  const [isVisible, setIsVisible] = useState(isOpen || tour.autoStart);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [popperStyles, setPopperStyles] = useState<{
    top: string;
    left: string;
    transform: string;
    arrowPosition: string;
  }>({
    top: "0px",
    left: "0px",
    transform: "translate(0, 0)",
    arrowPosition: "bottom",
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Track whether we've shown this tour before
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;

    // Check if this tour has been completed before
    const completedTours = JSON.parse(
      localStorage.getItem("completedTours") || "{}",
    );
    if (completedTours[tour.id]) {
      setIsVisible(false);
      return;
    }

    findTargetAndPosition();

    // Handle keyboard navigation
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!tour.keyboard) return;

      switch (e.key) {
        case "Escape":
          if (tour.allowClose !== false) {
            handleClose();
          }
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
      }
    };

    if (tour.keyboard !== false) {
      window.addEventListener("keydown", handleKeyboard);
    }

    // Clean up
    return () => {
      if (tour.keyboard !== false) {
        window.removeEventListener("keydown", handleKeyboard);
      }
    };
  }, [isVisible, currentStep, tour.id]);

  // Recalculate position on resize or scroll
  useEffect(() => {
    if (!isVisible) return;

    const handleResize = () => {
      findTargetAndPosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isVisible, targetElement, currentStep]);

  const findTargetAndPosition = () => {
    const step = tour.steps[currentStep];
    if (!step) return;

    // Check condition if present
    if (step.condition && !step.condition()) {
      // Skip this step if condition is not met
      if (currentStep < tour.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
      return;
    }

    // If this step has an action, perform it
    if (step.action) {
      step.action();
    }

    // Find the target element
    const target = document.querySelector(step.target);
    setTargetElement(target);

    if (!target) {
      console.warn(`Tour target not found: ${step.target}`);
      return;
    }

    // Scroll the element into view if needed
    const scrollOffset = tour.scrollOffset || 0;
    const rect = target.getBoundingClientRect();
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth);

    if (!isInViewport && !step.disableScrolling) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Reposition after scrolling
      setTimeout(() => {
        positionTooltip(target, step);
      }, 300);
    } else {
      positionTooltip(target, step);
    }

    // Add highlight class to target
    target.classList.add(HIGHLIGHT_CLASS);
    if (tour.highlightClass) {
      target.classList.add(tour.highlightClass);
    }

    return () => {
      if (target) {
        target.classList.remove(HIGHLIGHT_CLASS);
        if (tour.highlightClass) {
          target.classList.remove(tour.highlightClass);
        }
      }
    };
  };

  const positionTooltip = (target: Element, step: TourStep) => {
    const targetRect = target.getBoundingClientRect();
    const placement = step.placement || "auto";
    const offset = step.offset || 10;

    let top = 0;
    let left = 0;
    let arrowPosition = "bottom";

    // Calculate tooltip position based on placement
    switch (placement) {
      case "top":
        top = targetRect.top - (tooltipRef.current?.offsetHeight || 0) - offset;
        left =
          targetRect.left +
          targetRect.width / 2 -
          (tooltipRef.current?.offsetWidth || 0) / 2;
        arrowPosition = "bottom";
        break;
      case "right":
        top =
          targetRect.top +
          targetRect.height / 2 -
          (tooltipRef.current?.offsetHeight || 0) / 2;
        left = targetRect.right + offset;
        arrowPosition = "left";
        break;
      case "bottom":
        top = targetRect.bottom + offset;
        left =
          targetRect.left +
          targetRect.width / 2 -
          (tooltipRef.current?.offsetWidth || 0) / 2;
        arrowPosition = "top";
        break;
      case "left":
        top =
          targetRect.top +
          targetRect.height / 2 -
          (tooltipRef.current?.offsetHeight || 0) / 2;
        left =
          targetRect.left - (tooltipRef.current?.offsetWidth || 0) - offset;
        arrowPosition = "right";
        break;
      case "auto":
      default:
        // Determine best placement
        const spaceTop = targetRect.top;
        const spaceRight = window.innerWidth - targetRect.right;
        const spaceBottom = window.innerHeight - targetRect.bottom;
        const spaceLeft = targetRect.left;

        const maxSpace = Math.max(spaceTop, spaceRight, spaceBottom, spaceLeft);

        if (maxSpace === spaceTop) {
          top =
            targetRect.top - (tooltipRef.current?.offsetHeight || 0) - offset;
          left =
            targetRect.left +
            targetRect.width / 2 -
            (tooltipRef.current?.offsetWidth || 0) / 2;
          arrowPosition = "bottom";
        } else if (maxSpace === spaceRight) {
          top =
            targetRect.top +
            targetRect.height / 2 -
            (tooltipRef.current?.offsetHeight || 0) / 2;
          left = targetRect.right + offset;
          arrowPosition = "left";
        } else if (maxSpace === spaceBottom) {
          top = targetRect.bottom + offset;
          left =
            targetRect.left +
            targetRect.width / 2 -
            (tooltipRef.current?.offsetWidth || 0) / 2;
          arrowPosition = "top";
        } else {
          top =
            targetRect.top +
            targetRect.height / 2 -
            (tooltipRef.current?.offsetHeight || 0) / 2;
          left =
            targetRect.left - (tooltipRef.current?.offsetWidth || 0) - offset;
          arrowPosition = "right";
        }
        break;
    }

    // Constrain to viewport
    const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 0;

    if (left < 20) left = 20;
    if (left + tooltipWidth > window.innerWidth - 20)
      left = window.innerWidth - tooltipWidth - 20;
    if (top < 20) top = 20;
    if (top + tooltipHeight > window.innerHeight - 20)
      top = window.innerHeight - tooltipHeight - 20;

    setPopperStyles({
      top: `${top}px`,
      left: `${left}px`,
      transform: "translate(0, 0)",
      arrowPosition,
    });

    // Update the spotlight if overlay is used
    if (!step.disableOverlay && overlayRef.current) {
      updateSpotlight(target, step.spotlightPadding || 10);
    }
  };

  const updateSpotlight = (target: Element, padding: number) => {
    if (!overlayRef.current) return;

    const targetRect = target.getBoundingClientRect();
    const spotlight = document.createElement("div");
    spotlight.className = SPOTLIGHT_CLASS;

    // Position and size the spotlight
    spotlight.style.position = "absolute";
    spotlight.style.top = `${targetRect.top - padding}px`;
    spotlight.style.left = `${targetRect.left - padding}px`;
    spotlight.style.width = `${targetRect.width + padding * 2}px`;
    spotlight.style.height = `${targetRect.height + padding * 2}px`;
    spotlight.style.borderRadius = "4px";

    // Remove existing spotlights
    const existingSpotlight = overlayRef.current.querySelector(
      `.${SPOTLIGHT_CLASS}`,
    );
    if (existingSpotlight) {
      overlayRef.current.removeChild(existingSpotlight);
    }

    overlayRef.current.appendChild(spotlight);
  };

  const handleNext = () => {
    if (currentStep < tour.steps.length - 1) {
      // Clean up previous step
      if (targetElement) {
        targetElement.classList.remove(HIGHLIGHT_CLASS);
        if (tour.highlightClass) {
          targetElement.classList.remove(tour.highlightClass);
        }
      }

      if (tour.stepDelay) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, tour.stepDelay);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Clean up current step
      if (targetElement) {
        targetElement.classList.remove(HIGHLIGHT_CLASS);
        if (tour.highlightClass) {
          targetElement.classList.remove(tour.highlightClass);
        }
      }

      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Clean up
    setIsVisible(false);

    if (targetElement) {
      targetElement.classList.remove(HIGHLIGHT_CLASS);
      if (tour.highlightClass) {
        targetElement.classList.remove(tour.highlightClass);
      }
    }

    // Mark as completed
    const completedTours = JSON.parse(
      localStorage.getItem("completedTours") || "{}",
    );
    completedTours[tour.id] = Date.now();
    localStorage.setItem("completedTours", JSON.stringify(completedTours));

    if (onComplete || tour.onComplete) {
      (onComplete || tour.onComplete)?.();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);

    // Clean up
    if (targetElement) {
      targetElement.classList.remove(HIGHLIGHT_CLASS);
      if (tour.highlightClass) {
        targetElement.classList.remove(tour.highlightClass);
      }
    }

    if (onSkip || tour.onSkip) {
      (onSkip || tour.onSkip)?.();
    }
  };

  const handleClose = () => {
    setIsVisible(false);

    // Clean up
    if (targetElement) {
      targetElement.classList.remove(HIGHLIGHT_CLASS);
      if (tour.highlightClass) {
        targetElement.classList.remove(tour.highlightClass);
      }
    }
  };

  if (!isVisible) return null;

  const step = tour.steps[currentStep];
  if (!step) return null;

  return createPortal(
    <>
      {!step.disableOverlay && (
        <div
          ref={overlayRef}
          className={OVERLAY_CLASS}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: (tour.zIndex || 1000) - 1,
            pointerEvents: "all",
          }}
          onClick={tour.allowClose !== false ? handleClose : undefined}
        />
      )}

      <div
        ref={tooltipRef}
        className="tour-tooltip bg-white rounded-lg shadow-lg p-4 max-w-xs z-[1001] absolute"
        style={{
          position: "fixed",
          top: popperStyles.top,
          left: popperStyles.left,
          transform: popperStyles.transform,
          zIndex: tour.zIndex || 1000,
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-lg">{step.title}</h4>
          {tour.showClose !== false && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close tour"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">{step.content}</p>
        </div>

        <div className="flex items-center justify-between">
          {tour.showProgress !== false && (
            <div className="flex items-center gap-1">
              {tour.steps.map((_, index) => (
                <Circle
                  key={index}
                  size={8}
                  className={`${index === currentStep ? "fill-blue-500 text-blue-500" : "text-gray-300"}`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {tour.showSkip !== false && currentStep === 0 && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
            )}

            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="text-sm">Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              {currentStep < tour.steps.length - 1 ? (
                <>
                  <span>Next</span>
                  <ChevronRight size={16} />
                </>
              ) : (
                "Finish"
              )}
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div
          className="tour-arrow absolute w-3 h-3 bg-white transform rotate-45"
          style={{
            [popperStyles.arrowPosition]: "-6px",
            ...(popperStyles.arrowPosition === "top" ||
            popperStyles.arrowPosition === "bottom"
              ? { left: "calc(50% - 6px)" }
              : { top: "calc(50% - 6px)" }),
          }}
        />
      </div>
    </>,
    document.body,
  );
};

// Hook to manage tours
export const useTour = () => {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [tourVisible, setTourVisible] = useState(false);

  // Start a tour
  const startTour = (tour: TourConfig) => {
    setActiveTour(tour);
    setTourVisible(true);
  };

  // Reset a tour so it can be shown again
  const resetTour = (tourId: string) => {
    const completedTours = JSON.parse(
      localStorage.getItem("completedTours") || "{}",
    );
    delete completedTours[tourId];
    localStorage.setItem("completedTours", JSON.stringify(completedTours));
  };

  // Check if a tour has been completed
  const isTourCompleted = (tourId: string) => {
    const completedTours = JSON.parse(
      localStorage.getItem("completedTours") || "{}",
    );
    return !!completedTours[tourId];
  };

  // Handle tour completion
  const handleTourComplete = () => {
    setTourVisible(false);
    setTimeout(() => setActiveTour(null), 300);
  };

  // Handle tour skip
  const handleTourSkip = () => {
    setTourVisible(false);
    setTimeout(() => setActiveTour(null), 300);
  };

  return {
    startTour,
    resetTour,
    isTourCompleted,
    TourDisplay: () =>
      activeTour ? (
        <FeatureTour
          tour={activeTour}
          isOpen={tourVisible}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      ) : null,
  };
};

// Add some default styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .${HIGHLIGHT_CLASS} {
      z-index: 1000;
      position: relative;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
      border-radius: 4px;
    }
    
    .${OVERLAY_CLASS} .${SPOTLIGHT_CLASS} {
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    }
  `;
  document.head.appendChild(styleElement);
}

export default FeatureTour;
