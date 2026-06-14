const fs = require('fs');

const path = 'src/components/GuiInterface.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  'bg-white': 'bg-[#FCFAF8]',
  'bg-slate-50': 'bg-[#F4EFEA]',
  'bg-slate-100': 'bg-[#EAE4DB]',
  'bg-slate-200': 'bg-[#DFD7CB]',
  
  'hover:bg-slate-50': 'hover:bg-[#F4EFEA]',
  'hover:bg-slate-100': 'hover:bg-[#EAE4DB]',
  'hover:bg-slate-200': 'hover:bg-[#DFD7CB]',

  'border-slate-100': 'border-[#EAE4DB]',
  'border-slate-200': 'border-[#DFD7CB]',
  'border-slate-300': 'border-[#D0C5B5]',

  'text-slate-900': 'text-[#2C2421]',
  'text-slate-800': 'text-[#2C2421]',
  'text-slate-700': 'text-[#5A4A42]',
  'text-slate-600': 'text-[#7A6A61]',
  'text-slate-500': 'text-[#8A7A71]',
  'text-slate-400': 'text-[#9B8C83]',
  
  'placeholder-slate-400': 'placeholder-[#9B8C83]',
  'placeholder-slate-500': 'placeholder-[#8A7A71]',
  
  'shadow-slate-100/50': 'shadow-[#DFD7CB]/50',
  'shadow-slate-100': 'shadow-[#DFD7CB]'
};

for (const [key, value] of Object.entries(replacements)) {
  const safeKey = key.replace(/\//g, '\\\\/');
  const regex = new RegExp("([^a-zA-Z0-9_-])" + safeKey + "([^a-zA-Z0-9_-])", 'g');
  content = content.replace(regex, "$1" + value + "$2");
}

fs.writeFileSync(path, content);

const pathSettings = 'src/components/SettingsTab.tsx';
let contentSettings = fs.readFileSync(pathSettings, 'utf8');
for (const [key, value] of Object.entries(replacements)) {
  const safeKey = key.replace(/\//g, '\\\\/');
  const regex = new RegExp("([^a-zA-Z0-9_-])" + safeKey + "([^a-zA-Z0-9_-])", 'g');
  contentSettings = contentSettings.replace(regex, "$1" + value + "$2");
}
fs.writeFileSync(pathSettings, contentSettings);

const pathEngine = 'src/components/EngineConfig.tsx';
let contentEngine = fs.readFileSync(pathEngine, 'utf8');
for (const [key, value] of Object.entries(replacements)) {
  const safeKey = key.replace(/\//g, '\\\\/');
  const regex = new RegExp("([^a-zA-Z0-9_-])" + safeKey + "([^a-zA-Z0-9_-])", 'g');
  contentEngine = contentEngine.replace(regex, "$1" + value + "$2");
}
fs.writeFileSync(pathEngine, contentEngine);

const pathHolidays = 'src/components/HolidaysAndLeaves.tsx';
let contentHolidays = fs.readFileSync(pathHolidays, 'utf8');
for (const [key, value] of Object.entries(replacements)) {
  const safeKey = key.replace(/\//g, '\\\\/');
  const regex = new RegExp("([^a-zA-Z0-9_-])" + safeKey + "([^a-zA-Z0-9_-])", 'g');
  contentHolidays = contentHolidays.replace(regex, "$1" + value + "$2");
}
fs.writeFileSync(pathHolidays, contentHolidays);

const pathApp = 'src/App.tsx';
let contentApp = fs.readFileSync(pathApp, 'utf8');
for (const [key, value] of Object.entries(replacements)) {
  const safeKey = key.replace(/\//g, '\\\\/');
  const regex = new RegExp("([^a-zA-Z0-9_-])" + safeKey + "([^a-zA-Z0-9_-])", 'g');
  contentApp = contentApp.replace(regex, "$1" + value + "$2");
}
fs.writeFileSync(pathApp, contentApp);

console.log('patched light theme');
