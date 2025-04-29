import React, { useState, useEffect } from "react";
import { X, ThumbsUp, ThumbsDown, Send, Smile, Meh, Frown } from "lucide-react";

export interface FeedbackQuestion {
  id: string;
  type: "rating" | "text" | "binary" | "emoji";
  question: string;
  required?: boolean;
}

export interface FeedbackSurveyConfig {
  id: string;
  title: string;
  description?: string;
  questions: FeedbackQuestion[];
  trigger: "action" | "time" | "manual";
  triggerValue?: string; // action name, time in seconds, etc.
  dismissible?: boolean;
  theme?: "light" | "dark" | "system";
  position?:
    | "bottom-right"
    | "bottom-left"
    | "bottom-center"
    | "top-right"
    | "top-left"
    | "top-center"
    | "center";
  showOnce?: boolean;
  delay?: number; // in milliseconds
  maxDisplayTime?: number; // in milliseconds, 0 means indefinite
}

interface FeedbackResponse {
  surveyId: string;
  responses: Record<string, any>;
  metadata: {
    timestamp: number;
    userAgent: string;
    path: string;
    sessionId?: string;
  };
}

interface FeedbackCollectorProps {
  survey: FeedbackSurveyConfig;
  onSubmit?: (response: FeedbackResponse) => void;
  onDismiss?: () => void;
  className?: string;
  isOpen?: boolean;
}

const getPositionClasses = (position: string) => {
  switch (position) {
    case "bottom-right":
      return "bottom-4 right-4";
    case "bottom-left":
      return "bottom-4 left-4";
    case "bottom-center":
      return "bottom-4 left-1/2 transform -translate-x-1/2";
    case "top-right":
      return "top-4 right-4";
    case "top-left":
      return "top-4 left-4";
    case "top-center":
      return "top-4 left-1/2 transform -translate-x-1/2";
    case "center":
      return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
    default:
      return "bottom-4 right-4";
  }
};

