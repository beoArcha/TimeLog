import { GuiState } from '@layouts/hooks/useGuiLogic';
import { Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translate } from '@common/i18n/translator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Button } from '@components/ui/button';

export default function DbInspector({ state, isCondensed }: { state: GuiState; isCondensed: boolean }) {
  const {
    projects, tasks, logs, nowIso, locale, customTranslations,
    showDbInspector, setShowDbInspector
  } = state;

  return (
    <div className="mt-2 flex flex-col rounded-3xl border border-border bg-card text-card-foreground shadow-xs transition-all duration-300 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setShowDbInspector(!showDbInspector)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl flex items-center justify-center bg-muted border border-border">
            <Database className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-foreground">oxytime.db • SQLite Client</span>
            <span className="text-[10px] font-mono text-muted-foreground">Simulated microORM State</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showDbInspector && (
            <span className="hidden sm:inline-block bg-orange-500/20 border border-orange-500/30 text-[10px] text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">ONLINE</span>
          )}
          <Button
            id="toggle-db-inspector-btn"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDbInspector(!showDbInspector);
            }}
            className="flex items-center gap-2 font-mono text-xs px-4 py-2 rounded-2xl cursor-pointer h-auto"
          >
            {showDbInspector ? translate(locale, 'database', 'HideSqlitePreview', customTranslations) : translate(locale, 'database', 'ExploreStructure', customTranslations)}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showDbInspector && (
          <motion.div
            id="db-inspector-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-4 md:p-6 md:pt-4 border-t border-border/50 font-mono text-xs gap-4 flex flex-col">
              <div className={`flex flex-col gap-4 pb-2 ${!isCondensed ? 'md:grid md:grid-cols-2' : ''}`}>
                <div className="flex-1 p-3 rounded-xl border border-border bg-muted/30 flex flex-col">
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans shrink-0">TABLE projects</p>
                  <div className="overflow-auto scroller-hide max-h-[200px] w-full">
                    <Table className="w-full text-left whitespace-nowrap">
                      <TableHeader>
                        <TableRow className="border-b border-border text-[10px] text-muted-foreground">
                          <TableHead className="py-1 pr-4">id</TableHead>
                          <TableHead className="py-1 pr-4">name</TableHead>
                          <TableHead className="py-1">created_at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map(p => (
                          <TableRow key={p.id} className="text-foreground">
                            <TableCell className="py-1 pr-4 font-bold text-indigo-500 dark:text-indigo-400">{p.id}</TableCell>
                            <TableCell className="py-1 pr-4">{p.name}</TableCell>
                            <TableCell className="py-1 text-[9px] text-muted-foreground">{new Date(p.createdAt).toISOString().slice(0, 10)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex-1 p-3 rounded-xl border border-border bg-muted/30 flex flex-col">
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans shrink-0">TABLE tasks</p>
                  <div className="overflow-auto scroller-hide max-h-[200px] w-full">
                    <Table className="w-full text-left whitespace-nowrap">
                      <TableHeader>
                        <TableRow className="border-b border-border text-[10px] text-muted-foreground">
                          <TableHead className="py-1 pr-4">id</TableHead>
                          <TableHead className="py-1 pr-4">proj_id</TableHead>
                          <TableHead className="py-1 pr-4">parent_id</TableHead>
                          <TableHead className="py-1">name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.slice(0, 8).map(t => (
                          <TableRow key={t.id} className="text-foreground">
                            <TableCell className="py-1 pr-4 font-bold text-indigo-500 dark:text-indigo-400">{t.id}</TableCell>
                            <TableCell className="py-1 pr-4">{t.projectId}</TableCell>
                            <TableCell className="py-1 pr-4 text-muted-foreground">{t.parentTaskId || 'NULL'}</TableCell>
                            <TableCell className="py-1 truncate max-w-[120px]" title={t.name}>{t.name}</TableCell>
                          </TableRow>
                        ))}
                        {tasks.length > 8 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-[10px] text-muted-foreground py-1 text-center">
                              {translate(locale, 'database', 'AndMoreRows', customTranslations).replace('{x}', (tasks.length - 8).toString())}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className={`flex-1 w-full p-3 rounded-xl border border-border bg-muted/30 flex flex-col ${!isCondensed ? 'md:col-span-2' : ''}`}>
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans shrink-0">TABLE time_logs</p>
                  <div className="overflow-auto scroller-hide max-h-[250px] w-full">
                    <Table className="w-full text-left whitespace-nowrap">
                      <TableHeader>
                        <TableRow className="border-b border-border text-[10px] text-muted-foreground">
                          <TableHead className="py-1 pr-4">id</TableHead>
                          <TableHead className="py-1 pr-4">task_id</TableHead>
                          <TableHead className="py-1 pr-4">start_time</TableHead>
                          <TableHead className="py-1 pr-4">end_time</TableHead>
                          <TableHead className="py-1">duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.slice(-8).map(l => {
                          const start = new Date(l.startTime).toLocaleTimeString();
                          const end = l.endTime ? new Date(l.endTime).toLocaleTimeString() : 'ACTIVE';
                          const startMs = new Date(l.startTime).getTime();
                          const endMs = l.endTime ? new Date(l.endTime).getTime() : new Date(nowIso).getTime();
                          const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));

                          return (
                            <TableRow key={l.id} className="text-foreground">
                              <TableCell className="py-1 pr-4 text-indigo-500 dark:text-indigo-400 font-bold">{l.id.slice(0, 6)}</TableCell>
                              <TableCell className="py-1 pr-4">{l.taskId}</TableCell>
                              <TableCell className="py-1 pr-4 text-[10px]">{start}</TableCell>
                              <TableCell className="py-1 pr-4 text-[10px] font-semibold text-orange-500 dark:text-orange-400">{end}</TableCell>
                              <TableCell className="py-1 text-[10px] text-right font-mono">{diffSec}s</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
