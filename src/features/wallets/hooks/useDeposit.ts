import { useState } from 'react';
import { useWalletStore } from '../stores/useWalletStore';

export function useDeposit() {
  const { initiateDeposit: storeInitiateDeposit } = useWalletStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateDeposit = async (amount: number, _paymentMethodId?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await storeInitiateDeposit(amount);
      if (!res.success) {
        throw new Error(res.error || 'Deposit failed');
      }
      return res.transactionId;
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err.message || 'Deposit failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    initiateDeposit,
    isProcessing,
    error
  };
}
