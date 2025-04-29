import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { GuidedTour } from "../../components/ui/GuidedTour";
import { FeatureSpotlight } from "../../components/experience/FeatureSpotlight";
import { FeedbackCollector } from "../../components/experience/FeedbackCollector";
import { ErrorBoundary } from "../../components/experience/ErrorBoundary";

// Add custom matcher
expect.extend(toHaveNoViolations);

// Mock necessary hooks and context providers
vi.mock("../../hooks/useTourPreferences", () => ({
  useTourPreferences: () => ({
    isTourCompleted: () => false,
    markTourCompleted: vi.fn(),
    hideAllTours: false,
  }),
}));

// Mock createPortal to render the portal content directly
vi.mock("react-dom", () => ({
  createPortal: (children: React.ReactNode) => children,
}));

describe("Accessibility Tests", () => {
  // Set up sample test data for components
  const tourSteps = [
    {
      target: ".test-target-1",
      title: "Step 1",
      content: "This is the first step",
      placement: "bottom",
    },
  ];

  const feedbackSurvey = {
    id: "test-survey",
    title: "Feedback Survey",
    description: "Please provide your feedback",
    questions: [
      {
        id: "q1",
        type: "text" as const,
        question: "How was your experience?",
        required: true,
      },
    ],
    trigger: "manual" as const,
    position: "center" as const,
  };

  // Create test elements
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="test-target-1">Target 1</div>
      <div id="search-icon">Search Icon</div>
    `;
  });

  it("GuidedTour has no accessibility violations", async () => {
    const { container } = render(
      <GuidedTour tourId="test-tour" steps={tourSteps} autoStart={true} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("FeatureSpotlight has no accessibility violations", async () => {
    const { container } = render(
      <FeatureSpotlight
        spotlightId="quickSearch"
        autoShow={true}
        delayMs={0}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("FeedbackCollector has no accessibility violations", async () => {
    const { container } = render(
      <FeedbackCollector survey={feedbackSurvey} isOpen={true} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ErrorBoundary has no accessibility violations", async () => {
    const { container } = render(
      <ErrorBoundary showDetails={true}>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
