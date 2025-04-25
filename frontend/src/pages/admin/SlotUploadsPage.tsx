import React from 'react';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../layouts/AdminLayout';
import SlotImageUploader from '../../components/admin/SlotImageUploader';
import { useLanguage } from '../../store/LanguageContext';

const SlotUploadsPage: React.FC = () => {
  const { t } = useLanguage();
  
  // Text content
  const text = {
    pageTitle: { 
      en: 'Slot Image Management', 
      fr: 'Gestion des Images par Emplacement' 
    },
    pageDescription: { 
      en: 'Upload and manage images for each slot directly', 
      fr: 'Télécharger et gérer les images pour chaque emplacement directement' 
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>{t(text.pageTitle)} | SokoClick Admin</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">{t(text.pageTitle)}</h1>
        <p className="text-gray-600 mb-6">{t(text.pageDescription)}</p>
        
        {/* Slot Image Uploader Component */}
        <SlotImageUploader />
      </div>
    </AdminLayout>
  );
};

export default SlotUploadsPage; 