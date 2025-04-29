import { useState, useCallback } from "react";
import { useLanguage } from "../store/LanguageContext";
import { AuthConfig } from "../services/auth/AuthConfig";

type FormType = "login" | "admin-login"; // Extend as needed (signup, etc.)

interface AuthFormState {
  email: string;
  password: string;
}

const initialFormState: AuthFormState = {
  email: "",
  password: "",
};

const useAuthForm = (formType: FormType) => {
  const { t } = useLanguage();
  const [formState, setFormState] = useState<AuthFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<AuthFormState>>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof AuthFormState, boolean>>
  >({});

  // --- Text definitions (could be moved to a shared place) ---
  const text = {
    errors: {
      emailRequired: { en: "Email is required", fr: "L'email est requis" },
      invalidEmail: {
        en: "Invalid email address",
        fr: "Adresse email invalide",
      },
      passwordRequired: {
        en: "Password is required",
        fr: "Le mot de passe est requis",
      },
      passwordLength: {
        en: `Password must be at least ${AuthConfig.SECURITY.PASSWORD_MIN_LENGTH} characters`,
        fr: `Le mot de passe doit comporter au moins ${AuthConfig.SECURITY.PASSWORD_MIN_LENGTH} caractères`,
      },
    },
  };

  // --- Validation Logic ---
  const validateField = useCallback(
    (name: keyof AuthFormState, value: string) => {
      let error = "";
      switch (name) {
        case "email":
          if (!value) {
            error = t(text.errors.emailRequired);
          } else if (!/^\S+@\S+\.\S+$/.test(value)) {
            error = t(text.errors.invalidEmail);
          }
          break;
        case "password":
          if (!value) {
            error = t(text.errors.passwordRequired);
          } else if (value.length < AuthConfig.SECURITY.PASSWORD_MIN_LENGTH) {
            error = t(text.errors.passwordLength);
          }
          break;
        default:
          break;
      }
      return error;
    },
    [t, text.errors],
  );

  const validateForm = useCallback(() => {
    const newErrors: Partial<AuthFormState> = {};
    let isValid = true;
    (Object.keys(formState) as Array<keyof AuthFormState>).forEach((key) => {
      const error = validateField(key, formState[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    // Mark all as touched on submit validation
    setTouched({ email: true, password: true });
    return isValid;
  }, [formState, validateField]);

  // --- Event Handlers ---
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Validate on change only if the field has been touched
      if (touched[name as keyof AuthFormState]) {
        const error = validateField(name as keyof AuthFormState, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      // Mark field as touched
      setTouched((prev) => ({ ...prev, [name]: true }));
      // Validate on blur
      const error = validateField(name as keyof AuthFormState, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField],
  );

  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setErrors({});
    setTouched({});
  }, []);

  return {
    formState,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
  };
};

export default useAuthForm;
