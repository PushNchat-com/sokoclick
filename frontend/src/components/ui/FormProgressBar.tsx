import React from "react";
import { useLanguage } from "../../store/LanguageContext";

interface FormProgressBarProps {
  steps: { id: string; name: { en: string; fr: string } }[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
}

const FormProgressBar: React.FC<FormProgressBarProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  const { t } = useLanguage();

  // Find the index of the current step
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="py-4">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          // Determine if the step is completed, current, or upcoming
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = onStepClick && index <= currentIndex;

          return (
            <li
              key={step.id}
              className={`relative flex w-full items-center ${
                index === steps.length - 1
                  ? "justify-end"
                  : index === 0
                    ? "justify-start"
                    : "justify-center"
              } ${isClickable ? "cursor-pointer" : ""}`}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              {/* Draw connecting line except for the first step */}
              {index !== 0 && (
                <div
                  className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 transform ${
                    isCompleted ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
              )}

              {/* Step indicator (circle) */}
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-blue-600 text-white"
                    : isCurrent
                      ? "border-2 border-blue-600 bg-white text-blue-600"
                      : "border-2 border-gray-200 bg-white text-gray-400"
                } z-10`}
              >
                {isCompleted ? (
                  // Checkmark for completed steps
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  // Step number for current and upcoming steps
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </span>

              {/* Step name */}
              <span
                className={`absolute top-10 w-max text-center text-xs font-medium ${
                  isCompleted || isCurrent ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {t(step.name)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default FormProgressBar;
