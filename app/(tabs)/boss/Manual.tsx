// app/(tabs)/boss/Manual.tsx
import React, { useState } from 'react';
import { BOSS_MANUAL_LIST, ManualItem } from '../../../components/manual/BossData';
import { BossManual } from '../../../components/manual/BossManual';
import { BossManualForm } from './BossManualForm';

export default function ManualScreen() {
  const [selectedManual, setSelectedManual] = useState<ManualItem | null>(null);
  const [manualList, setManualList] = useState<ManualItem[]>(BOSS_MANUAL_LIST);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (newItem: ManualItem) => {
    if (isEditing) {
      setManualList(prev => prev.map(item => item.id === newItem.id ? newItem : item));
    } else {
      setManualList(prev => [newItem, ...prev]);
    }
    setIsRegistering(false);
    setIsEditing(false);
    setSelectedManual(null);
  };

  if (isRegistering || isEditing) {
    return (
      <BossManualForm 
        mode={isEditing ? 'edit' : 'register'} 
        initialData={isEditing ? selectedManual : null} 
        onClose={() => {
          setIsRegistering(false);
          setIsEditing(false);
        }} 
        onSave={handleSave} 
      />
    );
  }

  return (
    <BossManual 
      manualList={manualList}
      setManualList={setManualList}
      selectedManual={selectedManual} 
      onSelect={(item: ManualItem | null) => setSelectedManual(item)}
      onRegister={() => setIsRegistering(true)} 
      onEdit={() => setIsEditing(true)}
    />
  );
}