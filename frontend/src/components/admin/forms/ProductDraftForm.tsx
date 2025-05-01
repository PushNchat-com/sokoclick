import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/store/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
// import { Textarea } from '@/components/ui/Textarea'; // Temporarily remove failing import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import type { Slot } from '@/services/slots'; // Import Slot type for draft fields
import { slotService, SlotDraftData } from '@/services/slots'; // Import the service and SlotDraftData type
import { toast } from '@/utils/toast'; // Import toast for notifications
import { Json } from "@/types/supabase-types"; // Keep Json import

// Define the shape of the form data based on Slot draft fields
type DraftFormData = Partial<{
  draft_seller_whatsapp_number: string;
  draft_product_name_en: string;
  draft_product_name_fr: string;
  draft_product_description_en: string;
  draft_product_description_fr: string;
  draft_product_price: number;
  draft_product_currency: 'XAF' | 'USD' | 'EUR';
  draft_product_categories: string[]; // Use string[] for now, handle input as needed
  draft_product_tags: string[]; // Use string[]
  draft_product_image_urls: string[]; // Use string[]
}>;

interface ProductDraftFormProps {
  slotId: number; // Make slotId required for saving a draft
  initialData?: SlotDraftData; // For editing later
  onSuccess?: () => void; // Callback on successful save
  onCancel?: () => void; // Callback on cancel
}

