import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ImageUploadStep from "./ImageUploadStep";
import { LanguageProvider } from "../../../store/LanguageContext";
import * as useImageUploadHook from "../../../hooks/useImageUpload";

// Mock the useImageUpload hook
jest.mock("../../../hooks/useImageUpload", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("ImageUploadStep", () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    images: [],
    onChange: mockOnChange,
    errors: {},
    productId: "test-product-id",
    isSaving: false,
  };

  // Mock successful upload
  const mockSuccessUpload = () => {
    jest.spyOn(useImageUploadHook, "default").mockImplementation(() => ({
      uploadImage: jest.fn().mockResolvedValue({
        success: true,
        url: "https://example.com/image.jpg",
      }),
      uploadProgress: {},
    }));
  };

  // Mock failed upload
  const mockFailedUpload = () => {
    jest.spyOn(useImageUploadHook, "default").mockImplementation(() => ({
      uploadImage: jest.fn().mockResolvedValue({
        success: false,
        error: "Upload failed",
      }),
      uploadProgress: {},
    }));
  };

  beforeEach(() => {
    mockSuccessUpload();
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(
      <LanguageProvider>
        <ImageUploadStep {...defaultProps} />
      </LanguageProvider>,
    );

    expect(screen.getByText(/Product Images/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload up to 5 images/i)).toBeInTheDocument();
  });

  it("displays error message when provided", () => {
    render(
      <LanguageProvider>
        <ImageUploadStep
          {...defaultProps}
          errors={{ images: "Error uploading images" }}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText("Error uploading images")).toBeInTheDocument();
  });

  it("calls onChange with updated images on successful upload", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });

    render(
      <LanguageProvider>
        <ImageUploadStep {...defaultProps} />
      </LanguageProvider>,
    );

    // Simulate file upload
    const fileInput = screen.getByLabelText(/upload/i);

    Object.defineProperty(fileInput, "files", {
      value: [mockFile],
    });

    fireEvent.change(fileInput);

    // Initial update with local preview
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    // Update with progress = 0
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ progress: 0 })]),
    );

    // Final update with URL and progress = 100
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            url: "https://example.com/image.jpg",
            progress: 100,
          }),
        ]),
      );
    });
  });

  it("handles upload errors correctly", async () => {
    mockFailedUpload();

    const mockFile = new File(["test"], "test.png", { type: "image/png" });

    render(
      <LanguageProvider>
        <ImageUploadStep {...defaultProps} />
      </LanguageProvider>,
    );

    // Simulate file upload
    const fileInput = screen.getByLabelText(/upload/i);

    Object.defineProperty(fileInput, "files", {
      value: [mockFile],
    });

    fireEvent.change(fileInput);

    // Check that error is set
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            error: "Upload failed",
            progress: 0,
          }),
        ]),
      );
    });
  });

  it("disables the upload when isSaving is true", () => {
    render(
      <LanguageProvider>
        <ImageUploadStep {...defaultProps} isSaving={true} />
      </LanguageProvider>,
    );

    const fileInput = screen.getByLabelText(/upload/i);
    expect(fileInput).toBeDisabled();
  });
});
