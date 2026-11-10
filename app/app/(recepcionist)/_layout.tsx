import RecepcionistNavBar from '@/components/recepcionista/RecepcionistNavBar';
import { BackHandlerProvider } from '@/contexts/BackHandlerContext';
import { BranchProvider } from '@/contexts/BranchContext';
import React from 'react';

export default function RecepcionistLayout() {
  return (
    <BackHandlerProvider>
      <BranchProvider>
        <RecepcionistNavBar />
      </BranchProvider>
    </BackHandlerProvider>
  );
}
