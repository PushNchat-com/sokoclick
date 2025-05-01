import React, { useState } from "react";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../store/LanguageContext";
import type { UserRole } from "@/types/auth";
import {
  validatePasswordStrength,
  validateAndFormatPhone,
  trackSecurityEvent,
} from "../../utils/securityUtils";
import ResponsiveImage from "../ui/ResponsiveImage";
import logoImage from "../../assets/images/logo.svg";
import { UserRoleEnum } from "@/types/auth";

const Signup: React.FC = () => {
  const { t, language } = useLanguage();
  const { signUp, loading } = useUnifiedAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [validationError, setValidationError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [animationDirection, setAnimationDirection] = useState<
    "forward" | "backward"
  >("forward");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
  }>({
    score: 0,
    feedback: "",
  });

  // Enhanced text content
  const text = {
    title: { en: "Create your account", fr: "Créez votre compte" },
    description: {
      en: "Join SokoClick to start selling",
      fr: "Rejoignez SokoClick pour commencer à vendre",
    },
    firstName: { en: "First name", fr: "Prénom" },
    lastName: { en: "Last name", fr: "Nom" },
    email: { en: "Email address", fr: "Adresse email" },
    phone: {
      en: "Phone number (WhatsApp)",
      fr: "Numéro de téléphone (WhatsApp)",
    },
    password: { en: "Password", fr: "Mot de passe" },
    confirmPassword: {
      en: "Confirm password",
      fr: "Confirmer le mot de passe",
    },
    processing: { en: "Creating account...", fr: "Création du compte..." },
    action: { en: "Sign up", fr: "S'inscrire" },
    continueAction: { en: "Continue", fr: "Continuer" },
    backAction: { en: "Back", fr: "Retour" },
    haveAccount: {
      en: "Already have an account?",
      fr: "Vous avez déjà un compte?",
    },
    loginAction: { en: "Sign in", fr: "Se connecter" },
    step: { en: "Step", fr: "Étape" },
    of: { en: "of", fr: "sur" },
    personalInfo: {
      en: "Personal Information",
      fr: "Informations personnelles",
    },
    accountInfo: { en: "Account Information", fr: "Informations du compte" },
    errors: {
      emailRequired: { en: "Email is required", fr: "L'email est requis" },
      emailInvalid: {
        en: "Please enter a valid email",
        fr: "Veuillez entrer un email valide",
      },
      passwordRequired: {
        en: "Password is required",
        fr: "Le mot de passe est requis",
      },
      passwordLength: {
        en: "Password must be at least 8 characters",
        fr: "Le mot de passe doit comporter au moins 8 caractères",
      },
      passwordsMatch: {
        en: "Passwords do not match",
        fr: "Les mots de passe ne correspondent pas",
      },
      firstNameRequired: {
        en: "First name is required",
        fr: "Le prénom est requis",
      },
      lastNameRequired: {
        en: "Last name is required",
        fr: "Le nom est requis",
      },
      phoneInvalid: {
        en: "Please enter a valid Cameroon phone number",
        fr: "Veuillez entrer un numéro de téléphone camerounais valide",
      },
    },
    success: {
      title: {
        en: "Account created successfully!",
        fr: "Compte créé avec succès!",
      },
      message: {
        en: "Your account has been created. Please check your email to verify your account before signing in.",
        fr: "Votre compte a été créé. Veuillez vérifier votre email pour activer votre compte avant de vous connecter.",
      },
    },
    serverError: {
      en: "An error occurred while creating your account. Please try again.",
      fr: "Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.",
    },
    terms: {
      accept: {
        en: "I accept the Terms and Conditions",
        fr: "J'accepte les Conditions Générales",
      },
      required: {
        en: "You must accept the Terms and Conditions",
        fr: "Vous devez accepter les Conditions Générales",
      },
    },
    passwordStrength: {
      weak: { en: "Weak", fr: "Faible" },
      medium: { en: "Medium", fr: "Moyen" },
      strong: { en: "Strong", fr: "Fort" },
    },
  };

  // Enhanced validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
        return !value.trim() ? t(text.errors.firstNameRequired) : "";
      case "lastName":
        return !value.trim() ? t(text.errors.lastNameRequired) : "";
      case "email":
        if (!value.trim()) return t(text.errors.emailRequired);
        return !/^\S+@\S+\.\S+$/.test(value) ? t(text.errors.emailInvalid) : "";
      case "phone":
        if (!value.trim()) return "";
        {
          const { isValid } = validateAndFormatPhone(value);
          return !isValid ? t(text.errors.phoneInvalid) : "";
        }
      case "password":
        if (!value) return t(text.errors.passwordRequired);
        {
          const result = validatePasswordStrength(value);
          if (!result.isValid) {
            return result.unmetRequirements.map((req) => t(req)).join(", ");
          }
          return "";
        }
      case "confirmPassword":
        return value !== formData.password ? t(text.errors.passwordsMatch) : "";
      default:
        return "";
    }
  };

  // Handle field blur for validation
  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setValidation((prev) => ({ ...prev, [name]: error }));
  };

  const validateStep = (step: number): boolean => {
    setValidationError("");

    let isValid = true;
    const newValidation: Record<string, string> = {};
    const newTouched: Record<string, boolean> = { ...touched };

    if (step === 1) {
      // Mark step 1 fields as touched
      ["firstName", "lastName", "email", "phone"].forEach((field) => {
        newTouched[field] = true;
        const value = formData[field as keyof typeof formData];
        const errorMsg = validateField(field, value);
        newValidation[field] = errorMsg;
        if (errorMsg) isValid = false;
      });
    }

    if (step === 2) {
      // Mark step 2 fields as touched
      ["password", "confirmPassword"].forEach((field) => {
        newTouched[field] = true;
        const value = formData[field as keyof typeof formData];
        const errorMsg = validateField(field, value);
        newValidation[field] = errorMsg;
        if (errorMsg) isValid = false;
      });
    }

    setTouched(newTouched);
    setValidation(newValidation);

    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If field is touched, validate on change
    if (touched[name]) {
      const error = validateField(name, value);
      setValidation((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Format phone number on change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const { formatted } = validateAndFormatPhone(value);
    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));
  };

  // Handle password change with strength check
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      password: value,
    }));

    const result = validatePasswordStrength(value);
    const unmetCount = result.unmetRequirements.length;
    const score = 5 - unmetCount;

    const currentLang = language || "en";

    setPasswordStrength({
      score,
      feedback:
        unmetCount > 0
          ? result.unmetRequirements[0][currentLang] ||
            result.unmetRequirements[0].en
          : "",
    });
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setAnimationDirection("forward");
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setAnimationDirection("backward");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate final step before submission
    if (!validateStep(2)) {
      return;
    }

    // Check if terms are accepted
    if (!acceptedTerms) {
      setValidationError(t(text.terms.required));
      return;
    }

    const { formatted: formattedPhone, isValid: isPhoneValid } = validateAndFormatPhone(formData.phone);

    // Re-validate phone just in case, though step validation should catch it
    if (!isPhoneValid && formData.phone.trim() !== "") {
      setValidationError(t(text.errors.phoneInvalid));
      return;
    }

    try {
      setValidationError(""); // Clear validation error before proceeding

      // Call signUp with additional data in options.data
      const { data, error } = await signUp(formData.email, formData.password, {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formattedPhone || null, // Use formatted phone or null
          role: UserRoleEnum.SELLER, // Use Enum value CORRECTLY
        },
      });

      if (error) {
        // Throw the error to be caught by the catch block
        throw error;
      }

      // Track signup event on success
      await trackSecurityEvent("signup", {
        userId: data?.user?.id, // Safely access user ID
        email: formData.email,
        timestamp: new Date().toISOString(),
      });

      setSignupSuccess(true); // Show success notification

      // Reset form state after successful signup
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
      });
      setValidation({});
      setTouched({});
      setCurrentStep(1); // Go back to first step for visual reset
      setAcceptedTerms(false);
      setPasswordStrength({ score: 0, feedback: "" });

      // Optionally navigate after a delay
      // setTimeout(() => navigate('/login', { state: { registered: true } }), 3000);

    } catch (error) {
      console.error("Signup failed:", error);
      // Ensure we set a string error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      setValidationError(errorMessage || t(text.serverError)); // Set error message state
    }
  };

  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
      <div
        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
      ></div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="text-sm text-gray-500 mb-4">
      {t(text.step)} {currentStep} {t(text.of)} {totalSteps}
    </div>
  );

  const renderSuccessNotification = () => (
    <div className="my-8 p-6 bg-green-50 border border-green-100 rounded-lg text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
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
      </div>
      <h2 className="text-xl font-bold text-green-800 mb-2">
        {t(text.success.title)}
      </h2>
      <p className="text-green-700">{t(text.success.message)}</p>
      <div className="mt-6">
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {t(text.loginAction)} →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <ResponsiveImage
              src={logoImage}
              alt="SokoClick"
              className="h-12 mx-auto"
              width={48}
              height={48}
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {t(text.title)}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{t(text.description)}</p>
        </div>

        {signupSuccess ? (
          renderSuccessNotification()
        ) : (
          <>
            {renderProgressBar()}
            {renderStepIndicator()}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* Error message */}
              {validationError && (
                <div
                  className="text-sm rounded-md bg-red-50 p-4 animate-shake"
                  role="alert"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {validationError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div
                  className={`space-y-4 ${animationDirection === "forward" ? "animate-fadeIn" : "animate-slideFromLeft"}`}
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {t(text.personalInfo)}
                  </h3>

                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t(text.firstName)} *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("firstName")}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        validation.firstName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      }`}
                    />
                    {validation.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {validation.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t(text.lastName)} *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("lastName")}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        validation.lastName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      }`}
                    />
                    {validation.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {validation.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t(text.email)} *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        validation.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      }`}
                    />
                    {validation.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {validation.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t(text.phone)}
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        +237
                      </span>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={() => handleBlur("phone")}
                        className={`flex-1 block w-full rounded-none rounded-r-md shadow-sm ${
                          validation.phone
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        }`}
                      />
                    </div>
                    {validation.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {validation.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Account Information */}
              {currentStep === 2 && (
                <div
                  className={`space-y-4 ${animationDirection === "backward" ? "animate-slideFromRight" : "animate-fadeIn"}`}
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {t(text.accountInfo)}
                  </h3>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t(text.password)} *
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur("password")}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        validation.password
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      }`}
                    />
                    {validation.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {validation.password}
                      </p>
                    )}

                    {/* Password strength meter */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              passwordStrength.score < 3
                                ? "bg-red-500"
                                : passwordStrength.score < 4
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {passwordStrength.score < 3
                            ? t(text.passwordStrength.weak)
                            : passwordStrength.score < 4
                              ? t(text.passwordStrength.medium)
                              : t(text.passwordStrength.strong)}
                          {passwordStrength.feedback &&
                            `: ${passwordStrength.feedback}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t(text.confirmPassword)} *
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur("confirmPassword")}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        validation.confirmPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      }`}
                    />
                    {validation.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {validation.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="terms"
                        className="font-medium text-gray-700"
                      >
                        {t(text.terms.accept)}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation and submit buttons */}
              <div className="flex justify-between pt-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {t(text.backAction)}
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {t(text.continueAction)}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    {loading ? t(text.processing) : t(text.action)}
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        <div className="text-sm mt-6 text-center">
          <p className="text-gray-600">
            {t(text.haveAccount)}{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t(text.loginAction)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
