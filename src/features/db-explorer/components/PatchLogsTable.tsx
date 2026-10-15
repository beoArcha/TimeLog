import React, { useState } from 'react';
import { Database, Trash2, Plus, X } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { translate } from '@common/i18n/translator';
import { getNextId } from '@common/utils/idGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '@common/hooks/LocaleProvider';
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
import { Label } from '@components/ui/label';
import { Button } from '@components/ui/button';

export default function PatchLogsTable() {
  const { locale, customTranslations } = useLocale();
  const { projects, patches, setPatches } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [patchNote, setPatchNote] = useState('');

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

  return (
    <>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="patch-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-3xl border border-border bg-card text-card-foreground shadow-2xl p-6 flex flex-col gap-4 relative"
            >
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-muted-foreground"
                title={translate(locale, 'common', 'Close', customTranslations)}
                aria-label={translate(locale, 'common', 'Close', customTranslations)}
              >
                <X className="w-5 h-5" />
              </Button>

              <h3 id="patch-modal-title" className="font-bold text-lg">{translate(locale, 'database', 'AddManualPatch', customTranslations)}</h3>

              <form onSubmit={handleAddPatch} className="flex flex-col gap-3">
                <div>
                  <Label className="text-xs font-mono text-muted-foreground block mb-1">
                    {translate(locale, 'database', 'StartTimeIso', customTranslations)}
                  </Label>
                  <Input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    aria-label={translate(locale, 'database', 'StartTimeIso', customTranslations)}
                    className="w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono text-muted-foreground block mb-1">
                    {translate(locale, 'database', 'EndTimeIso', customTranslations)}
                  </Label>
                  <Input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    aria-label={translate(locale, 'database', 'EndTimeIso', customTranslations)}
                    className="w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono text-muted-foreground block mb-1">
                    {translate(locale, 'database', 'PatchNoteReason', customTranslations)}
                  </Label>
                  <Input
                    type="text"
                    value={patchNote}
                    onChange={(e) => setPatchNote(e.target.value)}
                    aria-label={translate(locale, 'database', 'PatchNoteReason', customTranslations)}
                    className="w-full text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-3">
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
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        <p className="text-[11px] text-muted-foreground mb-4 mt-0.5">{translate(locale, 'database', 'PatchTableAllows', customTranslations)}</p>

        <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto">
          <Table className="w-full text-xs font-mono text-left whitespace-nowrap">
            <TableHeader>
              <TableRow className="border-b border-border text-muted-foreground bg-muted/50 uppercase text-[10px] tracking-wide">
                <TableHead className="py-3 px-4 rounded-l-xl">id</TableHead>
                <TableHead className="py-3 px-4">project_id</TableHead>
                <TableHead className="py-3 px-4">task_id (opt)</TableHead>
                <TableHead className="py-3 px-4">start_time</TableHead>
                <TableHead className="py-3 px-4">end_time</TableHead>
                <TableHead className="py-3 px-4">{translate(locale, 'database', 'PatchNoteReason', customTranslations)}</TableHead>
                <TableHead className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'common', 'Actions', customTranslations)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-foreground">
              {(patches || []).map(p => (
                <TableRow key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                  <TableCell className="py-3.5 px-4 font-bold text-emerald-400">{p.id}</TableCell>
                  <TableCell className="py-3.5 px-4">{p.projectId}</TableCell>
                  <TableCell className="py-3.5 px-4 text-muted-foreground">{p.taskId || 'NULL'}</TableCell>
                  <TableCell className="py-3.5 px-4 border-l border-border/50">{new Date(p.startTime).toLocaleString()}</TableCell>
                  <TableCell className="py-3.5 px-4">{new Date(p.endTime).toLocaleString()}</TableCell>
                  <TableCell className="py-3.5 px-4 italic text-muted-foreground">{p.patchNote} {p.isSystemEvent && <span className="text-emerald-500 font-bold ml-1">[SYSTEM]</span>}</TableCell>
                  <TableCell className="py-3.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        if (confirm(translate(locale, 'database', 'DeleteConfirmPatch', customTranslations))) {
                          setPatches(curr => curr.filter(x => x.id !== p.id));
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                      title={translate(locale, 'common', 'Delete', customTranslations)}
                      aria-label={translate(locale, 'common', 'Delete', customTranslations)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(patches || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground italic">{translate(locale, 'database', 'NoPatchesStandardMode', customTranslations)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleCard>
    </>
  );
}
