import React from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { DeliveryOptionInternal } from "../../../types/delivery";
import DeliveryOptionsSection from "../form-sections/DeliveryOptionsSection";

interface DeliveryOptionsStepProps {
  options: DeliveryOptionInternal[];
  errors: Record<string, string>;
  onChange: (
    optionIndex: number,
    data: Partial<DeliveryOptionInternal>,
  ) => void;
  onRemove: (index: number) => void;
}

const DeliveryOptionsStep: React.FC<DeliveryOptionsStepProps> = ({
  options,
  errors,
  onChange,
  onRemove,
}) => {
  const { t } = useLanguage();

  // Handle change from the section by adapting to the component's API
  const handleOptionsChange = (newOptions: DeliveryOptionInternal[]) => {
    // We need to add logic to determine what changed and call the onChange prop accordingly
    if (!newOptions || !Array.isArray(newOptions)) {
      console.error(
        "Invalid options received in DeliveryOptionsStep:",
        newOptions,
      );
      return;
    }

    newOptions.forEach((option, index) => {
      if (index < options.length) {
        // This is an existing option, check if it was changed
        const existingOption = options[index];
        if (JSON.stringify(existingOption) !== JSON.stringify(option)) {
          // Pass the changes to the parent component
          onChange(index, option);
        }
      } else {
        // This is a new option
        onChange(options.length, option);
      }
    });
  };

  return (
    <DeliveryOptionsSection
      deliveryOptions={options}
      onChange={handleOptionsChange}
      onOptionRemoved={onRemove}
      errors={errors}
    />
  );
};

export default DeliveryOptionsStep;
