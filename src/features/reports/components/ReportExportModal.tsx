import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Overline, MonoText, MetricText, Caption } from "@components/ui/typography";
import { useTranslation } from "@common/i18n/translator";
import { PluginRegistry } from "@plugins/PluginRegistry";
import { registerDefaultExporters } from "@plugins/exporters";
import { ExportPayload } from "@plugins/contracts/IExporterPlugin";
import { MarkdownClipboardExporterPlugin } from "@plugins/exporters/MarkdownClipboardExporterPlugin";
import {
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  FileText,
} from "lucide-react";

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: ExportPayload;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  payload,
}) => {
  const { t } = useTranslation("report");
  const exporters = useMemo(() => {
    registerDefaultExporters();
    return PluginRegistry.getInstance().getExporters();
  }, []);
  const [selectedId, setSelectedId] = useState<string>("csv-exporter");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const activeSelectedId = exporters.some((e) => e.id === selectedId)
    ? selectedId
    : (exporters[0]?.id ?? "csv-exporter");

  const handleDownload = async () => {
    const exporter = PluginRegistry.getInstance().getExporter(activeSelectedId);
    if (!exporter) return;

    const result = await exporter.export(payload);
    const blob =
      result instanceof Blob
        ? result
        : new Blob([result], { type: exporter.mimeType });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedTitle = payload.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `${sanitizedTitle || "report"}_${new Date().toISOString().split("T")[0]}.${exporter.fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = async () => {
    const exporter = PluginRegistry.getInstance().getExporter(activeSelectedId);
    if (exporter instanceof MarkdownClipboardExporterPlugin) {
      await exporter.copyToClipboard(payload);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const selectedExporter = exporters.find((e) => e.id === activeSelectedId);
  const isMarkdown =
    selectedExporter instanceof MarkdownClipboardExporterPlugin;

  const getFormatIcon = (id: string) => {
    if (id.includes("csv"))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (id.includes("json"))
      return <FileCode className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-sky-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="report-export-modal"
        className="max-w-md p-6 bg-card border-border text-foreground"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            {t("ExportReport")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("ExportReportDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-3">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
            <div>
              <Overline>
                {payload.period}
              </Overline>
              <MonoText size="xs" weight="bold" className="text-foreground mt-0.5 block">
                {payload.rows.length} {t("ExportEntriesCount")}
              </MonoText>
            </div>
            <div className="text-right">
              <Overline>
                {t("PeriodTotal")}
              </Overline>
              <MetricText size="sm" weight="extrabold" className="text-foreground mt-0.5 block">
                {payload.formattedTotalDuration}
              </MetricText>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t("SelectFormat")}
            </span>
            <div className="grid grid-cols-1 gap-2">
              {exporters.map((exp) => {
                const isSelected = exp.id === activeSelectedId;
                return (
                  <Button
                    key={exp.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    data-testid={`export-format-${exp.id}`}
                    onClick={() => setSelectedId(exp.id)}
                    className="w-full justify-between h-auto py-2.5 px-3.5 rounded-xl border transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      {getFormatIcon(exp.id)}
                      <div>
                        <Caption weight="semibold">{exp.name}</Caption>
                        <Caption size="2xs" className="opacity-75 font-mono">
                          .{exp.fileExtension}
                        </Caption>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="font-mono"
                      >
                        Active
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
          {isMarkdown ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="export-copy-button"
              onClick={handleCopyClipboard}
              className="gap-2 text-xs"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  {t("CopyToClipboard")}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-muted-foreground" />
                  {t("CopyToClipboard")}
                </>
              )}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="export-cancel-button"
              onClick={onClose}
              className="text-xs"
            >
              {t("Close")}
            </Button>
            <Button
              type="button"
              variant="accent"
              size="sm"
              data-testid="export-download-button"
              onClick={handleDownload}
              className="gap-2 text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              {t("DownloadFile")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportExportModal;
