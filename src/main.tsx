import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LocaleProvider } from '@core/providers/LocaleProvider';
import { OxyProvider } from '@core/providers/OxyContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <OxyProvider>
        <App />
      </OxyProvider>
    </LocaleProvider>
  </StrictMode>,
);
