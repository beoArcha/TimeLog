import React, { useState } from 'react';
import { Database, Trash2, Plus } from 'lucide-react';
import { PatchLog } from '@bindings/PatchLog';
import CollapsibleCard from '@components/CollapsibleCard';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { translate } from '@common/i18n/translator';
import { getNextId } from '@common/utils/idGenerator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';

export default function PatchLogsTable() {
  const { locale, customTranslations } = useLocale();
  const { projects, patches, setPatches } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [patchNote, setPatchNote] = useState('');
  const [deleteTargetPatchId, setDeleteTargetPatchId] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTargetPatchId) return;
    const id = deleteTargetPatchId;
    setDeleteTargetPatchId(null);
    setPatches(curr => curr.filter(x => x.id !== id));
  };

  const handleOpenModal = () => {
    setStartTime(new Date().toISOString());
    setEndTime(new Date(Date.now() + 3600000).toISOString());
    setPatchNote('System sleep correction');
    setIsModalOpen(true);
  };

  const handleAddPatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime && endTime && projects.length > 0) {
      setPatches(prev => [...prev, {
        id: getNextId(patches || [], 'patch_'),
        projectId: projects[0].id,
        startTime,
        endTime,
        patchNote: patchNote || 'Manual correction'
      }]);
      setIsModalOpen(false);
    }
  };

  const columns: DataTableColumn<PatchLog>[] = [
    {
      key: 'id',
      header: 'id',
      className: 'font-bold text-emerald-400',
      render: (p) => p.id,
    },
    {
      key: 'projectId',
      header: 'project_id',
      render: (p) => p.projectId,
    },
    {
      key: 'taskId',
      header: 'task_id (opt)',
      className: 'text-muted-foreground',
      render: (p) => p.taskId || 'NULL',
    },
    {
      key: 'startTime',
      header: 'start_time',
      className: 'border-l border-border/50',
      render: (p) => new Date(p.startTime).toLocaleString(),
    },
    {
      key: 'endTime',
      header: 'end_time',
      render: (p) => new Date(p.endTime).toLocaleString(),
    },
    {
      key: 'patchNote',
      header: translate(locale, 'database', 'PatchNoteReason', customTranslations),
      className: 'italic text-muted-foreground',
      render: (p) => (
        <>
          {p.patchNote}{' '}
          {p.isSystemEvent && <span className="text-emerald-500 font-bold ml-1">[SYSTEM]</span>}
        </>
      ),
    },
    {
      key: 'actions',
      header: translate(locale, 'common', 'Actions', customTranslations),
      align: 'right',
      render: (p) => (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setDeleteTargetPatchId(p.id)}
          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
          title={translate(locale, 'common', 'Delete', customTranslations)}
          aria-label={translate(locale, 'common', 'Delete', customTranslations)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle id="patch-modal-title">
              {translate(locale, 'database', 'AddManualPatch', customTranslations)}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddPatch} className="flex flex-col gap-3 my-2">
            <div>
              <Label htmlFor="patch-start-time" className="text-xs font-mono text-muted-foreground block mb-1">
                {translate(locale, 'database', 'StartTimeIso', customTranslations)}
              </Label>
              <Input
                id="patch-start-time"
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                aria-label={translate(locale, 'database', 'StartTimeIso', customTranslations)}
                className="w-full text-xs font-mono"
              />
            </div>
            <div>
              <Label htmlFor="patch-end-time" className="text-xs font-mono text-muted-foreground block mb-1">
                {translate(locale, 'database', 'EndTimeIso', customTranslations)}
              </Label>
              <Input
                id="patch-end-time"
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-label={translate(locale, 'database', 'EndTimeIso', customTranslations)}
                className="w-full text-xs font-mono"
              />
            </div>
            <div>
              <Label htmlFor="patch-note-reason" className="text-xs font-mono text-muted-foreground block mb-1">
                {translate(locale, 'database', 'PatchNoteReason', customTranslations)}
              </Label>
              <Input
                id="patch-note-reason"
                type="text"
                value={patchNote}
                onChange={(e) => setPatchNote(e.target.value)}
                aria-label={translate(locale, 'database', 'PatchNoteReason', customTranslations)}
                className="w-full text-xs font-mono"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                {translate(locale, 'common', 'Cancel', customTranslations)}
              </Button>
              <Button
                type="submit"
                variant="accent"
              >
                {translate(locale, 'common', 'Save', customTranslations)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CollapsibleCard
        title={`${translate(locale, 'database', 'PatchLogsTableTitle', customTranslations)} (${patches?.length || 0} ${translate(locale, 'database', 'Records', customTranslations)})`}
        icon={Database}
        iconColor="text-emerald-400"
        titleColor="text-emerald-400"
        defaultExpanded={true}
        wrapperClassName="p-6 rounded-3xl border border-border bg-card shadow-xl"
        headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 text-left"
        headerRight={
          <Button
            variant="accent"
            size="sm"
            onClick={handleOpenModal}
            className="rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {translate(locale, 'database', 'AddManualPatch', customTranslations)}
          </Button>
        }
      >
        <Caption size="xs" className="mb-4 mt-0.5 block">{translate(locale, 'database', 'PatchTableAllows', customTranslations)}</Caption>

        <DataTable<PatchLog>
          columns={columns}
          data={patches || []}
          keyExtractor={(p) => p.id}
          maxHeight="400px"
          className="text-xs font-mono whitespace-nowrap"
          emptyTitle={translate(locale, 'database', 'NoPatchesStandardMode', customTranslations)}
        />
      </CollapsibleCard>

      <ConfirmDialog
        open={deleteTargetPatchId !== null}
        onOpenChange={(open) => !open && setDeleteTargetPatchId(null)}
        title={translate(locale, 'database', 'DeleteConfirmPatch', customTranslations)}
        variant="destructive"
        confirmLabel={translate(locale, 'common', 'Delete', customTranslations)}
        cancelLabel={translate(locale, 'common', 'Cancel', customTranslations)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
