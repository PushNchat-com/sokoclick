import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GuidedTour, TourStep } from "./GuidedTour";

// Mock hooks
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

describe("GuidedTour Component", () => {
  const mockSteps: TourStep[] = [
    {
      target: ".test-target-1",
      title: "Step 1",
      content: "This is the first step",
      placement: "bottom",
    },
    {
      target: ".test-target-2",
      title: "Step 2",
      content: "This is the second step",
      placement: "right",
    },
  ];

  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  // Create test target elements
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="test-target-1">Target 1</div>
      <div class="test-target-2">Target 2</div>
    `;
  });

  it("renders the tour when autoStart is true", () => {
    render(
      <GuidedTour
        tourId="test-tour"
        steps={mockSteps}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
        autoStart={true}
      />,
    );

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("This is the first step")).toBeInTheDocument();
  });

  it("does not render the tour when autoStart is false", () => {
    render(
      <GuidedTour
        tourId="test-tour"
        steps={mockSteps}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
        autoStart={false}
      />,
    );

    expect(screen.queryByText("Step 1")).not.toBeInTheDocument();
  });

  it("allows navigation to the next step", () => {
    render(
      <GuidedTour
        tourId="test-tour"
        steps={mockSteps}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
        autoStart={true}
      />,
    );

    // First step is displayed
    expect(screen.getByText("Step 1")).toBeInTheDocument();

    // Click next button
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // Second step should now be displayed
    expect(screen.getByText("Step 2")).toBeInTheDocument();
  });

  it("completes the tour when finishing the last step", () => {
    render(
      <GuidedTour
        tourId="test-tour"
        steps={mockSteps}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
        autoStart={true}
      />,
    );

    // Navigate to the last step
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // Click finish on the last step
    const finishButton = screen.getByText("Finish");
    fireEvent.click(finishButton);

    // Check if onComplete was called
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it("allows user to skip the tour", () => {
    render(
      <GuidedTour
        tourId="test-tour"
        steps={mockSteps}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
        autoStart={true}
      />,
    );

    // Find and click the skip button
    const skipButton = screen.getByText("Skip");
    fireEvent.click(skipButton);

    // Check if onSkip was called
    expect(mockOnSkip).toHaveBeenCalled();
  });

  it("allows going back to previous step", () => {
    render(
      <GuidedTour
        tourId="test-tour"
        steps={mockSteps}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
        autoStart={true}
      />,
    );

    // Navigate to the second step
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // Verify we're on the second step
    expect(screen.getByText("Step 2")).toBeInTheDocument();

    // Go back to the first step
    const backButton = screen.getByText("Back");
    fireEvent.click(backButton);

    // Verify we're back on the first step
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });
});
