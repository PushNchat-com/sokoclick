import React, { useState } from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { ProductFormData } from "../../../types/product";
import {
  validateWhatsAppNumber,
  ERROR_MESSAGES,
} from "../../../utils/validationUtils";

interface BasicInfoSectionProps {
  formData: ProductFormData;
  onChange: (data: Partial<ProductFormData>) => void;
  errors: Record<string, string>;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  onChange,
  errors,
}) => {
  const { t } = useLanguage();
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  // Text content
  const text = {
    basicInfo: { en: "Basic Information", fr: "Informations de base" },
    productNameEn: {
      en: "Product Name (English)",
      fr: "Nom du Produit (Anglais)",
    },
    productNameFr: {
      en: "Product Name (French)",
      fr: "Nom du Produit (Français)",
    },
    descriptionEn: { en: "Description (English)", fr: "Description (Anglais)" },
    descriptionFr: { en: "Description (French)", fr: "Description (Français)" },
    price: { en: "Price", fr: "Prix" },
    currency: { en: "Currency", fr: "Devise" },
    whatsAppNumber: { en: "WhatsApp Number", fr: "Numéro WhatsApp" },
    whatsAppNumberHelp: {
      en: "Enter in international format (e.g., +237XXXXXXXXX)",
      fr: "Entrer au format international (ex: +237XXXXXXXXX)",
    },
    category: { en: "Category", fr: "Catégorie" },
    selectCategory: {
      en: "Select a category",
      fr: "Sélectionnez une catégorie",
    },
    condition: { en: "Condition", fr: "État" },
    new: { en: "New", fr: "Neuf" },
    used: { en: "Used", fr: "Utilisé" },
    refurbished: { en: "Refurbished", fr: "Reconditionné" },
    required: { en: "Required", fr: "Requis" },
    electronics: { en: "Electronics", fr: "Électronique" },
    clothing: { en: "Clothing", fr: "Vêtements" },
    furniture: { en: "Furniture", fr: "Meubles" },
    other: { en: "Other", fr: "Autre" },
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  // Handle input focus
  const handleFocus = (fieldName: string) => {
    setFocused((prev) => ({ ...prev, [fieldName]: true }));
  };

  // Handle input blur
  const handleBlur = (fieldName: string) => {
    // Keep focus state for validation styling
    // but trigger validation
    if (fieldName === "seller_whatsapp") {
      validateWhatsAppField(formData.seller_whatsapp);
    }
  };

  // Validate WhatsApp number format
  const validateWhatsAppField = (number: string): boolean => {
    const validation = validateWhatsAppNumber(number);
    return validation.isValid;
  };

  // Get the appropriate WhatsApp validation error message
  const getWhatsAppErrorMessage = (number: string): string => {
    if (!number) return t(ERROR_MESSAGES.required);

    const validation = validateWhatsAppNumber(number);
    if (!validation.isValid && validation.errorType) {
      return t(ERROR_MESSAGES[validation.errorType]);
    }

    return "";
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-medium text-gray-900 mb-6">
        {t(text.basicInfo)}
      </h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Product Name (English) */}
        <div>
          <label
            htmlFor="name_en"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.productNameEn)} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name_en"
            name="name_en"
            value={formData.name_en}
            onChange={handleInputChange}
            onFocus={() => handleFocus("name_en")}
            onBlur={() => handleBlur("name_en")}
            maxLength={100}
            className={`bg-white border ${errors.name_en ? "border-red-500" : focused.name_en && !formData.name_en ? "border-orange-300" : "border-gray-300"} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            placeholder={t({
              en: "Enter product name",
              fr: "Entrez le nom du produit",
            })}
            aria-required="true"
            aria-invalid={!!errors.name_en}
            aria-describedby={errors.name_en ? "name_en_error" : undefined}
          />
          {errors.name_en && (
            <p id="name_en_error" className="mt-1 text-sm text-red-600">
              {errors.name_en}
            </p>
          )}
          {!errors.name_en && focused.name_en && !formData.name_en && (
            <p className="mt-1 text-sm text-orange-500">{t(text.required)}</p>
          )}
        </div>

        {/* Product Name (French) */}
        <div>
          <label
            htmlFor="name_fr"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.productNameFr)} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name_fr"
            name="name_fr"
            value={formData.name_fr}
            onChange={handleInputChange}
            onFocus={() => handleFocus("name_fr")}
            onBlur={() => handleBlur("name_fr")}
            maxLength={100}
            className={`bg-white border ${errors.name_fr ? "border-red-500" : focused.name_fr && !formData.name_fr ? "border-orange-300" : "border-gray-300"} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            placeholder={t({
              en: "Enter product name in French",
              fr: "Entrez le nom du produit en français",
            })}
            aria-required="true"
            aria-invalid={!!errors.name_fr}
            aria-describedby={errors.name_fr ? "name_fr_error" : undefined}
          />
          {errors.name_fr && (
            <p id="name_fr_error" className="mt-1 text-sm text-red-600">
              {errors.name_fr}
            </p>
          )}
          {!errors.name_fr && focused.name_fr && !formData.name_fr && (
            <p className="mt-1 text-sm text-orange-500">{t(text.required)}</p>
          )}
        </div>

        {/* Description (English) */}
        <div className="sm:col-span-2">
          <label
            htmlFor="description_en"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.descriptionEn)} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description_en"
            name="description_en"
            rows={4}
            value={formData.description_en}
            onChange={handleInputChange}
            onFocus={() => handleFocus("description_en")}
            onBlur={() => handleBlur("description_en")}
            maxLength={1000}
            className={`bg-white border ${errors.description_en ? "border-red-500" : focused.description_en && !formData.description_en ? "border-orange-300" : "border-gray-300"} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            placeholder={t({
              en: "Describe your product",
              fr: "Décrivez votre produit",
            })}
            aria-required="true"
            aria-invalid={!!errors.description_en}
            aria-describedby={
              errors.description_en ? "description_en_error" : undefined
            }
          />
          {errors.description_en && (
            <p id="description_en_error" className="mt-1 text-sm text-red-600">
              {errors.description_en}
            </p>
          )}
          {!errors.description_en &&
            focused.description_en &&
            !formData.description_en && (
              <p className="mt-1 text-sm text-orange-500">{t(text.required)}</p>
            )}
        </div>

        {/* Description (French) */}
        <div className="sm:col-span-2">
          <label
            htmlFor="description_fr"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.descriptionFr)} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description_fr"
            name="description_fr"
            rows={4}
            value={formData.description_fr}
            onChange={handleInputChange}
            onFocus={() => handleFocus("description_fr")}
            onBlur={() => handleBlur("description_fr")}
            maxLength={1000}
            className={`bg-white border ${errors.description_fr ? "border-red-500" : focused.description_fr && !formData.description_fr ? "border-orange-300" : "border-gray-300"} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            placeholder={t({
              en: "Describe your product in French",
              fr: "Décrivez votre produit en français",
            })}
            aria-required="true"
            aria-invalid={!!errors.description_fr}
            aria-describedby={
              errors.description_fr ? "description_fr_error" : undefined
            }
          />
          {errors.description_fr && (
            <p id="description_fr_error" className="mt-1 text-sm text-red-600">
              {errors.description_fr}
            </p>
          )}
          {!errors.description_fr &&
            focused.description_fr &&
            !formData.description_fr && (
              <p className="mt-1 text-sm text-orange-500">{t(text.required)}</p>
            )}
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.price)} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            onFocus={() => handleFocus("price")}
            onBlur={() => handleBlur("price")}
            min="0"
            max="9999999"
            step="0.01"
            className={`bg-white border ${errors.price ? "border-red-500" : focused.price && !formData.price ? "border-orange-300" : "border-gray-300"} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            placeholder="0.00"
            aria-required="true"
            aria-invalid={!!errors.price}
            aria-describedby={errors.price ? "price_error" : undefined}
          />
          {errors.price && (
            <p id="price_error" className="mt-1 text-sm text-red-600">
              {errors.price}
            </p>
          )}
          {!errors.price && focused.price && !formData.price && (
            <p className="mt-1 text-sm text-orange-500">{t(text.required)}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.currency)}
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            aria-required="true"
          >
            <option value="XAF">XAF</option>
            <option value="FCFA">FCFA</option>
          </select>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label
            htmlFor="seller_whatsapp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.whatsAppNumber)} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="seller_whatsapp"
              name="seller_whatsapp"
              value={formData.seller_whatsapp}
              onChange={handleInputChange}
              onFocus={() => handleFocus("seller_whatsapp")}
              onBlur={() => handleBlur("seller_whatsapp")}
              placeholder="+237XXXXXXXXX"
              maxLength={15}
              className={`bg-white border pl-10 ${errors.seller_whatsapp ? "border-red-500" : focused.seller_whatsapp && !validateWhatsAppField(formData.seller_whatsapp) ? "border-orange-300" : validateWhatsAppField(formData.seller_whatsapp) ? "border-green-300" : "border-gray-300"} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
              aria-required="true"
              aria-invalid={!!errors.seller_whatsapp}
              aria-describedby="whatsapp_help seller_whatsapp_error"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className={`w-5 h-5 ${validateWhatsAppField(formData.seller_whatsapp) ? "text-green-500" : "text-gray-400"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            {validateWhatsAppField(formData.seller_whatsapp) && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            )}
          </div>
          <p id="whatsapp_help" className="mt-1 text-xs text-gray-500">
            {t(text.whatsAppNumberHelp)}
            {formData.seller_whatsapp &&
              !formData.seller_whatsapp.startsWith("+237") && (
                <span className="ml-1 text-blue-500">
                  {t({
                    en: "Cameroon format recommended (+237...)",
                    fr: "Format camerounais recommandé (+237...)",
                  })}
                </span>
              )}
          </p>
          {errors.seller_whatsapp && (
            <p id="seller_whatsapp_error" className="mt-1 text-sm text-red-600">
              {errors.seller_whatsapp}
            </p>
          )}
          {!errors.seller_whatsapp &&
            focused.seller_whatsapp &&
            !validateWhatsAppField(formData.seller_whatsapp) && (
              <p className="mt-1 text-sm text-orange-500">
                {getWhatsAppErrorMessage(formData.seller_whatsapp)}
              </p>
            )}
          {validateWhatsAppField(formData.seller_whatsapp) && (
            <p className="mt-1 text-sm text-green-500">
              {t({
                en: "Valid WhatsApp number format",
                fr: "Format de numéro WhatsApp valide",
              })}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.category)} <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            onFocus={() => handleFocus("category")}
            onBlur={() => handleBlur("category")}
            className={`bg-white border ${errors.category ? "border-red-500" : focused.category && !formData.category ? "border-orange-300" : "border-gray-300"} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            aria-required="true"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? "category_error" : undefined}
          >
            <option value="">{t(text.selectCategory)}</option>
            <option value="electronics">{t(text.electronics)}</option>
            <option value="clothing">{t(text.clothing)}</option>
            <option value="furniture">{t(text.furniture)}</option>
            <option value="other">{t(text.other)}</option>
          </select>
          {errors.category && (
            <p id="category_error" className="mt-1 text-sm text-red-600">
              {errors.category}
            </p>
          )}
          {!errors.category && focused.category && !formData.category && (
            <p className="mt-1 text-sm text-orange-500">{t(text.required)}</p>
          )}
        </div>

        {/* Condition */}
        <div>
          <label
            htmlFor="condition"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.condition)}
          </label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleInputChange}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="new">{t(text.new)}</option>
            <option value="used">{t(text.used)}</option>
            <option value="refurbished">{t(text.refurbished)}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
