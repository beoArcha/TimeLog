const fs = require('fs');

let content = fs.readFileSync('src/components/GuiInterface.tsx', 'utf8');

const themeVarsCode = `
  const th = {
    bgMuted: theme === 'light' ? 'bg-[#F4EFEA]' : 'bg-black/20',
    bgCard: theme === 'light' ? 'bg-[#FCFAF8]' : 'bg-white/5',
    textMain: theme === 'light' ? 'text-[#2C2421]' : 'text-white',
    textMuted: theme === 'light' ? 'text-slate-600' : 'text-slate-400',
    border: theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10',
    borderHl: theme === 'light' ? 'border-[#D0C5B5]' : 'border-white/20',
    shadow: theme === 'light' ? 'shadow-sm shadow-[#2C2421]/5' : 'shadow-lg shadow-black/50',
    bgBadge: theme === 'light' ? 'bg-[#EAE4DB]' : 'bg-white/10'
  };
`;

content = content.replace('const [showDbInspector, setShowDbInspector] = useState(false);', 
  'const [showDbInspector, setShowDbInspector] = useState(false);\n' + themeVarsCode);

// 1. Projects Sidebar replacements
content = content.replace(
  /"backdrop-blur-md rounded-3xl p-6 border shadow-2xl transition-all duration-300 bg-white\/5 border-white\/10"/g,
  /`backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 \${th.bgCard} \${th.border} \${th.shadow}`/
);
content = content.replace(
  /"flex items-center justify-between mb-4 border-b pb-3 border-white\/10"/g,
  /`flex items-center justify-between mb-4 border-b pb-3 \${th.border}`/
);
content = content.replace(
  /"font-sans font-semibold text-lg flex items-center gap-2 text-white"/g,
  /`font-sans font-semibold text-lg flex items-center gap-2 \${th.textMain}`/
);
content = content.replace(
  /"text-\[10px\] bg-orange-500\/20 border border-orange-500\/30 text-orange-500 px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider"/g,
  /'text-[10px] bg-orange-500\/20 border border-orange-500\/30 text-orange-600 px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider'/
);
content = content.replace(
  /"mb-6 p-3 rounded-2xl border transition-all bg-white\/5 border-white\/10"/g,
  /`mb-6 p-3 rounded-2xl border transition-all \${th.bgCard} \${th.border}`/
);
content = content.replace(
  /"w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all bg-white\/5 border-white\/10 text-white placeholder-slate-400"/g,
  /`w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all \${th.bgCard} \${th.border} \${th.textMain} placeholder-slate-400`/
);
content = content.replace(
  /className="text-\[10px\] text-slate-500 mt-0\.5"/g,
  /className={`text-[10px] ${th.textMuted} mt-0.5`}/
);

content = content.replace(
  /className="p-3 bg-black\/20 rounded-xl border border-white\/5 hover:bg-white\/5 transition-all cursor-pointer group"/g,
  /className={`p-3 rounded-xl border transition-all cursor-pointer group ${th.bgMuted} hover:${th.bgCard} ${th.border}`}/
);

content = content.replace(
  /className="p-3 bg-black\/20 rounded-xl border border-white\/5"/g,
  /className={`p-3 rounded-xl border ${th.bgMuted} ${th.border}`}/
);

content = content.replace(
  /className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors"/g,
  /className={`text-xs transition-colors ${th.textMuted} ${theme === 'light' ? 'group-hover:text-slate-900' : 'group-hover:text-slate-300'}`}/
);

content = content.replace(
  /className="flex items-center justify-between text-white"/g,
  /className={`flex items-center justify-between ${th.textMain}`}/
);

content = content.replace(
  /className="w-full text-left px-4 py-2 border-b border-white\/5"/g,
  /className={`w-full text-left px-4 py-2 border-b ${th.border}`}/
);


// We need to also target static text-white inside the subtasks list area
content = content.replace(
  /className="font-semibold text-white/g,
  /className={`font-semibold ${th.textMain}/
);

content = content.replace(
  /className="text-slate-400/g,
  /className={`var-text-muted ${th.textMuted}/
);
content = content.replace(
  /className="text-slate-500/g,
  /className={`var-text-muted2 ${th.textMuted}/
);
content = content.replace(
  /className="text-slate-300/g,
  /className={`var-text-muted3 ${th.textMuted}/
);
content = content.replace(
  /\{`var-text-muted[0-9]? /g,
  /`/
);

content = content.replace(
  /"text-white bg-white\/5"/g,
  /`${th.textMain} \${th.bgCard}`/
);

content = content.replace(
  /"text-white"/g,
  /`\${th.textMain}`/
);

content = content.replace(
  /"flex items-center gap-2 text-white"/g,
  /`flex items-center gap-2 \${th.textMain}`/
);


fs.writeFileSync('src/components/GuiInterface.tsx', content);
