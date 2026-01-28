// app/(tabs)/staff/Manual.tsx
import React, { useState } from 'react';
import { ManualItem } from '../../../components/manual/StaffData';
import { StaffManual } from '../../../components/manual/StaffManual';

export default function ManualScreen() {
  const [selectedManual, setSelectedManual] = useState<ManualItem | null>(null);

  return (
    <StaffManual 
      selectedManual={selectedManual} 
      onSelect={setSelectedManual} 
    />
  );
}