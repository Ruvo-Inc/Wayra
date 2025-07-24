'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AdventureDetailView from '@/components/adventure/AdventureDetailView';
import AdventureModal from '@/components/adventure/AdventureModal';
import { Adventure } from '@/types/adventure';
import adventureApi from '@/services/adventureApi';

export default function AdventureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adventureId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(adventureId === 'new');
  const [currentAdventure, setCurrentAdventure] = useState<Adventure | null>(null);
  
  // Check if we came from a collection
  const fromCollection = searchParams.get('from') === 'collection';
  const collectionId = searchParams.get('collectionId');

  const handleEdit = (adventure: Adventure) => {
    console.log('🎯 Edit adventure clicked:', adventure);
    setCurrentAdventure(adventure);
    setIsEditModalOpen(true);
  };

  const handleAdventureUpdated = (updatedAdventure: Adventure) => {
    console.log('✨ Adventure updated:', updatedAdventure);
    setIsEditModalOpen(false);
    setCurrentAdventure(null);
    // Refresh the page to show updated data
    window.location.reload();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentAdventure(null);
  };

  const handleAdventureCreated = (newAdventure: Adventure) => {
    console.log('✨ Adventure created:', newAdventure);
    setIsCreateModalOpen(false);
    // Navigate to the newly created adventure
    router.push(`/adventures/${newAdventure.id}`);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    // Navigate back to the appropriate page based on context
    if (fromCollection && collectionId) {
      console.log('🔙 Closing create modal, navigating back to collection:', collectionId);
      router.push(`/collections/${collectionId}`);
    } else {
      console.log('🔙 Closing create modal, navigating back to adventures list');
      router.push('/adventures');
    }
  };

  const handleDelete = async (adventureId: string) => {
    console.log('🗑️ [DETAIL PAGE] Delete adventure clicked:', adventureId);
    
    // No confirmation dialog needed here - AdventureDetailView handles its own confirmation modal
    try {
      console.log('📡 [DETAIL PAGE] Calling adventureApi.deleteAdventure with ID:', adventureId);
      await adventureApi.deleteAdventure(adventureId);
      console.log('✅ [DETAIL PAGE] Adventure deleted successfully, navigating back');
      router.push('/adventures');
    } catch (error) {
      console.error('❌ [DETAIL PAGE] Error deleting adventure:', error);
      alert('Failed to delete adventure. Please try again.');
    }
  };

  const handleBack = () => {
    // If we came from a collection, navigate back to that collection
    if (fromCollection && collectionId) {
      console.log('🔙 Navigating back to collection:', collectionId);
      router.push(`/collections/${collectionId}`);
    } else {
      console.log('🔙 Navigating back to adventures list');
      router.push('/adventures');
    }
  };

  if (!adventureId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Adventure Not Found</h1>
          <p className="text-gray-600">The adventure you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {adventureId === 'new' ? (
        // Show create adventure modal for 'new' case
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Create New Adventure</h1>
            <p className="text-gray-600 mb-4">The create adventure modal will open automatically.</p>
          </div>
        </div>
      ) : (
        <AdventureDetailView 
          adventureId={adventureId} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBack={handleBack}
        />
      )}
      
      {/* Create Adventure Modal */}
      <AdventureModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onAdventureUpdated={handleAdventureCreated}
        mode="create"
      />
      
      {/* Edit Adventure Modal */}
      {currentAdventure && (
        <AdventureModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onAdventureUpdated={handleAdventureUpdated}
          adventure={currentAdventure}
          mode="edit"
        />
      )}
    </>
  );
}
