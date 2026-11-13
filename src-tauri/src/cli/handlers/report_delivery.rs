use crate::cli::error::CliError;
use crate::cli::exporters::constants::{EXPORT_STDOUT_TARGET, MSG_EXPORT_SUCCESS};
use crate::cli::exporters::{export_to_bytes, export_to_file, format_name, format_spec};
use crate::cli::formatters::{render_total_row, render_tree_string, to_report_tree_dto};
use crate::cli::parser::{ExportFormat, ReportArgs};
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::types::{
    ReportDocument, ReportExportPayload, REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION,
};

/// Tracks the `ReportDocument` version, so a consumer pins one number for both.
const SCHEMA_REPORT: EnvelopeSchema =
    EnvelopeSchema::new(REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION);
const SCHEMA_REPORT_EXPORT: EnvelopeSchema = EnvelopeSchema::new("oxy.report.export", 1);

/// What `-o <path>` prints once the file is written.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportReceipt {
    Message,
    PathOnly,
    Envelope,
}

/// Where a report goes, decided from the flags before the Engine is asked for anything.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReportDelivery {
    Envelope,
    Table {
        quiet: bool,
    },
    Stdout {
        format: ExportFormat,
    },
    File {
        format: ExportFormat,
        path: String,
        receipt: ExportReceipt,
    },
}

impl ReportDelivery {
    /// `--json` / `--machine` without `-o` always prints the document envelope, so `--format` is
    /// not consulted; with `-o -` the export is the only thing on stdout in every mode.
    pub fn plan(args: &ReportArgs, is_machine: bool, is_quiet: bool) -> Result<Self, CliError> {
        let format = args.format;
        match (args.output.as_deref(), is_machine) {
            (None, true) => Ok(Self::Envelope),
            (None, false) if format == ExportFormat::Table => Ok(Self::Table { quiet: is_quiet }),
            (None, false) => {
                let spec = format_spec(format)?;
                spec.ensure_supports(args.variant)?;
                spec.ensure_text()?;
                Ok(Self::Stdout { format })
            }
            (Some(EXPORT_STDOUT_TARGET), _) => {
                format_spec(format)?.ensure_supports(args.variant)?;
                Ok(Self::Stdout { format })
            }
            (Some(path), _) => {
                format_spec(format)?.ensure_supports(args.variant)?;
                Ok(Self::File {
                    format,
                    path: path.to_string(),
                    receipt: receipt_for(is_machine, is_quiet),
                })
            }
        }
    }
}

fn receipt_for(is_machine: bool, is_quiet: bool) -> ExportReceipt {
    match (is_machine, is_quiet) {
        (true, _) => ExportReceipt::Envelope,
        (false, true) => ExportReceipt::PathOnly,
        (false, false) => ExportReceipt::Message,
    }
}

pub fn deliver(
    document: &ReportDocument,
    delivery: &ReportDelivery,
) -> Result<CliOutput, CliError> {
    match delivery {
        ReportDelivery::Envelope => CliOutput::envelope(SCHEMA_REPORT, document),
        ReportDelivery::Table { quiet } => Ok(table_output(document, *quiet)),
        ReportDelivery::Stdout { format } => {
            Ok(CliOutput::Bytes(export_to_bytes(document, *format)?))
        }
        ReportDelivery::File {
            format,
            path,
            receipt,
        } => {
            export_to_file(document, *format, path)?;
            file_receipt(document, *format, path, *receipt)
        }
    }
}

fn table_output(document: &ReportDocument, quiet: bool) -> CliOutput {
    let tree = to_report_tree_dto(document);
    if quiet {
        return CliOutput::Raw(render_total_row(&tree).trim_end().to_string());
    }
    CliOutput::Success(render_tree_string(&tree))
}

fn file_receipt(
    document: &ReportDocument,
    format: ExportFormat,
    path: &str,
    receipt: ExportReceipt,
) -> Result<CliOutput, CliError> {
    let name = format_name(format);
    match receipt {
        ExportReceipt::Envelope => CliOutput::envelope(
            SCHEMA_REPORT_EXPORT,
            &ReportExportPayload {
                path: path.to_string(),
                format: name,
                variant: document.variant,
                total_seconds: document.totals.seconds,
            },
        ),
        ExportReceipt::PathOnly => Ok(CliOutput::Raw(path.to_string())),
        ExportReceipt::Message => Ok(CliOutput::Success(
            MSG_EXPORT_SUCCESS
                .replacen("{}", path, 1)
                .replacen("{}", &name, 1),
        )),
    }
}
