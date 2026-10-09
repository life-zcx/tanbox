import { useState, useEffect, useCallback } from 'react';
import { NCALayerService } from '../services/ncalayer.service';

export function useNCALayer() {
  const [isRunning, setIsRunning] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(false);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    const available = await NCALayerService.isNCALayerRunning(2000);
    setIsRunning(available);
    setChecking(false);
    return available;
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const sign = useCallback(
    async (
      rawData: string,
      storageType: string = 'PKCS12',
      keyType: string = 'SIGNATURE',
      attachContent: boolean = false
    ) => {
      return await NCALayerService.signData(rawData, storageType, keyType, attachContent);
    },
    []
  );

  return {
    isRunning,
    checking,
    checkStatus,
    sign,
  };
}
