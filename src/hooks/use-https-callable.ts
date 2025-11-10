import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { app } from '@/lib/firebase';

interface HttpsCallableHook<T, R> {
  callFunction: (data?: T) => Promise<HttpsCallableResult<R> | undefined>;
  isLoading: boolean;
  error: Error | null;
}

export const useHttpsCallable = <T = any, R = any>(functionName: string): HttpsCallableHook<T, R> => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const functions = getFunctions(app);

  const callFunction = useCallback(async (data?: T) => {
    setIsLoading(true);
    setError(null);
    try {
      const callableFunction = httpsCallable<T, R>(functions, functionName);
      const result = await callableFunction(data);
      setIsLoading(false);
      return result;
    } catch (err: any) {
      console.error(`Error calling Firebase function ${functionName}:`, err);
      setError(err);
      setIsLoading(false);
      throw err;
    }
  }, [functionName, functions]);

  return { callFunction, isLoading, error };
};
