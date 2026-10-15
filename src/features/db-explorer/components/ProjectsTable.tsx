import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { Project } from '@bindings/Project';
import CollapsibleCard from '@components/CollapsibleCard';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useData } from '@common/hooks/DataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Button } from '@components/ui/button';

export default function ProjectsTable() {
  const { locale, customTranslations } = useLocale();
  const { resolvedTheme } = useSettings();
  const { projects, setProjects, setTasks, setLogs } = useData();

  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projForm, setProjForm] = useState<{ name: string; color: string; reason: string }>({ name: '', color: 'violet', reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);

  const colors = ['rose', 'teal', 'amber', 'violet', 'indigo', 'emerald'];

  const themeClasses = resolvedTheme === 'light' 
    ? { wrapper: 'bg-card border-border shadow-xs', tableHeader: 'border-border text-muted-foreground bg-muted/50' }
    : resolvedTheme === 'high-contrast'
    ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
    : { wrapper: 'bg-card/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-muted-foreground bg-black/30' };

  const startEditProj = (p: Project) => {
    setEditingProjId(p.id);
    setProjForm({ name: p.name, color: p.color, reason: 'Project name correction' });
  };

  const saveEditProj = (id: string) => {
    setProjects(curr => curr.map(p => {
      if (p.id === id) {
        const hasChanged = p.name !== projForm.name || p.color !== projForm.color;
        if (!hasChanged) {
          setEditingProjId(null);
          return p;
        }
        const originalName = p.originalName || p.name;
        const originalColor = p.originalColor || p.color;

        const newHistoryItem = {
          editedAt: new Date().toISOString(),
          prevName: p.name,
          prevColor: p.color,
          reason: projForm.reason || 'Quick edit'
        };

        const updatedHistory = p.editHistory ? [...p.editHistory, newHistoryItem] : [newHistoryItem];

        return {
          ...p,
          name: projForm.name,
          color: projForm.color,
          originalName,
          originalColor,
          editHistory: updatedHistory
        };
      }
      return p;
    }));
    setEditingProjId(null);
  };

  const deleteProj = (id: string) => {
    if (confirm(translate(locale, 'database', 'DeleteConfirmProject', customTranslations))) {
      setProjects(curr => curr.filter(p => p.id !== id));
      setTasks(curr => curr.filter(t => t.projectId !== id));
      setLogs(curr => curr.filter(l => l.projectId !== id));
    }
  };

  return (
    <CollapsibleCard
      title={`${translate(locale, 'database', 'ProjectsTableTitle', customTranslations)} (${projects.length} ${translate(locale, 'database', 'Records', customTranslations)})`}
      icon={Database}
      iconColor="text-orange-400"
      titleColor="text-orange-400"
      defaultExpanded={true}
      wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-orange-400"
    >
      <div className="overflow-x-auto w-full">
        <Table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <TableHeader>
            <TableRow className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
              <TableHead className="py-3 px-4 rounded-l-xl">id</TableHead>
              <TableHead className="py-3 px-4">name</TableHead>
              <TableHead className="py-3 px-4">color</TableHead>
              <TableHead className="py-3 px-4">{translate(locale, 'database', 'OriginalValue', customTranslations)}</TableHead>
              <TableHead className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'database', 'ActionsCrud', customTranslations)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:text-white">
            {projects.map(p => {
              const isEditing = editingProjId === p.id;
              const hasHistory = !!(p.originalName || p.originalColor || p.editHistory);

              return (
                <React.Fragment key={p.id}>
                  <TableRow className="border-b border-white/5 hover:bg-white/5">
                    <TableCell className="py-3.5 px-4 font-bold text-orange-500">{p.id}</TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isEditing ? (
                        <Input 
                          type="text" 
                          value={projForm.name} 
                          onChange={e => setProjForm(prev => ({ ...prev, name: e.target.value }))}
                          aria-label={translate(locale, 'project', 'ProjectName', customTranslations)}
                          className="bg-black/35 border border-white/20 px-2 py-1 h-7 rounded max-w-xs text-white"
                        />
                      ) : (
                        <span className="font-semibold">{p.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isEditing ? (
                        <div className="w-28">
                          <Select
                            value={projForm.color}
                            onValueChange={val => {
                              if (val) setProjForm(prev => ({ ...prev, color: val }));
                            }}
                          >
                            <SelectTrigger aria-label={translate(locale, 'common', 'Color', customTranslations)} className="h-7 text-xs bg-black border border-white/20">
                              <SelectValue>{projForm.color}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {colors.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 capitalize">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full bg-${p.color}-500 shadow-md`} />
                          {p.color}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {hasHistory ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold flex items-center gap-1.5 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          {translate(locale, 'database', 'OriginalLabel', customTranslations)}: {p.originalName || p.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">{translate(locale, 'database', 'NoPatches', customTranslations)}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasHistory && (
                          <Button 
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setShowHistoryRecordId(showHistoryRecordId === p.id ? null : p.id)}
                            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
                            title={translate(locale, 'database', 'RevisionHistory', customTranslations)}
                            aria-label={translate(locale, 'database', 'RevisionHistory', customTranslations)}
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {isEditing ? (
                          <>
                            <div className="flex flex-col gap-1 inline-block mr-2 text-left">
                              <Input 
                                type="text" 
                                placeholder={translate(locale, 'database', 'Reason', customTranslations)}
                                aria-label={translate(locale, 'database', 'Reason', customTranslations)}
                                value={projForm.reason} 
                                onChange={e => setProjForm(prev => ({ ...prev, reason: e.target.value }))}
                                className="text-[9px] bg-black/45 border border-white/10 px-1 py-0.5 h-6 rounded w-28 text-white"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => saveEditProj(p.id)} 
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer"
                              title={translate(locale, 'common', 'Save', customTranslations)}
                              aria-label={translate(locale, 'common', 'Save', customTranslations)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditingProjId(null)} 
                              className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer" 
                              title={translate(locale, 'common', 'Cancel', customTranslations)}
                              aria-label={translate(locale, 'common', 'Cancel', customTranslations)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => startEditProj(p)} 
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer" 
                              title={translate(locale, 'common', 'Edit', customTranslations)}
                              aria-label={translate(locale, 'common', 'Edit', customTranslations)}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => deleteProj(p.id)} 
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer" 
                              title={translate(locale, 'common', 'Delete', customTranslations)}
                              aria-label={translate(locale, 'common', 'Delete', customTranslations)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {showHistoryRecordId === p.id && p.editHistory && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
                        <div className="flex flex-col gap-1.5 border-l-2 border-teal-500 pl-4 py-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> {translate(locale, 'database', 'AuditTrail', customTranslations)}
                          </p>
                          {p.editHistory.map((h, hIdx) => (
                            <div key={hIdx} className="text-[11px] text-muted-foreground mt-1">
                              <span>[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                              {translate(locale, 'database', 'ChangeFromName', customTranslations)} <strong className="text-foreground">"{h.prevName}"</strong> ({translate(locale, 'common', 'Color', customTranslations)} {h.prevColor}) &rarr;{' '}
                              {translate(locale, 'database', 'Reason', customTranslations)} <em className="text-teal-300">"{h.reason}"</em>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </CollapsibleCard>
  );
}
