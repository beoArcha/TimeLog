import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { Project } from '@bindings/Project';
import CollapsibleCard from '@components/CollapsibleCard';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { TableRow, TableCell } from '@components/ui/table';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption, Overline } from '@components/ui/typography';

export default function ProjectsTable() {
  const { locale, customTranslations } = useLocale();
  const { projects, handleUpdateProject, handleToggleProjectArchive } = useData();

  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projForm, setProjForm] = useState<{ name: string; color: string; reason: string }>({ name: '', color: 'violet', reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);
  const [deleteTargetProjId, setDeleteTargetProjId] = useState<string | null>(null);

  const colors = ['rose', 'teal', 'amber', 'violet', 'indigo', 'emerald'];

  const startEditProj = (p: Project) => {
    setEditingProjId(p.id);
    setProjForm({ name: p.name, color: p.color, reason: 'Project name correction' });
  };

  const saveEditProj = async (id: string) => {
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    const hasChanged = p.name !== projForm.name || p.color !== projForm.color;
    if (!hasChanged) {
      setEditingProjId(null);
      return;
    }
    if (handleUpdateProject) {
      await handleUpdateProject(id, projForm.name, projForm.color);
    }
    setEditingProjId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetProjId) return;
    const id = deleteTargetProjId;
    setDeleteTargetProjId(null);
    if (handleToggleProjectArchive) {
      await handleToggleProjectArchive(id);
    }
  };

  const columns: DataTableColumn<Project>[] = [
    { key: 'id', header: 'id' },
    { key: 'name', header: 'name' },
    { key: 'color', header: 'color' },
    { key: 'originalValue', header: translate(locale, 'database', 'OriginalValue', customTranslations) },
    { key: 'actions', header: translate(locale, 'database', 'ActionsCrud', customTranslations), align: 'right' },
  ];

  return (
    <>
      <CollapsibleCard
      title={`${translate(locale, 'database', 'ProjectsTableTitle', customTranslations)} (${projects.length} ${translate(locale, 'database', 'Records', customTranslations)})`}
      icon={Database}
      iconColor="text-orange-400"
      titleColor="text-orange-400"
      defaultExpanded={true}
      wrapperClassName="p-6 rounded-3xl border border-border bg-card shadow-xl"
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-orange-400"
    >
      <DataTable<Project>
        columns={columns}
        data={projects}
        keyExtractor={(p) => p.id}
        maxHeight="500px"
        className="text-xs font-mono"
        renderRow={(p) => {
          const isEditing = editingProjId === p.id;
          const hasHistory = !!(p.originalName || p.originalColor || p.editHistory);

          return (
                <React.Fragment key={p.id}>
                  <TableRow className="border-b border-border/50 hover:bg-muted/50">
                    <TableCell className="py-3.5 px-4 font-bold text-orange-500">{p.id}</TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isEditing ? (
                        <Input 
                          type="text" 
                          value={projForm.name} 
                          onChange={e => setProjForm(prev => ({ ...prev, name: e.target.value }))}
                          aria-label={translate(locale, 'project', 'ProjectName', customTranslations)}
                          className="bg-background border border-border px-2 py-1 h-7 rounded max-w-xs text-foreground"
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
                            <SelectTrigger aria-label={translate(locale, 'common', 'Color', customTranslations)} className="h-7 text-xs bg-background border border-border">
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
                        <Badge variant="amber" size="sm" as="span" className="flex items-center gap-1.5 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          {translate(locale, 'database', 'OriginalLabel', customTranslations)}: {p.originalName || p.name}
                        </Badge>
                      ) : (
                        <Caption as="span">{translate(locale, 'database', 'NoPatches', customTranslations)}</Caption>
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
                                className="text-xs bg-background border border-border px-1.5 py-0.5 h-6 rounded w-28 text-foreground"
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
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer" 
                              title={translate(locale, 'common', 'Edit', customTranslations)}
                              aria-label={translate(locale, 'common', 'Edit', customTranslations)}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setDeleteTargetProjId(p.id)} 
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
                      <TableCell colSpan={5} className="py-3 px-5 bg-muted/30 border-b border-border/50 rounded-b-2xl">
                        <div className="flex flex-col gap-1.5 border-l-2 border-teal-500 pl-4 py-1">
                          <Overline className="text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> {translate(locale, 'database', 'AuditTrail', customTranslations)}
                          </Overline>
                          {p.editHistory.map((h, hIdx) => (
                            <Caption key={hIdx} size="xs" className="text-muted-foreground mt-1 block">
                              <span>[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                              {translate(locale, 'database', 'ChangeFromName', customTranslations)} <strong className="text-foreground">"{h.prevName}"</strong> ({translate(locale, 'common', 'Color', customTranslations)} {h.prevColor}) &rarr;{' '}
                              {translate(locale, 'database', 'Reason', customTranslations)} <em className="text-teal-300">"{h.reason}"</em>
                            </Caption>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            }}
          />
        </CollapsibleCard>

    <ConfirmDialog
      open={deleteTargetProjId !== null}
      onOpenChange={(open) => !open && setDeleteTargetProjId(null)}
      title={translate(locale, 'database', 'DeleteConfirmProject', customTranslations)}
      variant="destructive"
      confirmLabel={translate(locale, 'common', 'Delete', customTranslations)}
      cancelLabel={translate(locale, 'common', 'Cancel', customTranslations)}
      onConfirm={handleConfirmDelete}
    />
  </>
  );
}
