import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../common/constants';

export const useExternalApiSync = () => {
  const [logToApi, setLogToApi] = useState<boolean>(() => localStorage.getItem(STORAGE_KEYS.LOG_TO_API) === 'true');
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.API_TOKEN) || '');
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.API_URL) || '');
  const [apiMethod, setApiMethod] = useState<'POST' | 'PUT'>(() => (localStorage.getItem(STORAGE_KEYS.API_METHOD) as 'POST' | 'PUT') || 'POST');
  const [apiHeaders, setApiHeaders] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.API_HEADERS) || '');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOG_TO_API, String(logToApi));
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, apiToken);
    localStorage.setItem(STORAGE_KEYS.API_URL, apiUrl);
    localStorage.setItem(STORAGE_KEYS.API_METHOD, apiMethod);
    localStorage.setItem(STORAGE_KEYS.API_HEADERS, apiHeaders);
  }, [logToApi, apiToken, apiUrl, apiMethod, apiHeaders]);

  const pushToApi = (payload: any, logMsg: string) => {
    if (logToApi && apiUrl) {
      let headersObj = {};
      try {
        if (apiHeaders) headersObj = JSON.parse(apiHeaders);
      } catch (e) {
        console.error('Failed parse headers json');
      }
      fetch(apiUrl, {
        method: apiMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
          ...headersObj,
        },
        body: JSON.stringify(payload),
      }).catch(err => console.error('Failed API:', err));
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
