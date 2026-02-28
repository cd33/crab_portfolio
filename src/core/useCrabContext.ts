import { useContext } from 'react';
import type { CrabContextType } from './crabContext';
import { CrabContext } from './crabContext';

/**
 * Hook to access CrabContext
 * Must be used within CrabProvider
 */
export function useCrabContext(): CrabContextType {
  const context = useContext(CrabContext);
  if (!context) {
    throw new Error('useCrabContext must be used within CrabProvider');
  }
  return context;
}
