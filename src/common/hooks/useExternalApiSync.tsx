import { useState, useEffect } from 'react';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler, NetworkException, PersistenceException } from '../exceptions';

export const useExternalApiSync = () => {
  const [logToApi, setLogToApi] = useState<boolean>(false);
  const [apiToken, setApiToken] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiMethod, setApiMethod] = useState<'POST' | 'PUT'>('POST');
  const [apiHeaders, setApiHeaders] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

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

  const pushToApi = (payload: unknown, logMsg: string) => {
    if (logToApi && apiUrl) {
      let headersObj: Record<string, string> = {};
      try {
        if (apiHeaders) headersObj = JSON.parse(apiHeaders);
      } catch (err) {
        ErrorHandler.handle(new PersistenceException('Failed parse headers json', err, 'ERR_PARSE_HEADERS'));
      }
      fetch(apiUrl, {
        method: apiMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
          ...headersObj,
        },
        body: JSON.stringify(payload),
      }).catch(err => ErrorHandler.handle(new NetworkException('Failed API call', err, 'ERR_NETWORK_API')));
    } else {
      console.log(`[FILE APPEND logs.txt] ${logMsg}`);
    }
  };

  return {
    logToApi, setLogToApi,
    apiToken, setApiToken,
    apiUrl, setApiUrl,
    apiMethod, setApiMethod,
    apiHeaders, setApiHeaders,
    pushToApi,
  };
};
