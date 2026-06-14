const fs = require('fs');
let fileContent = fs.readFileSync('src/components/GuiInterface.tsx', 'utf8');

// The best way to handle this is to create a dynamic variable at the top of GuiInterface:
const themeVarsCode = `
  const th = {
    bgMuted: theme === 'light' ? 'bg-[#F4EFEA]' : 'bg-black/20',
    bgCard: theme === 'light' ? 'bg-white' : 'bg-white/5',
    textMain: theme === 'light' ? 'text-[#2C2421]' : 'text-white',
    textMuted: theme === 'light' ? 'text-slate-600' : 'text-slate-400',
    border: theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10',
    borderHl: theme === 'light' ? 'border-[#D0C5B5]' : 'border-white/20',
    shadow: theme === 'light' ? 'shadow-sm shadow-[#2C2421]/5' : 'shadow-none',
    bgBadge: theme === 'light' ? 'bg-[#EAE4DB]' : 'bg-white/10'
  };
`;

// Insert it somewhere at the beginning of the component:
fileContent = fileContent.replace('const [showDbInspector, setShowDbInspector] = useState(false);', 
  'const [showDbInspector, setShowDbInspector] = useState(false);\n' + themeVarsCode);

// Then we can replace raw strings with template literals and these variables, but that's very hard with regex.
// Instead, let's target specific elements that are hardcoded directly.
// e.g. "backdrop-blur-md rounded-3xl p-6 border shadow-2xl transition-all duration-300 bg-white/5 border-white/10"
fileContent = fileContent.replace(
  /"backdrop-blur-md rounded-3xl p-6 border shadow-2xl transition-all duration-300 bg-white\/5 border-white\/10"/g,
  /`backdrop-blur-md rounded-3xl p-6 border shadow-2xl transition-all duration-300 \${th.bgCard} \${th.border}`/
);

fileContent = fileContent.replace(
  /"font-sans font-semibold text-lg flex items-center gap-2 text-white"/g,
  /`font-sans font-semibold text-lg flex items-center gap-2 \${th.textMain}`/
);

fileContent = fileContent.replace(
  /"text-\[10px\] bg-orange-500\/20 border border-orange-500\/30 text-orange-500 px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider"/g,
  /`text-[10px] bg-orange-500\/20 border border-orange-500\/30 text-orange-600 px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider`/
);

fileContent = fileContent.replace(
  /"mb-6 p-3 rounded-2xl border transition-all bg-white\/5 border-white\/10"/g,
  /`mb-6 p-3 rounded-2xl border transition-all \${th.bgCard} \${th.border}`/
);

fileContent = fileContent.replace(
  /"w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all bg-white\/5 border-white\/10 text-white placeholder-slate-400"/g,
  /`w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all \${th.bgCard} \${th.border} \${th.textMain} placeholder-slate-400`/
);

fileContent = fileContent.replace(
  /"text-[10px] text-slate-500 mt-0.5"/g,
  /`text-[10px] \${th.textMuted} mt-0.5`/
);

fileContent = fileContent.replace(
  /className="p-3 bg-black\/20 rounded-xl border border-white\/5/g,
  /className={`p-3 rounded-xl border \${th.bgMuted} \${th.border}/
);

fileContent = fileContent.replace(
  /className="flex items-center justify-between text-white"/g,
  /className={`flex items-center justify-between \${th.textMain}`}/
);

fileContent = fileContent.replace(
  /className="text-xs text-slate-400/g,
  /className={`text-xs \${th.textMuted}/
);

// We should just write a generic replacer for all un-templated `text-white` to `\${th.textMain}` if it's inside a `className="... text-white ..."`
// But many already are in `` templates.

fs.writeFileSync('src/components/GuiInterface.tsx', fileContent);
