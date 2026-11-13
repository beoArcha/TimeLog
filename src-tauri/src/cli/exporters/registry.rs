use super::constants::{
    ERR_BINARY_FORMAT_NEEDS_OUTPUT, ERR_FORMAT_FLAG, ERR_FORMAT_NOT_REGISTERED, ERR_VARIANT_FLAG,
    ERR_VARIANT_UNSUPPORTED,
};
use super::{sink_io_error, write_csv, write_html, write_json, write_ods, write_xlsx, write_xml};
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::formatters::{render_tree_string, to_report_tree_dto};
use crate::cli::parser::{ExportFormat, ReportVariantArg};
use crate::types::ReportDocument;
use clap::ValueEnum;
use std::io::Write;

const ALL_VARIANTS: &[ReportVariantArg] = &[ReportVariantArg::Full, ReportVariantArg::Summary];
const FULL_ONLY: &[ReportVariantArg] = &[ReportVariantArg::Full];

/// `Data` formats are meant to be read by programs, `Human` formats by people.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FormatGroup {
    Data,
    Human,
}

pub type DocumentWriter = fn(&ReportDocument, &mut dyn Write) -> Result<(), CliError>;

#[derive(Debug, Clone, Copy)]
pub struct FormatSpec {
    pub format: ExportFormat,
    pub group: FormatGroup,
    pub variants: &'static [ReportVariantArg],
    pub binary: bool,
    /// Whether the output contains localized labels (always `false` until `--lang` lands).
    pub locale_dependent: bool,
    pub writer: DocumentWriter,
}

impl FormatSpec {
    pub fn name(&self) -> String {
        format_name(self.format)
    }

    pub fn supports(&self, variant: ReportVariantArg) -> bool {
        self.variants.contains(&variant)
    }

    pub fn ensure_supports(&self, variant: ReportVariantArg) -> Result<(), CliError> {
        if self.supports(variant) {
            return Ok(());
        }
        let supported = self
            .variants
            .iter()
            .map(|v| variant_name(*v))
            .collect::<Vec<_>>()
            .join(", ");
        let value = variant_name(variant);
        Err(CliError::Syntax(CliSyntaxError::InvalidArgument {
            message: ERR_VARIANT_UNSUPPORTED
                .replacen("{}", &self.name(), 1)
                .replacen("{}", &value, 1)
                .replacen("{}", &supported, 1),
            field: Some(ERR_VARIANT_FLAG.to_string()),
            value: Some(value),
        }))
    }

    /// A binary payload would corrupt a terminal, so it needs an explicit destination.
    pub fn ensure_text(&self) -> Result<(), CliError> {
        if !self.binary {
            return Ok(());
        }
        let name = self.name();
        Err(CliError::Syntax(CliSyntaxError::InvalidArgument {
            message: ERR_BINARY_FORMAT_NEEDS_OUTPUT.replacen("{}", &name, 1),
            field: Some(ERR_FORMAT_FLAG.to_string()),
            value: Some(name),
        }))
    }
}

/// The CLI spelling of a format, taken from the `ValueEnum` so help text and messages cannot drift.
pub fn format_name(format: ExportFormat) -> String {
    format
        .to_possible_value()
        .map(|value| value.get_name().to_string())
        .unwrap_or_default()
}

pub fn variant_name(variant: ReportVariantArg) -> String {
    variant
        .to_possible_value()
        .map(|value| value.get_name().to_string())
        .unwrap_or_default()
}

pub fn registry() -> &'static [FormatSpec] {
    &REGISTRY
}

pub fn format_spec(format: ExportFormat) -> Result<&'static FormatSpec, CliError> {
    REGISTRY
        .iter()
        .find(|spec| spec.format == format)
        .ok_or_else(|| {
            CliError::syntax_invalid_args(ERR_FORMAT_NOT_REGISTERED.replacen(
                "{}",
                &format_name(format),
                1,
            ))
        })
}

// Order follows `ExportFormat`; the registry test fails when a format is missing or duplicated.
static REGISTRY: [FormatSpec; 7] = [
    FormatSpec {
        format: ExportFormat::Table,
        group: FormatGroup::Human,
        variants: ALL_VARIANTS,
        binary: false,
        locale_dependent: false,
        writer: write_table_document,
    },
    FormatSpec {
        format: ExportFormat::Html,
        group: FormatGroup::Human,
        variants: ALL_VARIANTS,
        binary: false,
        locale_dependent: false,
        writer: write_html_document,
    },
    FormatSpec {
        format: ExportFormat::Csv,
        group: FormatGroup::Data,
        variants: ALL_VARIANTS,
        binary: false,
        locale_dependent: false,
        writer: write_csv_document,
    },
    FormatSpec {
        format: ExportFormat::Json,
        group: FormatGroup::Data,
        variants: ALL_VARIANTS,
        binary: false,
        locale_dependent: false,
        writer: write_json_document,
    },
    // The legacy XML schema always carries an `<entries>` section, which only the full variant fills.
    FormatSpec {
        format: ExportFormat::Xml,
        group: FormatGroup::Data,
        variants: FULL_ONLY,
        binary: false,
        locale_dependent: false,
        writer: write_xml_document,
    },
    FormatSpec {
        format: ExportFormat::Ods,
        group: FormatGroup::Human,
        variants: ALL_VARIANTS,
        binary: true,
        locale_dependent: false,
        writer: write_ods_document,
    },
    FormatSpec {
        format: ExportFormat::Xlsx,
        group: FormatGroup::Human,
        variants: ALL_VARIANTS,
        binary: true,
        locale_dependent: false,
        writer: write_xlsx_document,
    },
];

fn write_table_document(document: &ReportDocument, writer: &mut dyn Write) -> Result<(), CliError> {
    let rendered = render_tree_string(&to_report_tree_dto(document));
    let terminator = if rendered.ends_with('\n') { "" } else { "\n" };
    writer
        .write_all(format!("{rendered}{terminator}").as_bytes())
        .map_err(|e| sink_io_error("Failed to write table report", e))
}

fn write_html_document(document: &ReportDocument, writer: &mut dyn Write) -> Result<(), CliError> {
    write_html(&to_report_tree_dto(document), writer)
}

fn write_csv_document(document: &ReportDocument, writer: &mut dyn Write) -> Result<(), CliError> {
    write_csv(&to_report_tree_dto(document), writer)
}

fn write_json_document(document: &ReportDocument, writer: &mut dyn Write) -> Result<(), CliError> {
    write_json(document, writer)
}

fn write_xml_document(document: &ReportDocument, writer: &mut dyn Write) -> Result<(), CliError> {
    write_xml(&to_report_tree_dto(document), writer)
}

fn write_ods_document(document: &ReportDocument, writer: &mut dyn Write) -> Result<(), CliError> {
    write_ods(&to_report_tree_dto(document), writer)
}

fn write_xlsx_document(document: &ReportDocument, writer: &mut dyn Write) -> Result<(), CliError> {
    write_xlsx(&to_report_tree_dto(document), writer)
}
