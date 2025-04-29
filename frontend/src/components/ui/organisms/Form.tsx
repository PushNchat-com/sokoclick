import React, { useState, useCallback } from "react";
import { cn } from "../../utils/cn";
import Button from "../atoms/Button";

export interface FormErrors {
  [key: string]: string;
}

export interface FormValues {
  [key: string]: any;
}

export interface FormValidators {
  [key: string]: (value: any, values: FormValues) => string | undefined;
}

export interface FormProps {
  initialValues: FormValues;
  validators?: FormValidators;
  onSubmit: (values: FormValues, formActions: FormActions) => void;
  children: (formProps: FormChildrenProps) => React.ReactNode;
  className?: string;
  resetOnSubmit?: boolean;
  id?: string;
}

export interface FormChildrenProps {
  values: FormValues;
  errors: FormErrors;
  touched: Record<string, boolean>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  handleBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setFieldValue: (field: string, value: any) => void;
  setFieldTouched: (field: string, isTouched: boolean) => void;
  resetForm: () => void;
  isSubmitting: boolean;
}

export interface FormActions {
  setSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
  setErrors: (errors: FormErrors) => void;
}

const Form: React.FC<FormProps> = ({
  initialValues,
  validators = {},
  onSubmit,
  children,
  className = "",
  resetOnSubmit = false,
  id = "form",
  ...rest
}) => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Validate a single field
  const validateField = useCallback(
    (name: string, value: any): string | undefined => {
      const validator = validators[name];
      if (!validator) return undefined;
      return validator(value, values);
    },
    [validators, values],
  );

  // Validate all fields
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    Object.keys(validators).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    return newErrors;
  }, [validateField, validators, values]);

  // Handle input change
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const newValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setValues((prevValues) => ({
        ...prevValues,
        [name]: newValue,
      }));

      // Validate on change if field was already touched
      if (touched[name]) {
        const error = validateField(name, newValue);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: error || "",
        }));
      }
    },
    [touched, validateField],
  );

  // Handle input blur
  const handleBlur = useCallback(
    (
      e: React.FocusEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;

      // Mark field as touched
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));

      // Validate on blur
      const error = validateField(name, value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error || "",
      }));
    },
    [validateField],
  );

  // Set field value programmatically
  const setFieldValue = useCallback(
    (field: string, value: any) => {
      setValues((prevValues) => ({
        ...prevValues,
        [field]: value,
      }));

      // Validate if field was touched
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: error || "",
        }));
      }
    },
    [touched, validateField],
  );

  // Set field touched state programmatically
  const setFieldTouched = useCallback(
    (field: string, isTouched: boolean) => {
      setTouched((prevTouched) => ({
        ...prevTouched,
        [field]: isTouched,
      }));

      // Validate if marking as touched
      if (isTouched) {
        const error = validateField(field, values[field]);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: error || "",
        }));
      }
    },
    [validateField, values],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, field) => {
          acc[field] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      setTouched(allTouched);

      // Validate all fields
      const formErrors = validateForm();
      setErrors(formErrors);

      // If no errors, proceed with submission
      if (Object.keys(formErrors).length === 0) {
        setIsSubmitting(true);

        const formActions: FormActions = {
          setSubmitting: setIsSubmitting,
          resetForm,
          setErrors,
        };

        onSubmit(values, formActions);

        if (resetOnSubmit) {
          resetForm();
        }
      }
    },
    [onSubmit, resetForm, resetOnSubmit, validateForm, values],
  );

  // Props to pass to children
  const formProps: FormChildrenProps = {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    resetForm,
    isSubmitting,
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
      noValidate
      {...rest}
    >
      {children(formProps)}
    </form>
  );
};

export default Form;
