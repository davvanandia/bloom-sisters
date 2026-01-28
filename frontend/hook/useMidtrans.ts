import { useEffect, useState } from 'react';

interface UseMidtransReturn {
  snap: any;
  isLoading: boolean;
  error: string | null;
}

export const useMidtrans = (): UseMidtransReturn => {
  const [snap, setSnap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMidtransLoaded = () => {
      if (typeof window !== 'undefined' && (window as any).snap) {
        setSnap((window as any).snap);
        setIsLoading(false);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkMidtransLoaded()) return;

    // If not loaded, wait a bit and check again
    const interval = setInterval(() => {
      if (checkMidtransLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!snap) {
        setError('Midtrans SDK failed to load');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return { snap, isLoading, error };
};

// Utility function to open Midtrans payment
export const openMidtransPayment = (token: string, options?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).snap) {
      reject(new Error('Midtrans SDK not loaded'));
      return;
    }

    (window as any).snap.pay(token, {
      onSuccess: (result: any) => {
        resolve({ status: 'success', result });
      },
      onPending: (result: any) => {
        resolve({ status: 'pending', result });
      },
      onError: (result: any) => {
        reject(new Error('Payment failed'));
      },
      onClose: () => {
        reject(new Error('Payment modal closed'));
      },
      ...options
    });
  });
};