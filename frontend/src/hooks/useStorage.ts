import { useState, useCallback } from 'react';
import { storageService, StorageBucket, UploadOptions, UploadResult, DeleteResult } from '../services/unifiedStorage';
import { useToast } from '@chakra-ui/react';

interface StorageState {
  isUploading: boolean;
  uploadProgress: number;
  isDeleting: boolean;
  lastUploadResult: UploadResult | null;
  lastDeleteResult: DeleteResult | null;
  error: Error | null;
}

interface UseStorageReturn extends StorageState {
  // Upload methods
  uploadFile: (file: File, bucket?: StorageBucket, options?: UploadOptions) => Promise<UploadResult>;
  uploadToSlot: (file: File, slotNumber: number, productId: string, options?: Omit<UploadOptions, 'slotNumber' | 'productId'>) => Promise<UploadResult>;
  uploadAvatar: (file: File, userId: string, options?: Omit<UploadOptions, 'userId'>) => Promise<UploadResult>;
  uploadCategoryImage: (file: File, categorySlug: string, options?: Omit<UploadOptions, 'folder'>) => Promise<UploadResult>;
  
  // Delete methods
  deleteFile: (bucket: StorageBucket, path: string) => Promise<DeleteResult>;
  clearSlotImages: (slotNumber: number) => Promise<{ success: boolean; message: string }>;
  
  // Utility methods
  getPublicUrl: (bucket: StorageBucket, path: string) => string;
  listFiles: (bucket: StorageBucket, path: string) => Promise<{ files: any[]; error: string | null }>;
  
  // Admin methods
  initializeSlotFolders: () => Promise<{ success: boolean; message: string }>;
  
  // State management
  resetState: () => void;
}

