const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf-8');
file = file.replace(/onStopTimer=\{handleStopTimer\}\n(\s+)nowIso=\{nowIso\}/g, "onStopTimer={handleStopTimer}\n$1onToggleProjectArchive={handleToggleProjectArchive}\n$1nowIso={nowIso}");
fs.writeFileSync('src/App.tsx', file, 'utf-8');
