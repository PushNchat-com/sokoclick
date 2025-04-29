import React, { ChangeEvent } from "react";
import BasicInfoSection from "../form-sections/BasicInfoSection";
import { ProductFormData } from "../../../types/product";
import { useLanguage } from "../../../store/LanguageContext";

export interface BasicInfoStepProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  isAdmin: boolean;
  onDataChange: (data: Partial<ProductFormData>) => void;
  availableSlots: number[];
  loadingSlots: boolean;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  errors,
  isAdmin,
  onDataChange,
  availableSlots,
  loadingSlots,
}) => {
  const { t } = useLanguage();

  // Text content
  const text = {
    slotAssignment: {
      en: "Slot Assignment",
      fr: "Affectation de l'emplacement",
    },
    slotNumber: { en: "Slot", fr: "Emplacement" },
    selectSlot: { en: "Select slot", fr: "Sélectionner un emplacement" },
    noSlots: { en: "No available slots", fr: "Aucun emplacement disponible" },
    nameEn: { en: "Product Name (English)", fr: "Nom du produit (Anglais)" },
    nameFr: { en: "Product Name (French)", fr: "Nom du produit (Français)" },
    descriptionEn: {
      en: "Product Description (English)",
      fr: "Description du produit (Anglais)",
    },
    descriptionFr: {
      en: "Product Description (French)",
      fr: "Description du produit (Français)",
    },
    price: { en: "Price", fr: "Prix" },
    whatsapp: { en: "WhatsApp Contact", fr: "Contact WhatsApp" },
    category: { en: "Category", fr: "Catégorie" },
    condition: { en: "Condition", fr: "État" },
    conditionNew: { en: "New", fr: "Neuf" },
    conditionUsed: { en: "Used", fr: "Occasionnel" },
    conditionRefurbished: { en: "Refurbished", fr: "Rénové" },
    selectCategory: {
      en: "Select a category",
      fr: "Sélectionnez une catégorie",
    },
    slot: { en: "Slot", fr: "Emplacement" },
    noSlotsAvailable: {
      en: "No slots available",
      fr: "Aucun emplacement disponible",
    },
  };

  // Update the onDataChange function to handle different input types
  const onInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    onDataChange({ [name]: value });
  };

  return (
    <>
      {/* Basic Information */}
      <BasicInfoSection
        formData={formData}
        onChange={onDataChange}
        errors={errors}
      />

      {/* Slot assignment for admin only */}
      {isAdmin && (
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t(text.slotAssignment)}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label
                htmlFor="slotNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t(text.slotNumber)} <span className="text-red-500">*</span>
              </label>
              <select
                id="slotNumber"
                name="slotNumber"
                value={formData.slotNumber}
                onChange={onInputChange}
                className={`bg-white border text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${errors.slotNumber ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">{t(text.selectSlot)}</option>
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <option key={slot} value={slot.toString()}>
                      {t(text.slotNumber)} #{slot}
                    </option>
                  ))
                ) : (
                  <option disabled>{t(text.noSlots)}</option>
                )}
              </select>
              {errors.slotNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.slotNumber}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add descriptive helper text to form fields */}

      {/* For product name in English */}
      <div className="mb-4">
        <label
          htmlFor="name_en"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(
            text.nameEn || {
              en: "Product Name (English)",
              fr: "Nom du produit (Anglais)",
            },
          )}
          <span className="text-red-500">*</span>
        </label>
        <input
          id="name_en"
          name="name_en"
          className={`w-full p-2 border rounded-md ${errors.name_en ? "border-red-500" : "border-gray-300"}`}
          value={formData.name_en}
          onChange={onInputChange}
          required
          placeholder={t({
            en: "E.g., Smartphone XYZ 128GB Black",
            fr: "Ex: Smartphone XYZ 128Go Noir",
          })}
        />
        {errors.name_en && (
          <p className="mt-1 text-sm text-red-500">{errors.name_en}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "This is how your product will appear to English-speaking customers.",
            fr: "C'est ainsi que votre produit apparaîtra aux clients anglophones.",
          })}
        </p>
      </div>

      {/* For product name in French */}
      <div className="mb-4">
        <label
          htmlFor="name_fr"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(
            text.nameFr || {
              en: "Product Name (French)",
              fr: "Nom du produit (Français)",
            },
          )}
          <span className="text-red-500">*</span>
        </label>
        <input
          id="name_fr"
          name="name_fr"
          className={`w-full p-2 border rounded-md ${errors.name_fr ? "border-red-500" : "border-gray-300"}`}
          value={formData.name_fr}
          onChange={onInputChange}
          required
          placeholder={t({
            en: "E.g., Smartphone XYZ 128Go Noir",
            fr: "Ex: Smartphone XYZ 128Go Noir",
          })}
        />
        {errors.name_fr && (
          <p className="mt-1 text-sm text-red-500">{errors.name_fr}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "This is how your product will appear to French-speaking customers.",
            fr: "C'est ainsi que votre produit apparaîtra aux clients francophones.",
          })}
        </p>
      </div>

      {/* For product description in English */}
      <div className="mb-4">
        <label
          htmlFor="description_en"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(
            text.descriptionEn || {
              en: "Product Description (English)",
              fr: "Description du produit (Anglais)",
            },
          )}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description_en"
          name="description_en"
          className={`w-full min-h-[100px] border rounded-md p-2 ${errors.description_en ? "border-red-500" : "border-gray-300"}`}
          value={formData.description_en}
          onChange={onInputChange}
          required
          placeholder={t({
            en: "Describe your product's features, condition, and any other relevant details",
            fr: "Décrivez les caractéristiques de votre produit, son état et autres détails pertinents",
          })}
        />
        {errors.description_en && (
          <p className="mt-1 text-sm text-red-500">{errors.description_en}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "Describe key features and benefits in 50-500 characters. This helps customers understand your product.",
            fr: "Décrivez les caractéristiques et avantages clés en 50-500 caractères. Cela aide les clients à comprendre votre produit.",
          })}
        </p>
      </div>

      {/* For product description in French */}
      <div className="mb-4">
        <label
          htmlFor="description_fr"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(
            text.descriptionFr || {
              en: "Product Description (French)",
              fr: "Description du produit (Français)",
            },
          )}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description_fr"
          name="description_fr"
          className={`w-full min-h-[100px] border rounded-md p-2 ${errors.description_fr ? "border-red-500" : "border-gray-300"}`}
          value={formData.description_fr}
          onChange={onInputChange}
          required
          placeholder={t({
            en: "Describe your product's features, condition, and other details in French",
            fr: "Décrivez les caractéristiques de votre produit, son état et autres détails pertinents",
          })}
        />
        {errors.description_fr && (
          <p className="mt-1 text-sm text-red-500">{errors.description_fr}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "Describe key features and benefits in 50-500 characters, in French. This helps all customers understand your product.",
            fr: "Décrivez les caractéristiques et avantages clés en 50-500 caractères. Cela aide les clients à comprendre votre produit.",
          })}
        </p>
      </div>

      {/* For product price */}
      <div className="mb-4">
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(text.price || { en: "Price", fr: "Prix" })}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="price"
            name="price"
            type="text"
            className={`w-full pl-7 p-2 border rounded-md ${errors.price ? "border-red-500" : "border-gray-300"}`}
            value={formData.price}
            onChange={onInputChange}
            required
            placeholder="0"
          />
        </div>
        {errors.price && (
          <p className="mt-1 text-sm text-red-500">{errors.price}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "Enter numbers only. This is the price customers will pay, excluding delivery fees.",
            fr: "Entrez uniquement des chiffres. C'est le prix que les clients paieront, hors frais de livraison.",
          })}
        </p>
      </div>

      {/* For WhatsApp contact number */}
      <div className="mb-4">
        <label
          htmlFor="seller_whatsapp"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(
            text.whatsapp || { en: "WhatsApp Contact", fr: "Contact WhatsApp" },
          )}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <input
            id="seller_whatsapp"
            name="seller_whatsapp"
            className={`w-full pl-10 p-2 border rounded-md ${errors.seller_whatsapp ? "border-red-500" : "border-gray-300"}`}
            value={formData.seller_whatsapp}
            onChange={onInputChange}
            required
            placeholder="+237 612345678"
          />
        </div>
        {errors.seller_whatsapp && (
          <p className="mt-1 text-sm text-red-500">{errors.seller_whatsapp}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "Include country code (e.g., +237 612345678). Customers will contact you on this number.",
            fr: "Incluez l'indicatif du pays (ex: +237 612345678). Les clients vous contacteront sur ce numéro.",
          })}
        </p>
      </div>

      {/* For product category */}
      <div className="mb-4">
        <label
          htmlFor="category_id"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(text.category || { en: "Category", fr: "Catégorie" })}
          <span className="text-red-500">*</span>
        </label>
        <select
          id="category_id"
          name="category_id"
          className={`w-full border rounded-md p-2 ${errors.category_id ? "border-red-500" : "border-gray-300"}`}
          value={formData.category_id}
          onChange={onInputChange}
          required
        >
          <option value="">
            {t(
              text.selectCategory || {
                en: "Select a category",
                fr: "Sélectionnez une catégorie",
              },
            )}
          </option>
          {/* categories.map(category => (
            <option key={category.id} value={category.id}>
              {language === 'en' ? category.name_en : category.name_fr}
            </option>
          )) */}
        </select>
        {errors.category_id && (
          <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "Select a category that best matches your product to help customers find it easily.",
            fr: "Sélectionnez une catégorie qui correspond le mieux à votre produit pour aider les clients à le trouver facilement.",
          })}
        </p>
      </div>

      {/* For product condition */}
      <div className="mb-4">
        <label
          htmlFor="condition"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t(text.condition || { en: "Condition", fr: "État" })}
          <span className="text-red-500">*</span>
        </label>
        <select
          id="condition"
          name="condition"
          className={`w-full border rounded-md p-2 ${errors.condition ? "border-red-500" : "border-gray-300"}`}
          value={formData.condition}
          onChange={onInputChange}
          required
        >
          <option value="new">
            {t(text.conditionNew || { en: "New", fr: "Neuf" })}
          </option>
          <option value="used">
            {t(text.conditionUsed || { en: "Used", fr: "Occasionnel" })}
          </option>
          <option value="refurbished">
            {t(
              text.conditionRefurbished || { en: "Refurbished", fr: "Rénové" },
            )}
          </option>
        </select>
        {errors.condition && (
          <p className="mt-1 text-sm text-red-500">{errors.condition}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: "Be honest about your product's condition to build customer trust and avoid returns.",
            fr: "Soyez honnête sur l'état de votre produit pour instaurer la confiance et éviter les retours.",
          })}
        </p>
      </div>

      {/* For slot selection (admin only) */}
      {isAdmin && (
        <div className="mb-4">
          <label
            htmlFor="slotNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.slot || { en: "Slot", fr: "Emplacement" })}
          </label>
          <select
            id="slotNumber"
            name="slotNumber"
            className={`w-full border rounded-md p-2 ${errors.slot_id ? "border-red-500" : "border-gray-300"}`}
            value={formData.slotNumber || ""}
            onChange={onInputChange}
            disabled={availableSlots.length === 0 && !formData.slotNumber}
          >
            <option value="">{t(text.selectSlot)}</option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {t(text.slotNumber)} {slot}
              </option>
            ))}
          </select>
          {availableSlots.length === 0 && !formData.slotNumber && (
            <p className="mt-1 text-amber-600 text-sm">
              {t(
                text.noSlotsAvailable || {
                  en: "No slots available",
                  fr: "Aucun emplacement disponible",
                },
              )}
            </p>
          )}
          {errors.slot_id && (
            <p className="mt-1 text-sm text-red-500">{errors.slot_id}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {t({
              en: "Assign this product to a specific slot on the homepage carousel.",
              fr: "Attribuez ce produit à un emplacement spécifique sur le carrousel de la page d'accueil.",
            })}
          </p>
        </div>
      )}
    </>
  );
};

export default BasicInfoStep;
