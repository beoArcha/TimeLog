use super::constants::{ERR_XML_DECODE, ERR_XML_WRITE, XML_PROLOG};
use super::sink_io_error;
use crate::cli::error::CliError;
use crate::types::{
    RangePreset, ReportBillingTotal, ReportDay, ReportDocument, ReportEntry, ReportProject,
    ReportRateStatus, ReportSubtask, ReportTask, ReportVariant, ResolvedRange,
};
use std::fmt::Display;
use std::io::Write;

const INDENT: &str = "  ";

/// Checks if a Unicode scalar value is allowed in XML 1.0 (Fifth Edition).
/// Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
pub fn is_xml_1_0_char(c: char) -> bool {
    let cp = c as u32;
    cp == 0x9
        || cp == 0xA
        || cp == 0xD
        || (0x20..=0xD7FF).contains(&cp)
        || (0xE000..=0xFFFD).contains(&cp)
        || (0x10000..=0x10FFFF).contains(&cp)
}

/// Sanitizes a string for XML 1.0 output by removing disallowed control characters
/// (e.g., U+0000, U+0007, U+FFFE, U+FFFF) while preserving TAB (\t), LF (\n), CR (\r)
/// and all valid Unicode characters (including Polish diacritics and emoji).
pub fn sanitize_xml_text(input: &str) -> String {
    input.chars().filter(|&c| is_xml_1_0_char(c)).collect()
}

#[derive(Clone, Copy)]
enum EscapeContext {
    Text,
    Attribute,
}

fn escape_xml(input: &str, context: EscapeContext) -> String {
    let mut escaped = String::with_capacity(input.len());
    for c in input.chars().filter(|&c| is_xml_1_0_char(c)) {
        match (c, context) {
            ('&', _) => escaped.push_str("&amp;"),
            ('<', _) => escaped.push_str("&lt;"),
            ('>', _) => escaped.push_str("&gt;"),
            // A literal CR is normalized to LF by every parser, so it travels as a character reference.
            ('\r', _) => escaped.push_str("&#13;"),
            ('"', EscapeContext::Attribute) => escaped.push_str("&quot;"),
            // Attribute-value normalization turns literal TAB and LF into spaces.
            ('\t', EscapeContext::Attribute) => escaped.push_str("&#9;"),
            ('\n', EscapeContext::Attribute) => escaped.push_str("&#10;"),
            _ => escaped.push(c),
        }
    }
    escaped
}

struct Tag(String);

impl Tag {
    fn new(name: &str) -> Self {
        Self(format!("<{name}"))
    }

    fn attr(mut self, name: &str, value: impl Display) -> Self {
        let escaped = escape_xml(&value.to_string(), EscapeContext::Attribute);
        self.0.push_str(&format!(" {name}=\"{escaped}\""));
        self
    }

    fn opt_attr(self, name: &str, value: Option<impl Display>) -> Self {
        match value {
            Some(value) => self.attr(name, value),
            None => self,
        }
    }

    fn open(self) -> String {
        self.0 + ">"
    }

    fn empty(self) -> String {
        self.0 + "/>"
    }
}

fn text_element(name: &str, text: &str) -> String {
    let escaped = escape_xml(text, EscapeContext::Text);
    format!("<{name}>{escaped}</{name}>")
}

fn close_tag(name: &str) -> String {
    format!("</{name}>")
}

fn variant_name(variant: ReportVariant) -> &'static str {
    match variant {
        ReportVariant::Full => "full",
        ReportVariant::Summary => "summary",
    }
}

fn preset_name(preset: RangePreset) -> &'static str {
    match preset {
        RangePreset::Today => "today",
        RangePreset::Yesterday => "yesterday",
        RangePreset::Week => "week",
        RangePreset::LastWeek => "lastWeek",
        RangePreset::Month => "month",
        RangePreset::LastMonth => "lastMonth",
        RangePreset::Last30Days => "last30Days",
        RangePreset::Year => "year",
        RangePreset::All => "all",
    }
}

fn rate_status_name(status: ReportRateStatus) -> &'static str {
    match status {
        ReportRateStatus::Inherited => "inherited",
        ReportRateStatus::Custom => "custom",
        ReportRateStatus::NonBillable => "nonBillable",
        ReportRateStatus::Unconfigured => "unconfigured",
    }
}

struct Pricing<'a> {
    rate_minor: Option<u64>,
    currency: Option<&'a str>,
    amount_minor: Option<u64>,
}

