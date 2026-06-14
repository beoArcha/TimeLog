const fs = require('fs');

let t = fs.readFileSync('src/components/DbExplorer.tsx', 'utf8');

if (!t.includes("import CollapsibleCard")) {
  t = t.replace("import { Database, Trash2, Edit3, Check, X, RefreshCw, Plus, Clock, HelpCircle, History, Info, ChevronDown, ChevronRight } from 'lucide-react';", 
    "import { Database, Trash2, Edit3, Check, X, RefreshCw, Plus, Clock, HelpCircle, History, Info, ChevronDown, ChevronRight } from 'lucide-react';\nimport CollapsibleCard from './CollapsibleCard';");
}


// Replace Projects
t = t.replace(/<div className=\{\`p-6 rounded-3xl border shadow-xl \$\{themeClasses\.wrapper\}\`\}>\s*<div className="flex items-center justify-between mb-4 pb-2 border-b border-white\/5 cursor-pointer" onClick=\{\(\) => toggleSection\('projects'\)\}>\s*<h3 className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">\s*projects table \(\{projects\.length\} rekordy\)\s*<\/h3>\s*\{expandedSections\.projects \? [^}]*\}\s*<\/div>\s*\{expandedSections\.projects && \(\s*<div className="overflow-x-auto w-full animate-in fade-in slide-in-from-top-2 duration-300">/, 
`<CollapsibleCard
          title={\`projects table (\${projects.length} rekordy)\`}
          icon={Database}
          iconColor="text-orange-400"
          titleColor="text-orange-400"
          defaultExpanded={true}
          wrapperClassName={\`p-6 rounded-3xl border shadow-xl \${themeClasses.wrapper}\`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-orange-400"
          headerRight={null}
        >
          <div className="overflow-x-auto w-full">`);

t = t.replace(/<div className=\{\`p-6 rounded-3xl border shadow-xl \$\{themeClasses\.wrapper\}\`\}>\s*<div className="flex items-center justify-between mb-4 pb-2 border-b border-white\/5 cursor-pointer" onClick=\{\(\) => toggleSection\('tasks'\)\}>\s*<h3 className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">\s*tasks table \(\{tasks\.length\} rekordów\)\s*<\/h3>\s*\{expandedSections\.tasks \? [^}]*\}\s*<\/div>\s*\{expandedSections\.tasks && \(\s*<div className="overflow-x-auto w-full[^"]*">/,
`<CollapsibleCard
          title={\`tasks table (\${tasks.length} rekordów)\`}
          icon={Database}
          iconColor="text-teal-400"
          titleColor="text-teal-400"
          defaultExpanded={true}
          wrapperClassName={\`p-6 rounded-3xl border shadow-xl \${themeClasses.wrapper}\`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-teal-400"
        >
          <div className="overflow-x-auto w-full">`);


t = t.replace(/<div className=\{\`p-6 rounded-3xl border shadow-xl \$\{themeClasses\.wrapper\}\`\}>\s*<div className="flex items-center justify-between mb-4 pb-2 border-b border-white\/5 cursor-pointer" onClick=\{\(\) => toggleSection\('logs'\)\}>\s*<h3 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">\s*time_logs table \(\{logs\.length\} rekordy\)\s*<\/h3>[\s\S]*?\{expandedSections\.logs && \(\s*<div className="overflow-x-auto w-full[^"]*">/,
(match) => {
  // Extracting the inner header stuff
  // actually simpler to just replace entirely.
  return `<CollapsibleCard
          title={\`time_logs table (\${logs.length} rekordy)\`}
          icon={Database}
          iconColor="text-indigo-400"
          titleColor="text-indigo-400"
          defaultExpanded={true}
          wrapperClassName={\`p-6 rounded-3xl border shadow-xl \${themeClasses.wrapper}\`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 text-left"
          headerRight={
            <button
              onClick={() => {
                setShowAddLogForm(!showAddLogForm);
                if (tasks.length > 0) {
                  setNewLogForm(prev => ({ ...prev, taskId: tasks[0].id }));
                }
              }}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj Log Ręcznie (INSERT SQL)
            </button>
          }
        >
          <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Wpisy są kluczowe: na ich podstawie liczony jest czas. Działa to wstecznie, nie trzeba być zalogowanym na żywo.</p>
          <div className="overflow-x-auto w-full">`;
});

t = t.replace(/<div className=\{\`p-6 rounded-3xl border shadow-xl \$\{themeClasses\.wrapper\}\`\}>\s*<div className="flex items-center justify-between mb-4 pb-2 border-b border-white\/5 cursor-pointer" onClick=\{\(\) => toggleSection\('holidays'\)\}>\s*<h3 className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">\s*holidays_leaves table \(\{holidays\.length\} rekordów\)\s*<\/h3>[\s\S]*?\{expandedSections\.holidays && \(\s*<div className="overflow-x-auto w-full[^"]*">/,
`<CollapsibleCard
          title={\`holidays_leaves table (\${holidays.length} rekordów)\`}
          icon={Database}
          iconColor="text-rose-400"
          titleColor="text-rose-400"
          defaultExpanded={true}
          wrapperClassName={\`p-6 rounded-3xl border shadow-xl \${themeClasses.wrapper}\`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-rose-400"
          headerRight={
            <button
              onClick={() => {
                const newEntity: HolidayLeave = { 
                  id: \`e\${Date.now()}\`, 
                  date: new Date().toISOString().slice(0, 10), 
                  type: 'holiday', 
                  name: 'Nowe Święto/Dzień wolny' 
                };
                setHolidays(prev => [...prev, newEntity]);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
            >
              + Dodaj Wolne (SQL INSERT)
            </button>
          }
        >
          <div className="overflow-x-auto w-full">`);


t = t.replace(/<div className=\{\`p-6 rounded-3xl border shadow-xl \$\{themeClasses\.wrapper\}\`\}>\s*<div className="flex items-center justify-between mb-4 pb-2 border-b border-white\/5 cursor-pointer" onClick=\{\(\) => toggleSection\('patches'\)\}>\s*<h3 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">\s*patch_logs table \(\{patches\.length\} rekordów\)\s*<\/h3>[\s\S]*?\{expandedSections\.patches && \(\s*<div className="overflow-x-auto w-full[^"]*">/, 
`<CollapsibleCard
          title={\`patch_logs table (\${patches.length} rekordów)\`}
          icon={Database}
          iconColor="text-emerald-400"
          titleColor="text-emerald-400"
          defaultExpanded={true}
          wrapperClassName={\`p-6 rounded-3xl border shadow-xl \${themeClasses.wrapper}\`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400"
          headerRight={
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Read-Only Sync Checkpoints
            </div>
          }
        >
          <div className="overflow-x-auto w-full">`);



// The regex approach failed slightly on previous attempts because the `DbExplorer` wasn't properly matched.
// Since the user noted "W poderzeni bazy, kązda tabela", let's fix it by searching for every ending `)}`
// Instead, let's just let the files close it themselves as previously `)` was used for the condition:
// `{expandedSections.projects && ( <div ... > ` and then at the end `)} </div>`
// I need to change the closing `)}\n          </div>` to just `</CollapsibleCard>`

// Find instances of `  )}\n        </div>` or similar corresponding to the end of sections.
// Note: Each section ends with `\n        </div>` normally, but because of my previous script they ended with `)}` and `</div>`.

t = t.replace(/\s*\)\}\n\s*<\/div>/g, "\n        </CollapsibleCard>");


fs.writeFileSync('src/components/DbExplorer.tsx', t);
console.log('done!');
