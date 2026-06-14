const fs = require('fs');
let content = fs.readFileSync('src/components/DbExplorer.tsx', 'utf8');

content = content.replace(/rekordy\)/g, "${translate(locale, 'dynamic.records', customTranslations)})");
content = content.replace(/rekordów\)/g, "${translate(locale, 'dynamic.recordsPlural', customTranslations)})");
content = content.replace(/akcje \(SQL CRUD\)/g, "{translate(locale, 'dynamic.actionsCrud', customTranslations)}");
content = content.replace(/original \(oryginał\)/g, "{translate(locale, 'dynamic.originalValue', customTranslations)}");

fs.writeFileSync('src/components/DbExplorer.tsx', content);