impl Pricing<'_> {
    fn apply(&self, tag: Tag) -> Tag {
        tag.opt_attr("rateMinor", self.rate_minor)
            .opt_attr("currency", self.currency)
            .opt_attr("amountMinor", self.amount_minor)
    }
}

struct XmlOut<W: Write> {
    writer: W,
}

impl<W: Write> XmlOut<W> {
    fn line(&mut self, depth: usize, content: &str) -> Result<(), CliError> {
        let mut line = INDENT.repeat(depth);
        line.push_str(content);
        line.push('\n');
        self.writer
            .write_all(line.as_bytes())
            .map_err(|e| sink_io_error(ERR_XML_WRITE, e))
    }

    /// Writes `<name>…</name>`, or `<name/>` when `items` is empty.
    fn list<T>(
        &mut self,
        depth: usize,
        name: &str,
        items: &[T],
        write_item: impl Fn(&mut Self, usize, &T) -> Result<(), CliError>,
    ) -> Result<(), CliError> {
        if items.is_empty() {
            return self.line(depth, &Tag::new(name).empty());
        }
        self.line(depth, &Tag::new(name).open())?;
        for item in items {
            write_item(self, depth + 1, item)?;
        }
        self.line(depth, &close_tag(name))
    }

    fn document(&mut self, document: &ReportDocument) -> Result<(), CliError> {
        self.line(0, XML_PROLOG)?;
        let root = Tag::new("report")
            .attr("schema", &document.schema)
            .attr("schemaVersion", document.schema_version)
            .attr("variant", variant_name(document.variant))
            .open();
        self.line(0, &root)?;
        self.line(1, &text_element("generatedAt", &document.generated_at))?;
        let generator = Tag::new("generator")
            .attr("name", &document.generator.name)
            .attr("version", &document.generator.version);
        self.line(1, &generator.empty())?;
        self.range(&document.range)?;
        let filters = Tag::new("filters")
            .opt_attr("projectId", document.filters.project_id.as_deref())
            .opt_attr("taskId", document.filters.task_id.as_deref())
            .attr("includePatches", document.filters.include_patches);
        self.line(1, &filters.empty())?;
        self.totals(document)?;
        self.list(1, "projects", &document.projects, Self::project)?;
        if document.variant == ReportVariant::Full {
            self.list(1, "days", &document.days, Self::day)?;
            let entries = document.entries.as_deref().unwrap_or_default();
            self.list(1, "entries", entries, Self::entry)?;
        }
        self.line(0, &close_tag("report"))
    }

    fn range(&mut self, range: &ResolvedRange) -> Result<(), CliError> {
        let tag = Tag::new("range")
            .opt_attr("from", range.from.as_deref())
            .opt_attr("to", range.to.as_deref())
            .attr("timezone", &range.timezone)
            .opt_attr("preset", range.preset.map(preset_name));
        self.line(1, &tag.empty())
    }

    fn totals(&mut self, document: &ReportDocument) -> Result<(), CliError> {
        let totals = &document.totals;
        let tag = Tag::new("totals")
            .attr("seconds", totals.seconds)
            .attr("entryCount", totals.entry_count)
            .attr("billableSeconds", totals.billable_seconds)
            .attr("nonBillableSeconds", totals.non_billable_seconds)
            .attr("unconfiguredSeconds", totals.unconfigured_seconds);
        if totals.billing.is_empty() {
            return self.line(1, &tag.empty());
        }
        self.line(1, &tag.open())?;
        self.billing(2, &totals.billing)?;
        self.line(1, &close_tag("totals"))
    }

    fn billing(&mut self, depth: usize, items: &[ReportBillingTotal]) -> Result<(), CliError> {
        for item in items {
            let tag = Tag::new("billing")
                .attr("currency", &item.currency)
                .attr("amountMinor", item.amount_minor)
                .attr("billableSeconds", item.billable_seconds)
                .attr("nonBillableSeconds", item.non_billable_seconds)
                .attr("unconfiguredSeconds", item.unconfigured_seconds);
            self.line(depth, &tag.empty())?;
        }
        Ok(())
    }