export function useStorage(
  showToasts = true,
  initialState: Partial<StorageState> = {}
): UseStorageReturn {
  const toast = useToast();
  
  // State
  const [state, setState] = useState<StorageState>({
    isUploading: false,
    uploadProgress: 0,
    isDeleting: false,
    lastUploadResult: null,
    lastDeleteResult: null,
    error: null,
    ...initialState
  });
  
  // Reset state
  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: 0,
      isDeleting: false,
      lastUploadResult: null,
      lastDeleteResult: null,
      error: null
    });
  }, []);
  
  // Handle progress updates
  const handleProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, uploadProgress: progress }));
  }, []);
  
  // Handle errors with toast
  const handleError = useCallback((error: Error | string, operation: string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    console.error(`${operation} error:`, errorMessage);
    
    if (showToasts) {
      toast({
        title: `${operation} failed`,
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    setState(prev => ({
      ...prev,
      isUploading: false,
      isDeleting: false,
      error: error instanceof Error ? error : new Error(errorMessage)
    }));
    
    return error instanceof Error ? error : new Error(errorMessage);
  }, [showToasts, toast]);
  
  // Upload file
  const uploadFile = useCallback(async (
    file: File,
    bucket: StorageBucket = StorageBucket.PRODUCTS,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true,
      uploadProgress: 0,
      error: null 
    }));
    
    try {
      const result = await storageService.uploadFile(file, bucket, {
        ...options,
        onProgress: handleProgress
      });
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        lastUploadResult: result
      }));
      
      if (!result.success && showToasts) {
        toast({
          title: 'Upload failed',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.success && showToasts) {
        toast({
          title: 'Upload successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, 'Upload');
      return {
        success: false,
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }, [handleProgress, handleError, showToasts, toast]);
  
  // Upload to slot
  const uploadToSlot = useCallback(async (
    file: File,
    slotNumber: number,
    productId: string,
    options: Omit<UploadOptions, 'slotNumber' | 'productId'> = {}
  ): Promise<UploadResult> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true,
      uploadProgress: 0,
      error: null 
    }));
    
    try {
      const result = await storageService.uploadToSlot(
        file,
        slotNumber,
        productId,
        {
          ...options,
          onProgress: handleProgress
        }
      );
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        lastUploadResult: result
      }));
      
      if (!result.success && showToasts) {
        toast({
          title: 'Slot upload failed',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.success && showToasts) {
        toast({
          title: `Image uploaded to slot ${slotNumber}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, 'Slot upload');
      return {
        success: false,
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Slot upload failed'
      };
    }
  }, [handleProgress, handleError, showToasts, toast]);
  
  // Upload avatar
  const uploadAvatar = useCallback(async (
    file: File,
    userId: string,
    options: Omit<UploadOptions, 'userId'> = {}
  ): Promise<UploadResult> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true,
      uploadProgress: 0,
      error: null 
    }));
    
    try {
      const result = await storageService.uploadAvatar(
        file,
        userId,
        {
          ...options,
          onProgress: handleProgress
        }
      );
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        lastUploadResult: result
      }));
      
      if (!result.success && showToasts) {
        toast({
          title: 'Avatar upload failed',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.success && showToasts) {
        toast({
          title: 'Avatar updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, 'Avatar upload');
      return {
        success: false,
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Avatar upload failed'
      };
    }
  }, [handleProgress, handleError, showToasts, toast]);
  
  // Upload category image
  const uploadCategoryImage = useCallback(async (
    file: File,
    categorySlug: string,
    options: Omit<UploadOptions, 'folder'> = {}
  ): Promise<UploadResult> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true,
      uploadProgress: 0,
      error: null 
    }));
    
    try {
      const result = await storageService.uploadCategoryImage(
        file,
        categorySlug,
        {
          ...options,
          onProgress: handleProgress
        }
      );
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        lastUploadResult: result
      }));
      
      if (!result.success && showToasts) {
        toast({
          title: 'Category image upload failed',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.success && showToasts) {
        toast({
          title: 'Category image updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, 'Category image upload');
      return {
        success: false,
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Category image upload failed'
      };
    }
  }, [handleProgress, handleError, showToasts, toast]);
  
  // Delete file
  const deleteFile = useCallback(async (
    bucket: StorageBucket,
    path: string
  ): Promise<DeleteResult> => {
    setState(prev => ({ 
      ...prev, 
      isDeleting: true,
      error: null 
    }));
    
    try {
      const result = await storageService.deleteFile(bucket, path);
      
      setState(prev => ({ 
        ...prev, 
        isDeleting: false,
        lastDeleteResult: result
      }));
      
      if (!result.success && showToasts) {
        toast({
          title: 'Delete failed',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.success && showToasts) {
        toast({
          title: 'File deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, 'Delete');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }, [handleError, showToasts, toast]);
  
  // Clear slot images
  const clearSlotImages = useCallback(async (
    slotNumber: number
  ): Promise<{ success: boolean; message: string }> => {
    setState(prev => ({ 
      ...prev, 
      isDeleting: true,
      error: null 
    }));
    
    try {
      const result = await storageService.clearSlotImages(slotNumber);
      
      setState(prev => ({ 
        ...prev, 
        isDeleting: false
      }));
      
      if (!result.success && showToasts) {
        toast({
          title: 'Failed to clear slot images',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.success && showToasts) {
        toast({
          title: `Slot ${slotNumber} cleared`,
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, 'Clear slot');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear slot'
      };
    }
  }, [handleError, showToasts, toast]);
  
  // Initialize slot folders
  const initializeSlotFolders = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true,
      error: null 
    }));
    
    try {
      const result = await storageService.initializeSlotFolders();
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false
      }));
      
      if (!result.success && showToasts) {
        toast({
          title: 'Failed to initialize slot folders',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.success && showToasts) {
        toast({
          title: 'Slot folders initialized',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, 'Initialize slots');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize slots'
      };
    }
  }, [handleError, showToasts, toast]);
  
  // List files
  const listFiles = useCallback(async (
    bucket: StorageBucket,
    path: string
  ): Promise<{ files: any[]; error: string | null }> => {
    try {
      return await storageService.listFiles(bucket, path);
    } catch (error) {
      handleError(error as Error, 'List files');
      return {
        files: [],
        error: error instanceof Error ? error.message : 'Failed to list files'
      };
    }
  }, [handleError]);
  
  // Get public URL
  const getPublicUrl = useCallback((
    bucket: StorageBucket,
    path: string
  ): string => {
    return storageService.getPublicUrl(bucket, path);
  }, []);
  
  return {
    // State
    ...state,
    
    // Upload methods
    uploadFile,
    uploadToSlot,
    uploadAvatar,
    uploadCategoryImage,
    
    // Delete methods
    deleteFile,
    clearSlotImages,
    
    // Utility methods
    getPublicUrl,
    listFiles,
    
    // Admin methods
    initializeSlotFolders,
    
    // State management
    resetState
  };
} 