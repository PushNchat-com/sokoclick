import React, { useState } from "react";
import { useLanguage } from "../../store/LanguageContext";

// Define a type for translation objects
type TranslationObject = {
  en: string;
  fr: string;
};

interface TooltipProps {
  content: string | TranslationObject;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay = 300,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { language } = useLanguage();

  // Get the content based on current language if it's a translation object
  const getContent = () => {
    if (typeof content === "string") {
      return content;
    }
    return language === "en" ? content.en : content.fr;
  };

  const showTooltip = () => {
    const id = setTimeout(() => {
      setVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setVisible(false);
  };

  // Calculate position classes based on the position prop
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-1";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-1";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {visible && (
        <div
          className={`
            absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-md 
            max-w-xs whitespace-normal break-words pointer-events-none
            ${getPositionClasses()}
            ${className}
          `}
          role="tooltip"
        >
          {getContent()}
          {/* Triangle pointer */}
          <div
            className={`
              absolute w-0 h-0 border-4 border-transparent
              ${position === "top" ? "border-t-gray-800 top-full left-1/2 -ml-1" : ""}
              ${position === "bottom" ? "border-b-gray-800 bottom-full left-1/2 -ml-1" : ""}
              ${position === "left" ? "border-l-gray-800 left-full top-1/2 -mt-1" : ""}
              ${position === "right" ? "border-r-gray-800 right-full top-1/2 -mt-1" : ""}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
