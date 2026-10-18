import { useState, useEffect } from 'react';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler, NetworkException } from '../exceptions';
import { WebhookDispatcher, WebhookSyncStatus } from '@common/sinks/WebhookDispatcher';

export const useExternalApiSync = () => {
  const [logToApi, setLogToApi] = useState<boolean>(false);
  const [apiToken, setApiToken] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiMethod, setApiMethod] = useState<'POST' | 'PUT'>('POST');
  const [apiHeaders, setApiHeaders] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<WebhookSyncStatus>(
    WebhookDispatcher.getInstance().getStatus()
  );

  useEffect(() => {
    const unsubscribe = WebhookDispatcher.getInstance().subscribe(setSyncStatus);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    PersistenceRouter.getInstance().externalApi.getSettings().then(settings => {
      setLogToApi(settings.logToApi);
      setApiToken(settings.apiToken);
      setApiUrl(settings.apiUrl);
      setApiMethod(settings.apiMethod);
      setApiHeaders(settings.apiHeaders);
      setLoaded(true);
    }).catch(ErrorHandler.handle);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    PersistenceRouter.getInstance().externalApi.saveSettings({
      logToApi, apiToken, apiUrl, apiMethod, apiHeaders
    }).catch(ErrorHandler.handle);
  }, [logToApi, apiToken, apiUrl, apiMethod, apiHeaders, loaded]);

  const pushToApi = async (payload: unknown, logMsg: string) => {
    if (!logToApi || !apiUrl) {
      console.log(`[FILE APPEND logs.txt] ${logMsg}`);
    }
    try {
      await WebhookDispatcher.getInstance().enqueue(payload, logMsg);
    } catch (err) {
      ErrorHandler.handle(new NetworkException('Failed API call dispatch', err, 'ERR_NETWORK_API'));
    }
  };

  const retryNow = () => {
    WebhookDispatcher.getInstance().retryNow().catch(ErrorHandler.handle);
  };

  return {
    logToApi, setLogToApi,
    apiToken, setApiToken,
    apiUrl, setApiUrl,
    apiMethod, setApiMethod,
    apiHeaders, setApiHeaders,
    pushToApi,
    syncStatus,
    retryNow,
  };
};
