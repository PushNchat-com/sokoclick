import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { fileUploadService, DEFAULT_BUCKET } from '../../services/fileUpload';
import { supabase } from '../../services/supabase';
import { Button } from '../ui/Button';
import { toast } from '../../utils/toast';
import { UploadIcon, TrashIcon, RefreshIcon } from '../ui/Icons';
import { useDropzone } from 'react-dropzone';

interface SlotImageUploaderProps {
  className?: string;
}

interface SlotImage {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

/**
 * Component for directly uploading images to specific slot folders
 */
const SlotImageUploader: React.FC<SlotImageUploaderProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const [slotNumber, setSlotNumber] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<SlotImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Text content
  const text = {
    title: { en: 'Slot Image Uploader', fr: 'Téléchargeur d\'images pour les emplacements' },
    description: { 
      en: 'Upload images directly to a specific slot folder',
      fr: 'Téléchargez des images directement dans un dossier d\'emplacement spécifique'
    },
    selectSlot: { en: 'Select Slot', fr: 'Sélectionner l\'emplacement' },
    uploadImages: { en: 'Upload Images', fr: 'Télécharger des images' },
    uploadingStatus: { en: 'Uploading...', fr: 'Téléchargement en cours...' },
    noImages: { 
      en: 'No images in this slot folder', 
      fr: 'Aucune image dans ce dossier d\'emplacement'
    },
    currentImages: { en: 'Current Images', fr: 'Images actuelles' },
    deleteImage: { en: 'Delete', fr: 'Supprimer' },
    imageSize: { en: 'Size', fr: 'Taille' },
    imageDate: { en: 'Uploaded', fr: 'Téléchargé le' },
    deleteConfirm: { 
      en: 'Are you sure you want to delete this image?', 
      fr: 'Êtes-vous sûr de vouloir supprimer cette image ?' 
    },
    refresh: { en: 'Refresh', fr: 'Actualiser' }
  };
  
  // Load images from the selected slot folder
  const loadSlotImages = async () => {
    if (slotNumber < 1 || slotNumber > 25) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .list(`slot-${slotNumber}`);
      
      if (error) throw error;
      
      // Filter out the .folder placeholder file
      const imageFiles = (data || []).filter(file => file.name !== '.folder');
      
      // Get public URLs for each file
      const imagesWithUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const { data } = supabase.storage
            .from(DEFAULT_BUCKET)
            .getPublicUrl(`slot-${slotNumber}/${file.name}`);
          
          return {
            name: file.name,
            url: data.publicUrl,
            size: file.metadata?.size || 0,
            createdAt: file.created_at || new Date().toISOString()
          };
        })
      );
      
      setImages(imagesWithUrls);
    } catch (error) {
      console.error(`Error loading images for slot ${slotNumber}:`, error);
      toast.error(t({
        en: `Error loading images for slot ${slotNumber}`,
        fr: `Erreur lors du chargement des images pour l'emplacement ${slotNumber}`
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load images when slot number changes
  useEffect(() => {
    loadSlotImages();
  }, [slotNumber]);
  
  // Handle slot number change
  const handleSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= 25) {
      setSlotNumber(value);
    }
  };
  
  // Handle file selection for upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Upload each file to the selected slot folder
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Use uploadToSlot method to upload directly to the slot folder
        const result = await fileUploadService.uploadToSlot(
          file,
          slotNumber,
          `direct-upload-${Date.now()}` // Placeholder product ID for direct uploads
        );
        
        if (!result.success) {
          toast.error(t({
            en: `Error uploading ${file.name}: ${result.error}`,
            fr: `Erreur lors du téléchargement de ${file.name}: ${result.error}`
          }));
        }
      }
      
      // Reload images after successful upload
      await loadSlotImages();
      
      toast.success(t({
        en: `Successfully uploaded ${files.length} image(s) to slot ${slotNumber}`,
        fr: `${files.length} image(s) téléchargée(s) avec succès dans l'emplacement ${slotNumber}`
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(t({
        en: 'An unexpected error occurred during upload',
        fr: 'Une erreur inattendue s\'est produite lors du téléchargement'
      }));
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle image deletion
  const handleDeleteImage = async (imageName: string) => {
    if (window.confirm(t(text.deleteConfirm))) {
      try {
        const { error } = await supabase.storage
          .from(DEFAULT_BUCKET)
          .remove([`slot-${slotNumber}/${imageName}`]);
        
        if (error) throw error;
        
        toast.success(t({
          en: `Image deleted successfully`,
          fr: `Image supprimée avec succès`
        }));
        
        // Reload images after successful deletion
        await loadSlotImages();
      } catch (error) {
        console.error(`Error deleting image ${imageName}:`, error);
        toast.error(t({
          en: `Error deleting image`,
          fr: `Erreur lors de la suppression de l'image`
        }));
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
    <div className={`bg-white rounded-lg shadow p-6 mb-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">{t(text.title)}</h2>
      <p className="text-gray-600 mb-4">{t(text.description)}</p>
      
      {/* Slot selection */}
      <div className="mb-6">
        <label htmlFor="slotNumber" className="block text-sm font-medium text-gray-700 mb-1">
          {t(text.selectSlot)}
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            id="slotNumber"
            min={1}
            max={25}
            value={slotNumber}
            onChange={handleSlotChange}
            className="w-24 border border-gray-300 rounded-md px-3 py-2"
          />
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
      </div>
      
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
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            en: 'Drag & drop images or click to browse',
            fr: 'Glisser-déposer des images ou cliquer pour parcourir'
          })}
        </p>
      </div>
      
      {/* Current images in slot */}
      <div>
        <h3 className="text-lg font-medium mb-4">{t(text.currentImages)}</h3>
        
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : images.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t(text.noImages)}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.name} className="border rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium truncate mb-1">{image.name}</div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>{t(text.imageSize)}: {formatFileSize(image.size)}</span>
                    <span>{t(text.imageDate)}: {formatDate(image.createdAt)}</span>
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

export default SlotImageUploader; 