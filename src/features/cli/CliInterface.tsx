import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, ShieldCheck } from 'lucide-react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { useData } from '@common/hooks/DataContext';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { executeCliCommand, TerminalLine, CliEngineContext } from './utils/CliEngine';
import versionsData from '@app/versions.json';
import { translate } from '@common/i18n/translator';

export default function CliInterface() {
  const { locale, customTranslations } = useLocale();
  const { nowIso } = useWindowShell();
  const data = useData();

  const [input, setInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: `LogTime by OxyFlow CLI Engine [Version ${versionsData.major}.${versionsData.minor}.${versionsData.release}]`, type: 'info' },
    { text: "Type 'help' to see available commands.", type: 'info' },
    { text: "Connected to local SQLite database in memory.", type: 'success' },
    { text: '', type: 'output' },
  ]);

  const terminalHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalHistoryRef.current) {
      terminalHistoryRef.current.scrollTop = terminalHistoryRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const [prevLocale, setPrevLocale] = useState(locale);

  if (prevLocale !== locale) {
    setPrevLocale(locale);
    const msg = translate(locale, 'cli', 'LocaleSwitched', customTranslations, { locale: locale.toUpperCase() });
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
      metrics: data.computedMetrics,
      nowIso,
      locale,
      customTranslations,
      holidays: data.holidays,
      setHolidays: data.setHolidays,
      selectedTaskId: data.selectedTaskId,
      setSelectedTaskId: data.setSelectedTaskId,
      onAddProject: data.handleAddProject,
      onRenameProject: data.handleRenameProject,
      onAddTask: data.handleAddTask,
      onRenameTask: data.handleRenameTask,
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
    <div id="cli-interface" className="flex-1 min-h-0 flex flex-col gap-4 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-border bg-card text-foreground shadow-2xl relative transition-all duration-300">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
          </div>
          <span className="text-xs font-mono flex items-center gap-1.5 ml-2 text-muted-foreground">
            <Terminal className="w-3.5 h-3.5 text-orange-500" />
            LogTime by OxyFlow Engine CLI Shell (127.0.0.1) v{versionsData.major}.{versionsData.minor}.{versionsData.release}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-[10px] border border-border bg-muted px-2 py-0.5 rounded-md font-mono flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-orange-500" /> Rust CLI client emulator
          </span>
        </div>
      </div>

      <div
        id="terminal-history"
        ref={terminalHistoryRef}
        role="log"
        aria-live="polite"
        aria-label="CLI terminal history"
        className="rounded-2xl p-4 flex-1 min-h-[220px] overflow-y-auto font-mono text-xs leading-relaxed flex flex-col gap-1.5 focus:outline-none border border-[var(--code-border)] bg-[var(--code-bg)] text-[var(--code-foreground)] shadow-inner"
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
      </div>

      <form onSubmit={handleFormSubmit} className="flex gap-2 p-1.5 rounded-2xl border border-border bg-muted/40 transition-all">
        <span className="text-orange-500 font-mono text-sm self-center pl-2 font-bold select-none">
          oxyflow&gt;
        </span>
        <Input
          id="cli-input-field"
          type="text"
          className="flex-1 bg-transparent font-mono text-xs border-none outline-none focus-visible:ring-0 shadow-none py-2 h-auto text-foreground placeholder:text-muted-foreground"
          placeholder={translate(locale, 'cli', 'CommandInputPlaceholder', customTranslations)}
          aria-label={translate(locale, 'cli', 'CommandInputPlaceholder', customTranslations)}
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <Button
          id="cli-submit-btn"
          type="submit"
          aria-label={translate(locale, 'common', 'Send', customTranslations)}
          className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md h-auto"
        >
          {translate(locale, 'common', 'Send', customTranslations)} <Send className="w-3 h-3" />
        </Button>
      </form>

      <div className="border border-border rounded-2xl p-3 flex flex-wrap items-center gap-2 text-[10px] font-mono transition-all bg-muted/40 text-muted-foreground">
        <span className="font-bold text-foreground">{translate(locale, 'help', 'QuickShortcuts', customTranslations)}</span>
        <Button
          id="cmd-project-list-btn"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('projects')}
          className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-primary border border-border"
        >
          projects
        </Button>
        <Button
          id="cmd-status-btn"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('status')}
          className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-primary border border-border"
        >
          status
        </Button>
        <Button
          id="cmd-logs-btn"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('logs')}
          className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-primary border border-border"
        >
          logs
        </Button>
        <Button
          id="cmd-stop-btn"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('stop')}
          className="px-2.5 py-1 rounded transition-all h-auto bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20"
        >
          stop
        </Button>
      </div>

    </div>
  );
}
