const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf-8');
file = file.replace(/setHolidays=\{setHolidays\}/g, "setHolidays={setHolidays}\n                        patches={patches}\n                        sysSettings={sysSettings}");
fs.writeFileSync('src/App.tsx', file, 'utf-8');