const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
  survey,
  onSubmit,
  onDismiss,
  className = "",
  isOpen = false,
}) => {
  const [visible, setVisible] = useState(isOpen);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (visible && survey.delay) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, survey.delay);
      return () => clearTimeout(timer);
    }
  }, [visible, survey.delay]);

  useEffect(() => {
    if (visible && survey.maxDisplayTime && survey.maxDisplayTime > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, survey.maxDisplayTime);
      return () => clearTimeout(timer);
    }
  }, [visible, survey.maxDisplayTime]);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    if (
      survey.questions.length > 0 &&
      currentStep < survey.questions.length - 1
    ) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setSubmitting(true);

    const feedbackResponse: FeedbackResponse = {
      surveyId: survey.id,
      responses,
      metadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        path: window.location.pathname,
        sessionId: localStorage.getItem("sessionId") || undefined,
      },
    };

    if (onSubmit) {
      onSubmit(feedbackResponse);
    }

    // Show thank you message
    setShowThankYou(true);
    setTimeout(() => {
      setVisible(false);
      setShowThankYou(false);
      setSubmitting(false);
      setCurrentStep(0);
      setResponses({});
    }, 2000);
  };

  const canProceed = () => {
    const currentQuestion = survey.questions[currentStep];
    if (!currentQuestion.required) return true;
    return responses[currentQuestion.id] !== undefined;
  };

  const renderQuestion = (question: FeedbackQuestion) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {question.question}
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleResponseChange(question.id, rating)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    responses[question.id] === rating
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  aria-label={`Rate ${rating} out of 5`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        );
      case "binary":
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {question.question}
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => handleResponseChange(question.id, true)}
                className={`px-4 py-2 rounded flex items-center transition-colors ${
                  responses[question.id] === true
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <ThumbsUp size={16} className="mr-2" />
                Yes
              </button>
              <button
                onClick={() => handleResponseChange(question.id, false)}
                className={`px-4 py-2 rounded flex items-center transition-colors ${
                  responses[question.id] === false
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <ThumbsDown size={16} className="mr-2" />
                No
              </button>
            </div>
          </div>
        );
      case "emoji":
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {question.question}
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => handleResponseChange(question.id, "positive")}
                className={`p-3 rounded-full transition-colors ${
                  responses[question.id] === "positive"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                aria-label="Positive feedback"
              >
                <Smile size={24} />
              </button>
              <button
                onClick={() => handleResponseChange(question.id, "neutral")}
                className={`p-3 rounded-full transition-colors ${
                  responses[question.id] === "neutral"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                aria-label="Neutral feedback"
              >
                <Meh size={24} />
              </button>
              <button
                onClick={() => handleResponseChange(question.id, "negative")}
                className={`p-3 rounded-full transition-colors ${
                  responses[question.id] === "negative"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                aria-label="Negative feedback"
              >
                <Frown size={24} />
              </button>
            </div>
          </div>
        );
      case "text":
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {question.question}
            </label>
            <textarea
              value={responses[question.id] || ""}
              onChange={(e) =>
                handleResponseChange(question.id, e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Type your feedback here..."
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!visible) return null;

  const positionClasses = getPositionClasses(survey.position || "bottom-right");

  return (
    <div
      className={`fixed ${positionClasses} z-50 max-w-md w-full ${className}`}
      role="dialog"
      aria-labelledby="feedback-title"
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-500 p-4 flex items-start justify-between">
          <h3 id="feedback-title" className="text-white font-medium">
            {survey.title}
          </h3>
          {survey.dismissible !== false && (
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close feedback"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-4">
          {showThankYou ? (
            <div className="text-center py-8">
              <ThumbsUp className="mx-auto mb-3 text-green-500" size={32} />
              <p className="text-lg font-medium text-gray-800">
                Thank you for your feedback!
              </p>
            </div>
          ) : (
            <>
              {survey.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {survey.description}
                </p>
              )}

              {renderQuestion(survey.questions[currentStep])}

              <div className="flex justify-end mt-4">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="px-4 py-2 mr-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  >
                    Back
                  </button>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className={`px-4 py-2 rounded flex items-center focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${
                    canProceed() && !submitting
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-blue-300 text-white cursor-not-allowed"
                  }`}
                >
                  {currentStep < survey.questions.length - 1 ? (
                    "Next"
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Submit
                    </>
                  )}
                </button>
              </div>

              {survey.questions.length > 1 && (
                <div className="flex justify-center mt-4">
                  {Array.from({ length: survey.questions.length }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full mx-1 ${
                          i === currentStep ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      />
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook to manage feedback surveys
export const useFeedback = () => {
  const [activeSurvey, setActiveSurvey] = useState<FeedbackSurveyConfig | null>(
    null,
  );
  const [surveyVisible, setSurveyVisible] = useState(false);

  const triggerSurvey = (survey: FeedbackSurveyConfig) => {
    // Check if this survey should only be shown once
    if (survey.showOnce) {
      const shownSurveys = JSON.parse(
        localStorage.getItem("shownSurveys") || "{}",
      );
      if (shownSurveys[survey.id]) {
        return;
      }

      // Mark as shown
      shownSurveys[survey.id] = Date.now();
      localStorage.setItem("shownSurveys", JSON.stringify(shownSurveys));
    }

    setActiveSurvey(survey);
    setSurveyVisible(true);
  };

  const handleActionComplete = (actionName: string) => {
    // Check if any surveys should be triggered by this action
    const storedSurveys = JSON.parse(
      localStorage.getItem("pendingSurveys") || "[]",
    ) as FeedbackSurveyConfig[];

    const matchingSurvey = storedSurveys.find(
      (s) => s.trigger === "action" && s.triggerValue === actionName,
    );

    if (matchingSurvey) {
      triggerSurvey(matchingSurvey);
    }
  };

  const closeSurvey = () => {
    setSurveyVisible(false);
    setTimeout(() => setActiveSurvey(null), 300); // Allow for animation
  };

  const handleSubmit = async (response: FeedbackResponse) => {
    // Here you would typically send the feedback to your backend
    try {
      // Example implementation
      // await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(response)
      // });

      console.log("Feedback submitted:", response);
      closeSurvey();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return {
    triggerSurvey,
    handleActionComplete,
    closeSurvey,
    FeedbackDisplay: () =>
      activeSurvey ? (
        <FeedbackCollector
          survey={activeSurvey}
          isOpen={surveyVisible}
          onSubmit={handleSubmit}
          onDismiss={closeSurvey}
        />
      ) : null,
  };
};

export default FeedbackCollector;
