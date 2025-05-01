import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { toast } from "../../../utils/toast";
import { supabase } from "../../../services/supabase";
import { Button } from "../../ui/Button";
import { UploadIcon, TrashIcon, RefreshIcon } from "../../ui/Icons";

interface SlotImagePanelProps {
  slotId: number;
}

interface SlotImage {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

const SlotImagePanel: React.FC<SlotImagePanelProps> = ({ slotId }) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<SlotImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Text content
  const text = {
    title: { en: "Slot Images", fr: "Images de l'emplacement" },
    description: {
      en: "Manage images for this slot",
      fr: "Gérer les images pour cet emplacement",
    },
    uploadImages: { en: "Upload Images", fr: "Télécharger des images" },
    uploadingStatus: { en: "Uploading...", fr: "Téléchargement en cours..." },
    noImages: {
      en: "No images in this slot folder",
      fr: "Aucune image dans ce dossier d'emplacement",
    },
    currentImages: { en: "Current Images", fr: "Images actuelles" },
    deleteImage: { en: "Delete", fr: "Supprimer" },
    imageSize: { en: "Size", fr: "Taille" },
    imageDate: { en: "Uploaded", fr: "Téléchargé le" },
    deleteConfirm: {
      en: "Are you sure you want to delete this image?",
      fr: "Êtes-vous sûr de vouloir supprimer cette image ?",
    },
    refresh: { en: "Refresh", fr: "Actualiser" },
  };

  // Load images when slot ID changes
  useEffect(() => {
    loadSlotImages();
  }, [slotId]);

  // Load images from the selected slot folder
  const loadSlotImages = async () => {
    if (slotId < 1) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .list(`slot-${slotId}`);

      if (error) throw error;

      // Filter out the .folder placeholder file
      const imageFiles = (data || []).filter((file) => file.name !== ".folder");

      // Get public URLs for each file
      const imagesWithUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(`slot-${slotId}/${file.name}`);

          return {
            name: file.name,
            url: data.publicUrl,
            size: file.metadata?.size || 0,
            createdAt: file.created_at || new Date().toISOString(),
          };
        }),
      );

      setImages(imagesWithUrls);
    } catch (error) {
      console.error(`Error loading images for slot ${slotId}:`, error);
      toast.error(
        t({
          en: `Error loading images for slot ${slotId}`,
          fr: `Erreur lors du chargement des images pour l'emplacement ${slotId}`,
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection for upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Upload each file to the slot folder
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `slot-${slotId}/${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (error) {
          throw error;
        }
      }

      // Reload images after successful upload
      await loadSlotImages();

      toast.success(
        t({
          en: `Successfully uploaded ${files.length} image(s) to slot ${slotId}`,
          fr: `${files.length} image(s) téléchargée(s) avec succès dans l'emplacement ${slotId}`,
        }),
      );
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(
        t({
          en: "An unexpected error occurred during upload",
          fr: "Une erreur inattendue s'est produite lors du téléchargement",
        }),
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageName: string) => {
    if (window.confirm(t(text.deleteConfirm))) {
      try {
        const { error } = await supabase.storage
          .from('product-images')
          .remove([`slot-${slotId}/${imageName}`]);

        if (error) throw error;

        toast.success(
          t({
            en: `Image deleted successfully`,
            fr: `Image supprimée avec succès`,
          }),
        );

        // Reload images after successful deletion
        await loadSlotImages();
      } catch (error) {
        console.error(`Error deleting image ${imageName}:`, error);
        toast.error(
          t({
            en: `Error deleting image`,
            fr: `Erreur lors de la suppression de l'image`,
          }),
        );
      }
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">{t(text.title)}</h2>
      <p className="text-gray-600 mb-4">{t(text.description)}</p>

      {/* Upload form */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t(text.uploadingStatus)}
            </>
          ) : (
            <>
              <UploadIcon className="w-4 h-4 mr-2" />
              {t(text.uploadImages)}
            </>
          )}
        </Button>

        <p className="mt-2 text-sm text-gray-500">
          {t({
            en: "Drag & drop images or click to browse",
            fr: "Glisser-déposer des images ou cliquer pour parcourir",
          })}
        </p>
      </div>

      {/* Current images in slot */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t(text.currentImages)}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSlotImages}
            disabled={isLoading}
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            {t(text.refresh)}
          </Button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : images.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t(text.noImages)}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image) => (
              <div
                key={image.name}
                className="border rounded-lg overflow-hidden"
              >
                <div className="aspect-square bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium truncate mb-1">
                    {image.name}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>
                      {t(text.imageSize)}: {formatFileSize(image.size)}
                    </span>
                    <span>
                      {t(text.imageDate)}: {formatDate(image.createdAt)}
                    </span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeleteImage(image.name)}
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    {t(text.deleteImage)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotImagePanel;
