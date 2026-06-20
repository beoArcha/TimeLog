import { useState, useEffect } from 'react';

export const useExternalApiSync = () => {
  const [logToApi, setLogToApi] = useState<boolean>(() => localStorage.getItem('oxytime_log_to_api') === 'true');
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem('oxytime_api_token') || '');
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem('oxytime_api_url') || '');
  const [apiMethod, setApiMethod] = useState<'POST' | 'PUT'>(() => (localStorage.getItem('oxytime_api_method') as 'POST' | 'PUT') || 'POST');
  const [apiHeaders, setApiHeaders] = useState<string>(() => localStorage.getItem('oxytime_api_headers') || '');

  useEffect(() => {
    localStorage.setItem('oxytime_log_to_api', String(logToApi));
    localStorage.setItem('oxytime_api_token', apiToken);
    localStorage.setItem('oxytime_api_url', apiUrl);
    localStorage.setItem('oxytime_api_method', apiMethod);
    localStorage.setItem('oxytime_api_headers', apiHeaders);
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
