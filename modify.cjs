const fs = require('fs');
let text = fs.readFileSync('src/components/DbExplorer.tsx', 'utf8');

text = text.replace(/import \{ Database, Trash2, Edit3, Check, X, RefreshCw, Plus, Clock, HelpCircle, History, Info \} from 'lucide-react';/, "import { Database, Trash2, Edit3, Check, X, RefreshCw, Plus, Clock, HelpCircle, History, Info, ChevronDown, ChevronRight } from 'lucide-react';");

text = text.replace(/const \[showAddLogForm, setShowAddLogForm\] = useState\(false\);/, 
`const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    projects: false,
    tasks: false,
    logs: false,
    holidays: false,
    patches: false
  });
  
  const toggleSection = (key: keyof typeof expandedSections) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));`);

function processSection(rawText, titleColorClass, keyword, stateKey, extraTitleItems = "") {
  // Finds the container that wraps the table
  // And inserts the conditional
  const regex = new RegExp(
    `(<div className="flex (?:flex-col sm:flex-row sm:)?items-center justify-between mb-4 pb-2 border-b border-white\\/5">\\s*<h3 className="text-xs font-mono font-bold uppercase tracking-widest ${titleColorClass}">\\s*${keyword} table .*?\\s*<\\/h3>${extraTitleItems}\\s*<\\/div>)\\s*<div className="overflow-x-auto w-full">`,
    'g'
  );
  
  let result = rawText.replace(regex, (match, headerDiv) => {
    // Modify headerDiv to be clickable and add chevron
    const modifiedHeader = headerDiv.replace(/<div className="([^"]+)">/, `<div className="$1 cursor-pointer" onClick={() => toggleSection('${stateKey}')}>`)
      .replace(/<\/div>$/, `  {expandedSections.${stateKey} ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}\n          </div>`);
      
    return `${modifiedHeader}
          {expandedSections.${stateKey} && (
          <div className="overflow-x-auto w-full animate-in fade-in slide-in-from-top-2 duration-300">`;
  });
  
  return result;
}

text = processSection(text, 'text-orange-400', 'projects', 'projects');
text = processSection(text, 'text-teal-400', 'tasks', 'tasks');
text = processSection(text, 'text-indigo-400', 'logs', 'logs', '[\\s\\S]*?'); // matches the buttons in log table too
text = processSection(text, 'text-rose-400', 'holidays', 'holidays');
text = processSection(text, 'text-emerald-400', 'patch_logs', 'patches');


// Now we have to close the conditions `)}`
// They end right before the next `<div className={\`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}\`}>` or at the end of the lists.
// Since there's 5 sections and each is exactly a `<div className={\`p-6 rounded-3xl border shadow-xl...`
// we can do a split and join.

const parts = text.split(/<div className=\{\`p-6 rounded-3xl border shadow-xl \$\{themeClasses\.wrapper\}\`\}>/);
for (let i = 1; i < parts.length; i++) {
  // every part starting from 1 is a section. At the end of the section there is the closing `</div>` of the section wrapper.
  // We need to insert `)}` right before the last `</div>`.
  // Or rather, there are `</div>` matching the overflow div, then `</div>` matching the section.
  let p = parts[i];
  if (p.includes('expandedSections.')) {
    // we added an open `{expandedSections.X && (` 
    // The structure is: 
    //   <div overflow>
    //     <table>...</table>
    //   </div>
    // </div> <-- end of section wrapper
    
    // We just find the last `</div>` and insert `)}` before it.
    let lastDivIdx = p.lastIndexOf('</div>');
    if (lastDivIdx !== -1) {
      parts[i] = p.substring(0, lastDivIdx) + '  )}\n        </div>' + p.substring(lastDivIdx + 6);
    }
  }
}

text = parts.join('<div className={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}>');

fs.writeFileSync('src/components/DbExplorer.tsx', text);
console.log('done modifying DbExplorer');
