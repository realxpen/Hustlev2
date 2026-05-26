import { useState } from 'react';
import { useWalletStore } from '../stores/useWalletStore';

export function useWithdrawal() {
  const { initiateWithdrawal: storeInitiateWithdrawal } = useWalletStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestWithdrawal = async (amount: number, destinationAccount?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await storeInitiateWithdrawal(amount, destinationAccount);
      if (!res.success) {
        throw new Error(res.error || 'Withdrawal failed');
      }
      return res.transactionId;
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err.message || 'Withdrawal failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    requestWithdrawal,
    isProcessing,
    error
  };
}
