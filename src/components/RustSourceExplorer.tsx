import React, { useState } from 'react';
import { rustCodebase, RustFile } from '../data/mockRustCode';
import { FileCode, FolderClosed, ClipboardCheck, Clipboard, Download, HelpCircle, Terminal, Cpu } from 'lucide-react';
import { translate } from '../utils/i18n';
import { LocaleType } from '../utils/translations';

export default function RustSourceExplorer({ theme, locale = 'en', customTranslations = {} }: { theme?: string, locale?: LocaleType, customTranslations?: Record<string, string> }) {
  const [selectedFile, setSelectedFile] = useState<RustFile>(rustCodebase[2]); // db.rs by default
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Could not copy', err);
    }
  };

  const downloadFile = (file: RustFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.path.includes('/') ? file.path.split('/').pop()! : file.path;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to categorize files
  const configs = rustCodebase.filter(f => f.category === 'config');
  const engines = rustCodebase.filter(f => f.category === 'engine');
  const clis = rustCodebase.filter(f => f.category === 'cli');
  const guis = rustCodebase.filter(f => f.category === 'gui');

  return (
    <div id="rust-explorer-panel" className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      
      {/* 1. Left Navigation File Tree Finder */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <div className={`backdrop-blur-md rounded-3xl p-6 border shadow-2xl transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white border-slate-200 shadow-slate-100 text-slate-800'
            : theme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-white/5 border-white/10 text-white'
        }`}>
          <h3 className={`font-heading font-bold text-lg border-b pb-3 mb-4 flex items-center gap-2 ${
            theme === 'light' ? 'text-slate-900 border-slate-200' : 'text-white border-white/10'
          }`}>
            <Cpu className="w-5 h-5 text-orange-500" />
            {translate(locale, 'rustExplorer.workspaceRustCargo', customTranslations)}
          </h3>
          <p className={`text-xs mb-6 leading-relaxed ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-300'
          }`}>
            {translate(locale, 'rustExplorer.description', customTranslations)}
          </p>

          {/* Rust Cargo Structure List */}
          <div id="cargo-tree-structure" className="flex flex-col gap-4 font-mono text-xs">
            {/* Project Configs */}
            <div>
              <p className="text-orange-500 text-[10px] font-sans font-bold uppercase tracking-wider mb-2">{translate(locale, 'rustExplorer.cargoConfig', customTranslations)}</p>
              <div className="flex flex-col gap-1 pl-2">
                {configs.map(f => (
                  <button
                    id={`file-btn-${f.path.replace(/\./g, '-')}`}
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left transition-colors cursor-pointer w-full ${
                      selectedFile.path === f.path 
                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20' 
                        : theme === 'light'
                        ? 'hover:bg-slate-100 text-slate-700 border border-transparent'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-slate-400" />
                    <span>{f.path}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Engine files */}
            <div>
              <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 text-[10px] font-sans font-bold uppercase tracking-wider mb-2">
                <FolderClosed className="w-3.5 h-3.5 text-teal-500" />
                <span>src-tauri/src/engine/</span>
              </div>
              <div className={`flex flex-col gap-1 pl-4 border-l ml-1.5 ${
                theme === 'light' ? 'border-slate-200' : 'border-white/10'
              }`}>
                {engines.map(f => (
                  <button
                    id={`file-btn-${f.path.replace(/\//g, '-')}`}
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left transition-colors cursor-pointer w-full ${
                      selectedFile.path === f.path 
                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20' 
                        : theme === 'light'
                        ? 'hover:bg-slate-100 text-slate-700 border border-transparent'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-teal-500" />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CLI files */}
            <div>
              <div className="flex items-center gap-1 text-orange-555 dark:text-orange-400 text-[10px] font-sans font-bold uppercase tracking-wider mb-2">
                <FolderClosed className="w-3.5 h-3.5 text-orange-500" />
                <span>src-tauri/src/ (CLI core)</span>
              </div>
              <div className={`flex flex-col gap-1 pl-4 border-l ml-1.5 ${
                theme === 'light' ? 'border-slate-200' : 'border-white/10'
              }`}>
                {clis.map(f => (
                  <button
                    id={`file-btn-${f.path.replace(/\//g, '-')}`}
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left transition-colors cursor-pointer w-full ${
                      selectedFile.path === f.path 
                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20' 
                        : theme === 'light'
                        ? 'hover:bg-slate-100 text-slate-700 border border-transparent'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-orange-500" />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GUI files */}
            <div>
              <div className="flex items-center gap-1 text-indigo-555 dark:text-indigo-300 text-[10px] font-sans font-bold uppercase tracking-wider mb-2">
                <FolderClosed className="w-3.5 h-3.5 text-indigo-400" />
                <span>src-tauri/src/ (Tauri Events)</span>
              </div>
              <div className={`flex flex-col gap-1 pl-4 border-l ml-1.5 ${
                theme === 'light' ? 'border-slate-200' : 'border-white/10'
              }`}>
                {guis.map(f => (
                  <button
                    id={`file-btn-${f.path.replace(/\//g, '-')}`}
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left transition-colors cursor-pointer w-full ${
                      selectedFile.path === f.path 
                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20' 
                        : theme === 'light'
                        ? 'hover:bg-slate-100 text-slate-700 border border-transparent'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Local Run Quick Instructions */}
        <div className={`backdrop-blur-md rounded-3xl p-6 border shadow-xl flex flex-col gap-4 transition-all duration-300 ${
          theme === 'light'
            ? 'bg-slate-50 border-slate-200 text-slate-750'
            : theme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-white/5 border-white/10 text-slate-200'
        }`}>
          <h4 className={`font-sans font-semibold text-sm flex items-center gap-1.5 ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            <HelpCircle className="w-4 h-4 text-orange-500" />
            {translate(locale, 'rustExplorer.howToCompile', customTranslations)}
          </h4>
          <ol className={`text-xs flex flex-col gap-3 list-decimal pl-4 ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>
            <li>
              {translate(locale, 'rustExplorer.installInstruction1', customTranslations)} <strong className={theme === 'light' ? 'text-slate-900' : 'text-white'}>Rust toolchain</strong> {translate(locale, 'rustExplorer.installInstruction2', customTranslations)} <strong className={theme === 'light' ? 'text-slate-900' : 'text-white'}>Node.js</strong>.
            </li>
            <li>
              {translate(locale, 'rustExplorer.installInstruction3', customTranslations)} <code className="text-orange-500 font-mono font-bold">src-tauri</code> {translate(locale, 'rustExplorer.installInstruction4', customTranslations)}
            </li>
            <li>
              {translate(locale, 'rustExplorer.installInstruction5', customTranslations)}
              <pre className="bg-black/90 p-2.5 rounded-lg text-[10px] text-orange-400 font-mono mt-1 border border-white/10 select-all shadow-inner leading-relaxed">npm install&#10;npx tauri dev</pre>
            </li>
            <li>
              {translate(locale, 'rustExplorer.installInstruction6', customTranslations)}
              <pre className="bg-black/90 p-2.5 rounded-lg text-[10px] text-orange-400 font-mono mt-1 border border-white/10 select-all shadow-inner leading-relaxed">npx tauri build</pre>
            </li>
          </ol>
        </div>
      </div>

      {/* 2. Right Code Viewer Sandbox Component */}
      <div className="xl:col-span-8 flex flex-col gap-6">
        <div id="rust-code-editor-viewer" className={`backdrop-blur-md rounded-3xl overflow-hidden border shadow-2xl flex flex-col transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white border-slate-200 shadow-slate-100'
            : theme === 'high-contrast'
            ? 'bg-black border-2 border-white'
            : 'bg-white/5 border-white/10'
        }`}>
          
          {/* Editor Header Bar */}
          <div className={`px-6 py-4 flex items-center justify-between border-b transition-all duration-300 ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/15 border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span className={`font-mono text-xs font-semibold ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-100'
              }`}>
                {selectedFile.path}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Copy code button */}
              <button
                id="copy-code-btn"
                onClick={() => copyToClipboard(selectedFile.content)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                }`}
              >
                {copied ? (
                  <>
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> {translate(locale, 'rustExplorer.copied', customTranslations)}
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" /> {translate(locale, 'rustExplorer.copy', customTranslations)}
                  </>
                )}
              </button>

              {/* Single File Download Button */}
              <button
                id="download-file-btn"
                onClick={() => downloadFile(selectedFile)}
                className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 border border-white/5 text-white px-4 py-1.5 rounded-xl text-xs font-sans font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> {translate(locale, 'rustExplorer.downloadFile', customTranslations)}
              </button>
            </div>
          </div>

          {/* Interactive Code Container */}
          <div className={`p-6 overflow-x-auto font-mono text-xs leading-relaxed max-h-[580px] overflow-y-auto flex select-text transition-all duration-300 ${
            theme === 'light'
              ? 'bg-slate-900 text-slate-100'
              : 'bg-black/20 text-slate-200'
          }`}>
            {/* Simple Line numbers representation */}
            <div className={`text-slate-500 pr-4 text-right border-r select-none hidden sm:block ${
              theme === 'light' ? 'border-slate-850' : 'border-white/10'
            }`}>
              {selectedFile.content.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Syntax highlight simulation */}
            <pre className={`pl-4 prose-sm select-text outline-none whitespace-pre-wrap sm:whitespace-pre ${
              theme === 'light' ? 'text-slate-100' : 'text-slate-100'
            }`}>
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>

        {/* Cargo structure summary and compile logs */}
        <div className={`backdrop-blur-md rounded-[2rem] p-6 border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-100'
            : theme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              theme === 'light'
                ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                : 'bg-orange-500/10 text-orange-400 border-white/10'
            }`}>
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{translate(locale, 'rustExplorer.projectIsCrossPlatform', customTranslations)}</h4>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>{translate(locale, 'rustExplorer.brainIsSqlite', customTranslations)}</p>
            </div>
          </div>
          <button
            id="download-all-zip-btn"
            onClick={() => {
              // Trigger downloadable readme configuration file as fallback downloader
              const td = (k: string) => translate(locale, k, customTranslations);
              const readmeContent = `${td('rustExplorer.readmeGeneratorTitle')}
====================================

${td('rustExplorer.readmeGeneratedStructure')}
${rustCodebase.map(f => `- ${f.path}`).join('\n')}

${td('rustExplorer.readmeHint')}
`;
              const blob = new Blob([readmeContent], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'OxyFlow_Cargo_Readme.txt';
              link.click();
              URL.revokeObjectURL(url);
            }}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-1.5 transition-all border cursor-pointer shadow-md shadow-black/5 ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 text-orange-600 border-slate-200'
                : 'bg-white/5 hover:bg-white/10 text-orange-400 border-white/10'
            }`}
          >
            <Download className="w-4 h-4" /> {translate(locale, 'rustExplorer.downloadCargoReadme', customTranslations)}
          </button>
        </div>

      </div>

    </div>
  );
}
