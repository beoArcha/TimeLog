const fs = require('fs');
let t = fs.readFileSync('src/components/DbExplorer.tsx', 'utf8');

t = t.replace(
/            <\/table>\n          <\/div>\n        <\/div>\n\n        \{\/\* TABELA 4: PATCH_LOGS \*\/\}[\s\S]*?className="px-3 py-1\.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs flex items-center gap-1\.5 cursor-pointer shadow transition-all hover:scale-\[1\.01\]"\n            >\n              <Plus className="w-3\.5 h-3\.5" \/>\n              Dodaj Łatkę Czasową\n            <\/button>\n          <\/div>\n          <div className="overflow-x-auto w-full max-h-\[300px\] overflow-y-auto">/,
`            </table>
          </div>
        </CollapsibleCard>

        {/* TABELA 4: PATCH_LOGS */}
        <CollapsibleCard
          title={\`patch_logs table (\${patches?.length || 0} rekordy)\`}
          icon={Database}
          iconColor="text-emerald-400"
          titleColor="text-emerald-400"
          defaultExpanded={true}
          wrapperClassName={\`p-6 rounded-3xl border shadow-xl \${themeClasses.wrapper}\`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 text-left"
          headerRight={
            <button
              onClick={() => {
                const start = prompt("Podaj czas startowy (YYYY-MM-DDTHH:mm:ss.sssZ):", new Date().toISOString());
                const end = prompt("Podaj czas końcowy (YYYY-MM-DDTHH:mm:ss.sssZ):", new Date(Date.now() + 3600000).toISOString());
                const note = prompt("Powód łatki (patchNote):", "Korekta po uśpieniu systemu");
                if (start && end && projects.length > 0) {
                  setPatches(prev => [...prev, {
                    id: \`patch_\${Date.now()}\`,
                    projectId: projects[0].id,
                    startTime: start,
                    endTime: end,
                    patchNote: note || ''
                  }]);
                }
              }}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj Łatkę Czasową
            </button>
          }
        >
          <p className="text-[11px] text-slate-400 mb-4 mt-0.5">Tabela łatek pozwala łatać przerwy uśpienia, lub tworzyć ręcznie nowe okresy do uwzględnienia w ogólnym czasie pracy.</p>
          <div className="overflow-x-auto w-full max-h-[300px] overflow-y-auto">`
);

fs.writeFileSync('src/components/DbExplorer.tsx', t);
console.log('tabela 4 patches done');
