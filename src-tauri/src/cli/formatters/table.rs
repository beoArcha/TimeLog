use super::constants::{
    TABLE_COLUMN_SEPARATOR, TABLE_ELLIPSIS, TABLE_SEPARATOR_PLAIN, TABLE_SEPARATOR_RICH,
};
use super::decoration::DecorationMode;
use unicode_width::{UnicodeWidthChar, UnicodeWidthStr};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Align {
    Left,
    Right,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Column {
    pub header: String,
    pub align: Align,
    /// Maximum display width for row cells in this column.
    /// Headers are never truncated, so a column may end up wider than `max_width`.
    pub max_width: Option<usize>,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum TableError {
    #[error("Row has {actual} cells, exceeding column count of {expected}")]
    TooManyCells { expected: usize, actual: usize },
}

fn truncate_cell(s: &str, max_width: usize) -> String {
    let total_width = UnicodeWidthStr::width(s);
    if total_width <= max_width {
        return s.to_string();
    }

    let ellipsis = TABLE_ELLIPSIS;
    let ellipsis_width = UnicodeWidthStr::width(ellipsis);
    if max_width < ellipsis_width {
        return String::new();
    }

    let target_prefix_width = max_width - ellipsis_width;
    let mut current_width = 0;
    let mut prefix_end = 0;

    for (idx, ch) in s.char_indices() {
        let ch_width = UnicodeWidthChar::width(ch).unwrap_or(0);
        if current_width + ch_width > target_prefix_width {
            break;
        }
        current_width += ch_width;
        prefix_end = idx + ch.len_utf8();
    }

    format!("{}{}", &s[..prefix_end], ellipsis)
}

fn format_cell(content: &str, col_width: usize, align: Align) -> String {
    let content_width = UnicodeWidthStr::width(content);
    let padding_size = col_width.saturating_sub(content_width);
    let padding = " ".repeat(padding_size);

    match align {
        Align::Left => format!("{}{}", content, padding),
        Align::Right => format!("{}{}", padding, content),
    }
}

fn prepare_rows(columns: &[Column], rows: &[Vec<String>]) -> Result<Vec<Vec<String>>, TableError> {
    let mut processed_rows = Vec::with_capacity(rows.len());
    for row in rows {
        if row.len() > columns.len() {
            return Err(TableError::TooManyCells {
                expected: columns.len(),
                actual: row.len(),
            });
        }

        let mut processed_cells = Vec::with_capacity(columns.len());
        for (col_idx, col) in columns.iter().enumerate() {
            let raw_cell = row.get(col_idx).map(|s| s.as_str()).unwrap_or("");
            let cell = match col.max_width {
                Some(mw) => truncate_cell(raw_cell, mw),
                None => raw_cell.to_string(),
            };
            processed_cells.push(cell);
        }
        processed_rows.push(processed_cells);
    }

    Ok(processed_rows)
}

fn column_widths(columns: &[Column], rows: &[Vec<String>]) -> Vec<usize> {
    let mut widths = Vec::with_capacity(columns.len());
    for (col_idx, col) in columns.iter().enumerate() {
        let mut max_w = UnicodeWidthStr::width(col.header.as_str());
        for row in rows {
            let cell_w = UnicodeWidthStr::width(row[col_idx].as_str());
            if cell_w > max_w {
                max_w = cell_w;
            }
        }
        widths.push(max_w);
    }
    widths
}

fn render_line(cells: &[String], widths: &[usize], columns: &[Column]) -> String {
    let formatted_cells: Vec<String> = cells
        .iter()
        .enumerate()
        .map(|(idx, cell)| format_cell(cell, widths[idx], columns[idx].align))
        .collect();
    let line = formatted_cells.join(TABLE_COLUMN_SEPARATOR);
    format!("{}\n", line.trim_end())
}

fn separator_line(widths: &[usize], mode: DecorationMode) -> String {
    let separator_char = match mode {
        DecorationMode::Rich => TABLE_SEPARATOR_RICH,
        DecorationMode::Plain => TABLE_SEPARATOR_PLAIN,
    };
    let total_width = widths.iter().sum::<usize>()
        + (widths.len().saturating_sub(1)) * UnicodeWidthStr::width(TABLE_COLUMN_SEPARATOR);
    format!("{}\n", separator_char.repeat(total_width))
}

pub fn render_table(
    columns: &[Column],
    rows: &[Vec<String>],
    mode: DecorationMode,
) -> Result<String, TableError> {
    let processed_rows = prepare_rows(columns, rows)?;
    if columns.is_empty() {
        return Ok(String::new());
    }

    let widths = column_widths(columns, &processed_rows);
    let headers: Vec<String> = columns.iter().map(|col| col.header.clone()).collect();

    let mut output = render_line(&headers, &widths, columns);
    output.push_str(&separator_line(&widths, mode));
    for row in &processed_rows {
        output.push_str(&render_line(row, &widths, columns));
    }

    Ok(output)
}