const ProductDraftForm: React.FC<ProductDraftFormProps> = ({
  slotId,
  initialData = {},
  onSuccess,
  onCancel,
}) => {
  const { t } = useLanguage();
  // Main form data state
  const [formData, setFormData] = useState<SlotDraftData>(initialData);
  // State for comma-separated string inputs for array fields
  const [categoriesString, setCategoriesString] = useState<string>("");
  const [tagsString, setTagsString] = useState<string>("");
  const [imageUrlsString, setImageUrlsString] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  // Initialize string states if initialData has arrays
  useEffect(() => {
    if (initialData.draft_product_categories) {
      setCategoriesString(initialData.draft_product_categories.join(', '));
    }
    if (initialData.draft_product_tags) {
      setTagsString(initialData.draft_product_tags.join(', '));
    }
    if (initialData.draft_product_image_urls) {
      setImageUrlsString(initialData.draft_product_image_urls.join(', '));
    }
    // Update main formData state as well
    setFormData(initialData);
  }, [initialData]);

  // Generic handler for text inputs and textareas
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    // Handle specific string states for array fields
    if (name === 'categoriesString') {
      setCategoriesString(value);
    } else if (name === 'tagsString') {
      setTagsString(value);
    } else if (name === 'imageUrlsString') {
      setImageUrlsString(value);
    } else {
      // Handle regular fields
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handler for number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : parseFloat(value), // Store as number or undefined
    }));
  };

  // Handler for Select component
  const handleSelectChange = (name: keyof SlotDraftData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value as any })); // Use 'as any' for simplicity here
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!slotId) {
      // Although slotId is now required by props, keep this check for robustness
      toast.error(t({ en: 'Slot ID is missing.', fr: 'ID de l\'emplacement manquant.' }));
      return;
    }

    // Basic validation
    if (!formData.draft_seller_whatsapp_number || !formData.draft_product_name_en || !formData.draft_product_price || !formData.draft_product_currency) {
      toast.error(t({ en: 'Please fill in all required fields (Seller WhatsApp, Name EN, Price, Currency).', fr: 'Veuillez remplir tous les champs obligatoires (WhatsApp Vendeur, Nom EN, Prix, Devise).' }));
      return;
    }

    setIsLoading(true);
    try {
      // Parse string inputs into arrays
      const categoriesArray = categoriesString.split(',').map(s => s.trim()).filter(Boolean);
      const tagsArray = tagsString.split(',').map(s => s.trim()).filter(Boolean);
      const imageUrlsArray = imageUrlsString.split(',').map(s => s.trim()).filter(Boolean);

      // Construct the final data payload, merging parsed arrays
      const finalDraftData: SlotDraftData = {
        ...formData,
        draft_product_categories: categoriesArray.length > 0 ? categoriesArray : undefined,
        draft_product_tags: tagsArray.length > 0 ? tagsArray : undefined,
        draft_product_image_urls: imageUrlsArray.length > 0 ? imageUrlsArray : undefined,
      };

      // Call the service function with the processed data
      const response = await slotService.saveProductDraft(slotId, finalDraftData);

      if (response.success) {
        toast.success(t({ en: 'Draft saved successfully!', fr: 'Brouillon enregistré avec succès !' }));
        if (onSuccess) {
          onSuccess(); // Call the success callback
        }
      } else {
        // Handle specific service errors from response
        toast.error(`${t({ en: 'Failed to save draft:', fr: 'Échec de l\'enregistrement du brouillon :' })} ${response.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      // Handle unexpected errors during the async call/await
      console.error("Submission failed unexpectedly:", error);
      toast.error(t({ en: 'An unexpected error occurred while saving.', fr: 'Une erreur inattendue s\'est produite lors de l\'enregistrement.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-medium text-gray-700 mb-4">
        {t({
          en: `Product Draft Details${slotId ? ` for Slot ${slotId}` : ''}`,
          fr: `Détails du Brouillon de Produit${
            slotId ? ` pour l'Emplacement ${slotId}` : ''
          }`,
        })}
      </h2>

      {/* Seller WhatsApp */}
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor="draft_seller_whatsapp_number">
          {t({ en: 'Seller WhatsApp', fr: 'WhatsApp Vendeur' })}
        </Label>
        <Input
          id="draft_seller_whatsapp_number"
          name="draft_seller_whatsapp_number"
          value={formData.draft_seller_whatsapp_number || ''}
          onChange={handleInputChange}
          placeholder={t({ en: 'e.g., +2376... or 6...', fr: 'ex: +2376... ou 6...' })}
          required // Important for linking to seller on approval
        />
      </div>

      {/* Product Name (EN & FR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="draft_product_name_en">
            {t({ en: 'Product Name (EN)', fr: 'Nom du Produit (EN)' })}
          </Label>
          <Input
            id="draft_product_name_en"
            name="draft_product_name_en"
            value={formData.draft_product_name_en || ''}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="draft_product_name_fr">
            {t({ en: 'Product Name (FR)', fr: 'Nom du Produit (FR)' })}
          </Label>
          <Input
            id="draft_product_name_fr"
            name="draft_product_name_fr"
            value={formData.draft_product_name_fr || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Price & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="draft_product_price">
            {t({ en: 'Price', fr: 'Prix' })}
          </Label>
          <Input
            id="draft_product_price"
            name="draft_product_price"
            type="number"
            step="any"
            value={formData.draft_product_price ?? ''} // Handle potential undefined
            onChange={handleNumberChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="draft_product_currency">
            {t({ en: 'Currency', fr: 'Devise' })}
          </Label>
          <Select
            name="draft_product_currency"
            value={formData.draft_product_currency}
            onValueChange={(value: string) =>
              handleSelectChange('draft_product_currency', value)
            }
            required
          >
            <SelectTrigger id="draft_product_currency">
              <SelectValue placeholder={t({ en: 'Select currency', fr: 'Choisir devise' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XAF">XAF (FCFA)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description (EN & FR) */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="draft_product_description_en">
            {t({ en: 'Description (EN)', fr: 'Description (EN)' })}
          </Label>
          <Textarea
            id="draft_product_description_en"
            name="draft_product_description_en"
            value={formData.draft_product_description_en || ''}
            onChange={handleInputChange}
            rows={4}
          />
        </div>
        <div>
          <Label htmlFor="draft_product_description_fr">
            {t({ en: 'Description (FR)', fr: 'Description (FR)' })}
          </Label>
          <Textarea
            id="draft_product_description_fr"
            name="draft_product_description_fr"
            value={formData.draft_product_description_fr || ''}
            onChange={handleInputChange}
            rows={4}
          />
        </div>
      </div> */}

      {/* Categories (Comma-separated) */}
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor="categoriesString">
          {t({ en: 'Categories (comma-separated)', fr: 'Catégories (séparées par virgule)' })}
        </Label>
        <Input
          id="categoriesString"
          name="categoriesString"
          value={categoriesString}
          onChange={handleInputChange}
          placeholder={t({ en: 'e.g., electronics, fashion', fr: 'ex: électronique, mode' })}
        />
      </div>

      {/* Tags (Comma-separated) */}
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor="tagsString">
          {t({ en: 'Tags (comma-separated)', fr: 'Tags (séparés par virgule)' })}
        </Label>
        <Input
          id="tagsString"
          name="tagsString"
          value={tagsString}
          onChange={handleInputChange}
          placeholder={t({ en: 'e.g., new, sale, featured', fr: 'ex: nouveau, promo, vedette' })}
        />
      </div>
      
      {/* Image URLs (Comma-separated) */}
       <div className="grid grid-cols-1 gap-2">
        <Label htmlFor="imageUrlsString">
          {t({ en: 'Image URLs (comma-separated)', fr: 'URLs des Images (séparées par virgule)' })}
        </Label>
        <Input
          id="imageUrlsString"
          name="imageUrlsString"
          value={imageUrlsString}
          onChange={handleInputChange}
          placeholder={t({ en: 'e.g., https://..., https://...', fr: 'ex: https://..., https://...' })}
        />
        <p className="text-xs text-gray-500">
          {t({
            en: 'Enter full URLs for images, separated by commas. Ensure images are accessible.',
            fr: 'Entrez les URLs complètes des images, séparées par des virgules. Assurez-vous que les images sont accessibles.'
          })}
        </p>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t({ en: 'Cancel', fr: 'Annuler' })}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t({ en: 'Saving...', fr: 'Enregistrement...' })
            : t({ en: 'Save Draft', fr: 'Enregistrer le Brouillon' })}
        </Button>
      </div>
    </form>
  );
};

export default ProductDraftForm; 