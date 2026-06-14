const fs = require('fs');
let text = fs.readFileSync('src/components/GuiInterface.tsx', 'utf8');

text = text.replace(/\/className=\/`\/\$\{th.textMuted\}\//g, 'className={` ${th.textMuted}');
text = text.replace(/\/className=\/`\/\$\{th.textMain\}\//g, 'className={` ${th.textMain}');

text = text.replace(/\/`flex items-center gap-2 \$\{th.textMain\}`\//g, '`flex items-center gap-2 ${th.textMain}`');
text = text.replace(/\/`\$\{th.textMain\}`\//g, '`${th.textMain}`');
text = text.replace(/\/`\$\{th.textMain\} \$\{th.bgCard\}`\//g, '`${th.textMain} ${th.bgCard}`');
text = text.replace(/\/className=`flex items-center justify-between \$\{th.textMain\}`\//g, 'className={`flex items-center justify-between ${th.textMain}`}');
text = text.replace(/\/className=`text-xs transition-colors \$\{th.textMuted\} \$\{theme === 'light' \? 'group-hover:text-slate-900' : 'group-hover:text-slate-300'\}`\//g, 'className={`text-xs transition-colors ${th.textMuted} ${theme === "light" ? "group-hover:text-slate-900" : "group-hover:text-slate-300"}`}');

text = text.replace(/\/className=`p-3 rounded-xl border \$\{th.bgMuted\} \$\{th.border\}`\//g, 'className={`p-3 rounded-xl border ${th.bgMuted} ${th.border}`}');

text = text.replace(/\/className=`p-3 rounded-xl border transition-all cursor-pointer group \$\{th.bgMuted\} hover:\$\{th.bgCard\} \$\{th.border\}`\//g, 'className={`p-3 rounded-xl border transition-all cursor-pointer group ${th.bgMuted} hover:${th.bgCard} ${th.border}`}');

text = text.replace(/\/className=`text-\[10px\] \$\{th.textMuted\} mt-0.5`\//g, 'className={`text-[10px] ${th.textMuted} mt-0.5`}');

text = text.replace(/\/`w-full text-left px-4 py-2 border-b \$\{th.border\}`\//g, '`w-full text-left px-4 py-2 border-b ${th.border}`');

text = text.replace(/\/`w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all \$\{th.bgCard\} \$\{th.border\} \$\{th.textMain\} placeholder-slate-400`\//g, '`w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all ${th.bgCard} ${th.border} ${th.textMain} placeholder-slate-400`');

text = text.replace(/\/`mb-6 p-3 rounded-2xl border transition-all \$\{th.bgCard\} \$\{th.border\}`\//g, '`mb-6 p-3 rounded-2xl border transition-all ${th.bgCard} ${th.border}`');

text = text.replace(/\/`font-sans font-semibold text-lg flex items-center gap-2 \$\{th.textMain\}`\//g, '`font-sans font-semibold text-lg flex items-center gap-2 ${th.textMain}`');

text = text.replace(/\/`flex items-center justify-between mb-4 border-b pb-3 \$\{th.border\}`\//g, '`flex items-center justify-between mb-4 border-b pb-3 ${th.border}`');

text = text.replace(/\/`backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 \$\{th.bgCard\} \$\{th.border\} \$\{th.shadow\}`\//g, '`backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 ${th.bgCard} ${th.border} ${th.shadow}`');


fs.writeFileSync('src/components/GuiInterface.tsx', text);