    fn project(&mut self, depth: usize, project: &ReportProject) -> Result<(), CliError> {
        let tag = Tag::new("project")
            .attr("id", &project.id)
            .attr("directSeconds", project.direct_seconds)
            .attr("seconds", project.seconds)
            .attr("shareBasisPoints", project.share_basis_points);
        self.line(depth, &tag.open())?;
        self.line(depth + 1, &text_element("name", &project.name))?;
        self.billing(depth + 1, &project.billing)?;
        for task in &project.tasks {
            self.task(depth + 1, task)?;
        }
        self.line(depth, &close_tag("project"))
    }

    fn task(&mut self, depth: usize, task: &ReportTask) -> Result<(), CliError> {
        let pricing = Pricing {
            rate_minor: task.rate_minor,
            currency: task.currency.as_deref(),
            amount_minor: task.amount_minor,
        };
        let tag = Tag::new("task")
            .attr("id", &task.id)
            .attr("directSeconds", task.direct_seconds)
            .attr("seconds", task.seconds)
            .attr("shareBasisPoints", task.share_basis_points)
            .attr("rateStatus", rate_status_name(task.rate_status));
        self.line(depth, &pricing.apply(tag).open())?;
        self.line(depth + 1, &text_element("name", &task.name))?;
        for subtask in &task.subtasks {
            self.subtask(depth + 1, subtask)?;
        }
        self.line(depth, &close_tag("task"))
    }

    fn subtask(&mut self, depth: usize, subtask: &ReportSubtask) -> Result<(), CliError> {
        let pricing = Pricing {
            rate_minor: subtask.rate_minor,
            currency: subtask.currency.as_deref(),
            amount_minor: subtask.amount_minor,
        };
        let tag = Tag::new("subtask")
            .attr("id", &subtask.id)
            .attr("parentTaskId", &subtask.parent_task_id)
            .attr("directSeconds", subtask.direct_seconds)
            .attr("seconds", subtask.seconds)
            .attr("shareBasisPoints", subtask.share_basis_points)
            .attr("rateStatus", rate_status_name(subtask.rate_status));
        self.line(depth, &pricing.apply(tag).open())?;
        self.line(depth + 1, &text_element("name", &subtask.name))?;
        self.line(depth, &close_tag("subtask"))
    }

    fn day(&mut self, depth: usize, day: &ReportDay) -> Result<(), CliError> {
        let tag = Tag::new("day")
            .attr("date", &day.date)
            .attr("seconds", day.seconds);
        self.line(depth, &tag.empty())
    }

    fn entry(&mut self, depth: usize, entry: &ReportEntry) -> Result<(), CliError> {
        let pricing = Pricing {
            rate_minor: entry.rate_minor,
            currency: entry.currency.as_deref(),
            amount_minor: entry.amount_minor,
        };
        let tag = Tag::new("entry")
            .attr("id", &entry.id)
            .attr("projectId", &entry.project_id)
            .opt_attr("taskId", entry.task_id.as_deref())
            .opt_attr("rootTaskId", entry.root_task_id.as_deref())
            .opt_attr("parentTaskId", entry.parent_task_id.as_deref())
            .attr("start", &entry.start)
            .opt_attr("end", entry.end.as_deref())
            .attr("date", &entry.date)
            .attr("seconds", entry.seconds)
            .attr("originalSeconds", entry.original_seconds)
            .attr("clamped", entry.clamped)
            .attr("isPatch", entry.is_patch);
        self.line(depth, &pricing.apply(tag).open())?;
        self.line(depth + 1, &text_element("projectName", &entry.project_name))?;
        let optional_texts = [
            ("taskName", entry.task_name.as_deref()),
            ("parentTaskName", entry.parent_task_name.as_deref()),
            ("note", entry.note.as_deref()),
        ];
        for (name, text) in optional_texts {
            if let Some(text) = text {
                self.line(depth + 1, &text_element(name, text))?;
            }
        }
        self.line(depth, &close_tag("entry"))
    }
}

/// Writes the `ReportDocument` as `oxy.report` v2 XML (`schemas/xml/report/v2/report.xsd`).
///
/// Element order is the document order; nothing is re-sorted. Days and entries are written for
/// the full variant only.
pub fn write_xml<W: Write>(document: &ReportDocument, writer: W) -> Result<(), CliError> {
    XmlOut { writer }.document(document)
}

pub fn export_xml(document: &ReportDocument) -> Result<String, CliError> {
    let mut buffer = Vec::new();
    write_xml(document, &mut buffer)?;
    String::from_utf8(buffer).map_err(|e| sink_io_error(ERR_XML_DECODE, e))
}
