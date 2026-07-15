export const TEST_CONSTANTS = {
  // External API Sync
  API_URL: 'https://myapi.com/logs',
  API_TOKEN: 'my-token',
  API_TOKEN_SHORT: 'tok',
  
  // Global Shortcuts
  EVENT_KEYDOWN: 'keydown',
  KEY_SPACE: 'Space',
  KEY_DIGIT1: 'Digit1',
  KEY_DIGIT4: 'Digit4',
  KEY_ESCAPE: 'Escape',
  TAG_INPUT: 'input',
  
  // Time Ticker
  ONE_SECOND: 1000,
  
  // Mock Data IDs
  PROJECT_ID_1: '1',
  PROJECT_ID_2: '2',
  TASK_ID_101: '101',
  TASK_ID_102: '102',
  TASK_ID_1021: '1021',
  
  // Tauri Window Tests
  TOAST_FULL: 'Rozmiar zmieniony na PEŁNY (Maksymalizacja)',
  TOAST_GUI_PREFIX: 'GUI: ',
  TOAST_ALWAYS_ON_TOP_ON: 'Zawsze na wierzchu: WŁĄCZONE',
  TOAST_ALWAYS_ON_TOP_OFF: 'Zawsze na wierzchu: WYŁĄCZONE',
} as const;
