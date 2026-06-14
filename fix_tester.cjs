const fs = require('fs');
let content = fs.readFileSync('src/components/TesterAndHelperWizard.tsx', 'utf8');

content = content.replace(
  /\{locale === 'pl' \n\s*\? 'Wybierz język, przeprowadź audyt testów QA lub zapoznaj się z przewodnikiem kompilacji Tauri\.' \n\s*: 'Switch locale, review the QA unit tests suite, or complete the Tauri binary compiler guides\.'\}/m,
  "{'Switch locale, review the QA unit tests suite, or complete the Tauri binary compiler guides.'}"
);

fs.writeFileSync('src/components/TesterAndHelperWizard.tsx', content);
