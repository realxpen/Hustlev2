import { useState, useCallback } from 'react';
import { useWalletStore } from '../stores/useWalletStore';

export function useEscrow() {
  const { 
    holdEscrowFunds, 
    releaseEscrowFunds, 
    refundEscrowFunds, 
    escrows,
    fetchEscrowAccounts,
    isLoading: storeIsLoading,
    error: storeError
  } = useWalletStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lockEscrowFunds = useCallback(async (bookingId: string, amount: number) => {
    setIsProcessing(true);
    setError(null);
    try {
      const success = await holdEscrowFunds(bookingId, amount);
      if (!success) {
        setError('Failed to hold escrow funds');
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'An error occurred during escrow hold');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [holdEscrowFunds]);

  const releaseFunds = useCallback(async (clientId: string, hustlerId: string, bookingId: string, totalAmount: number, payoutAmount: number, platformFee: number) => {
    setIsProcessing(true);
    setError(null);
    try {
      const success = await releaseEscrowFunds(bookingId, clientId, hustlerId, totalAmount, payoutAmount, platformFee);
      if (!success) {
        setError('Failed to release escrow funds');
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'An error occurred during escrow release');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [releaseEscrowFunds]);

  const refundFunds = useCallback(async (clientId: string, bookingId: string, amount: number) => {
    setIsProcessing(true);
    setError(null);
    try {
      const success = await refundEscrowFunds(bookingId, clientId, amount);
      if (!success) {
        setError('Failed to refund escrow funds');
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'An error occurred during escrow refund');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [refundEscrowFunds]);

  return {
    lockEscrowFunds,
    releaseEscrowFunds: releaseFunds,
    refundEscrowFunds: refundFunds,
    escrows,
    fetchEscrowAccounts,
    isProcessing: isProcessing || storeIsLoading,
    error: error || storeError
  };
}
