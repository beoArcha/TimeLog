const fs = require('fs');
let text = fs.readFileSync('src/utils/translations.ts', 'utf8');

if (!text.includes('| \'system\'')) {
  text = text.replace(/export type LocaleType =.*/, "export type LocaleType = 'pl' | 'en' | 'de' | 'es' | 'pt-br' | 'fr' | 'custom' | 'system';");
}

fs.writeFileSync('src/utils/translations.ts', text);
