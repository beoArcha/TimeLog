import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, ShieldCheck } from 'lucide-react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useEngine } from '@common/hooks/EngineContext';
import { useData } from '@common/hooks/DataContext';
import { executeCliCommand, TerminalLine, CliEngineContext } from './utils/CliEngine';
import versionsData from '../../versions.json';
import { translate } from '@common/i18n/translator';

export default function CliInterface() {
  const { locale, customTranslations } = useLocale();
  const { resolvedTheme } = useSettings();
  const { nowIso } = useEngine();
  const data = useData();

  const [input, setInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: `LogTime by OxyFlow CLI Engine [Version ${versionsData.major}.${versionsData.minor}.${versionsData.release}]`, type: 'info' },
    { text: "Type 'help' to see available commands.", type: 'info' },
    { text: "Connected to local SQLite database in memory.", type: 'success' },
    { text: '', type: 'output' },
  ]);

  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const [prevLocale, setPrevLocale] = useState(locale);

  if (prevLocale !== locale) {
    setPrevLocale(locale);
    const msg = locale === 'pl' ? `Zmieniono język terminala na: Polski (PL)` :
      locale === 'en' ? `Terminal locale switched to: English (EN)` :
        locale === 'de' ? `Schnittstellensprache geändert zu: Deutsch (DE)` :
          locale === 'es' ? `Idioma de terminal cambiado a: Español (ES)` :
            locale === 'pt-br' ? `Idioma do terminal alterado para: Português (PT-BR)` :
              `Terminal locale changed to: Custom translation dictionary!`;
    setTerminalHistory(prev => [
      ...prev,
      { text: `[SYSTEM_EVENT] ${msg}`, type: 'success' }
    ]);
  }

  const executeCommand = (cmdText: string) => {
    const cliContext: CliEngineContext = {
      projects: data.projects,
      tasks: data.tasks,
      logs: data.logs,
      activeLog: data.activeLog,
      nowIso,
      locale,
      customTranslations,
      holidays: data.holidays,
      setHolidays: data.setHolidays,
      selectedTaskId: data.selectedTaskId,
      setSelectedTaskId: data.setSelectedTaskId,
      onAddProject: data.handleAddProject,
      onAddTask: data.handleAddTask,
      onToggleTaskComplete: data.handleToggleTaskComplete,
      onStartTimer: data.handleStartTimer,
      onStopTimer: data.handleStopTimer,
    };
    const outputs = executeCliCommand(cmdText, cliContext);
    if (outputs.length === 1 && outputs[0].text === '__CLEAR__') {
      setTerminalHistory([]);
      return;
    }
    setTerminalHistory(prev => [...prev, ...outputs]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input);
    setInput('');
  };

  return (
    <div id="cli-interface" className={`flex flex-col gap-4 backdrop-blur-md rounded-3xl p-6 border shadow-2xl relative transition-all duration-300 ${resolvedTheme === 'light'
      ? 'bg-white border-slate-200 text-slate-800 shadow-slate-100'
      : resolvedTheme === 'high-contrast'
        ? 'bg-black border-2 border-white text-white'
        : 'bg-white/5 border-white/10 text-white'
      }`}>
      <div className={`flex items-center justify-between border-b pb-3 ${resolvedTheme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
          </div>
          <span className={`text-xs font-mono flex items-center gap-1.5 ml-2 ${resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
            <Terminal className="w-3.5 h-3.5 text-orange-500" />
            LogTime by OxyFlow Engine CLI Shell (127.0.0.1) v{versionsData.major}.{versionsData.minor}.{versionsData.release}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className={`text-[10px] border px-2 py-0.5 rounded-md font-mono flex items-center gap-1 ${resolvedTheme === 'light' ? 'bg-slate-500/10 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'}`}>
            <ShieldCheck className="w-3 h-3 text-orange-500" /> Rust CLI client emulator
          </span>
        </div>
      </div>

      <div
        id="terminal-history"
        className={`rounded-2xl p-4 min-h-[380px] max-h-[480px] overflow-y-auto font-mono text-xs leading-relaxed flex flex-col gap-1.5 focus:outline-none border ${resolvedTheme === 'light'
          ? 'bg-slate-900 border-slate-300 text-slate-200 shadow-inner'
          : resolvedTheme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-black/20 border-white/15 text-slate-300'
          }`}
      >
        {terminalHistory.map((line, index) => {
          let colorClass = 'text-slate-300';
          if (line.type === 'input') colorClass = 'text-white font-bold border-l-2 border-l-orange-500 pl-1.5 my-1';
          else if (line.type === 'error') colorClass = 'text-rose-450 font-semibold bg-rose-500/10 p-1.5 rounded-lg';
          else if (line.type === 'success') colorClass = 'text-orange-400 font-semibold';
          else if (line.type === 'info') colorClass = 'text-teal-400';

          return (
            <div key={index} className={`${colorClass} whitespace-pre-wrap`}>
              {line.text}
            </div>
          );
        })}
        <div ref={outputEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className={`flex gap-2 p-1.5 rounded-2xl border transition-all ${resolvedTheme === 'light'
        ? 'bg-slate-55 border-slate-200'
        : resolvedTheme === 'high-contrast'
          ? 'bg-black border-white'
          : 'bg-black/25 border-white/10'
        }`}>
        <span className="text-orange-500 font-mono text-sm self-center pl-2 font-bold select-none">
          oxyflow&gt;
        </span>
        <input
          id="cli-input-field"
          type="text"
          className={`flex-1 bg-transparent font-mono text-xs border-none outline-none focus:ring-0 py-2 ${resolvedTheme === 'light' ? 'text-slate-800 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'
            }`}
          placeholder={locale === 'pl' ? 'Wpisz komendę, np. help, projects, start 1, stop...' : 'Enter command, e.g. help, projects, start 1, stop...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <button
          id="cli-submit-btn"
          type="submit"
          className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
        >
          {locale === 'pl' ? 'Wyślij' : locale === 'en' ? 'Send' : locale === 'de' ? 'Senden' : locale === 'es' ? 'Enviar' : 'Enviar'} <Send className="w-3 h-3" />
        </button>
      </form>

      <div className={`border rounded-2xl p-3 flex flex-wrap items-center gap-2 text-[10px] font-mono transition-all ${resolvedTheme === 'light'
        ? 'bg-slate-50 border-slate-200 text-slate-600'
        : resolvedTheme === 'high-contrast'
          ? 'bg-black border-white text-white'
          : 'bg-white/5 border-white/10 text-slate-400'
        }`}>
        <span className={`font-bold ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{translate(locale, 'help', 'QuickShortcuts', customTranslations)}</span>
        <button
          id="cmd-project-list-btn"
          type="button"
          onClick={() => executeCommand('projects')}
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${resolvedTheme === 'light'
            ? 'bg-white hover:bg-slate-100 text-orange-600 border-slate-200'
            : 'bg-white/5 hover:bg-white/10 text-orange-400 border-white/10'
            }`}
        >
          projects
        </button>
        <button
          id="cmd-status-btn"
          type="button"
          onClick={() => executeCommand('status')}
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${resolvedTheme === 'light'
            ? 'bg-white hover:bg-slate-100 text-orange-600 border-slate-200'
            : 'bg-white/5 hover:bg-white/10 text-orange-400 border-white/10'
            }`}
        >
          status
        </button>
        <button
          id="cmd-logs-btn"
          type="button"
          onClick={() => executeCommand('logs')}
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${resolvedTheme === 'light'
            ? 'bg-white hover:bg-slate-100 text-orange-600 border-slate-200'
            : 'bg-white/5 hover:bg-white/10 text-orange-400 border-white/10'
            }`}
        >
          logs
        </button>
        <button
          id="cmd-stop-btn"
          type="button"
          onClick={() => executeCommand('stop')}
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${resolvedTheme === 'light'
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-150'
            : 'bg-white/5 hover:bg-rose-500/20 text-rose-300 border-white/10'
            }`}
        >
          stop
        </button>
      </div>

    </div>
  );
}
