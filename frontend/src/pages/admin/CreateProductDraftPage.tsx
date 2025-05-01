import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/store/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToDashboard from '@/components/admin/BackToDashboard';
import ProductDraftForm from '@/components/admin/forms/ProductDraftForm';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/utils/toast';
import { getAvailableSlotsForProductForm } from '@/services/slots';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import Loading from '@/components/ui/Loading';

const CreateProductDraftPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [errorSlots, setErrorSlots] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setErrorSlots(null);
      try {
        const slotIds = await getAvailableSlotsForProductForm();
        setAvailableSlots(slotIds);
        if (slotIds.length === 0) {
          setErrorSlots(t({ en: 'No empty slots available to create a draft.', fr: 'Aucun emplacement vide disponible pour créer un brouillon.' }));
        }
      } catch (error) {
        console.error("Failed to fetch available slots:", error);
        setErrorSlots(t({ en: 'Failed to load available slots.', fr: 'Échec du chargement des emplacements disponibles.' }));
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [t]);

  const handleSaveSuccess = () => {
    toast.info(t({ en: 'Redirecting to dashboard...', fr: 'Redirection vers le tableau de bord...' }));
    navigate('/admin');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSlotSelect = (value: string) => {
    const slotId = parseInt(value, 10);
    setSelectedSlotId(isNaN(slotId) ? null : slotId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {t({ en: 'Create New Product Draft', fr: 'Créer un Nouveau Brouillon de Produit' })}
        </h1>
        <BackToDashboard />
      </div>

      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <Label htmlFor="slotSelector" className="block text-sm font-medium text-gray-700 mb-2">
          {t({ en: 'Select Target Slot', fr: 'Sélectionner l\'Emplacement Cible' })}
        </Label>
        {isLoadingSlots && <Loading text={t({ en: 'Loading available slots...', fr: 'Chargement des emplacements...' })} />}
        {errorSlots && !isLoadingSlots && <p className="text-sm text-red-600">{errorSlots}</p>}
        {!isLoadingSlots && !errorSlots && availableSlots.length > 0 && (
          <Select 
            onValueChange={handleSlotSelect} 
            value={selectedSlotId?.toString() ?? ''}
          >
            <SelectTrigger id="slotSelector" className="w-full md:w-1/3">
              <SelectValue placeholder={t({ en: 'Choose an empty slot...', fr: 'Choisir un emplacement vide...' })} />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.map(slotId => (
                <SelectItem key={slotId} value={slotId.toString()}>
                  {t({ en: `Slot ${slotId}`, fr: `Emplacement ${slotId}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {selectedSlotId ? (
          <ProductDraftForm 
            slotId={selectedSlotId} 
            onSuccess={handleSaveSuccess} 
            onCancel={handleCancel} 
          />
        ) : (
          <p className="text-gray-500 text-center py-8">
            {isLoadingSlots ? '' : t({ en: 'Please select a target slot above to begin creating the draft.', fr: 'Veuillez sélectionner un emplacement cible ci-dessus pour commencer la création du brouillon.' })}
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateProductDraftPage;