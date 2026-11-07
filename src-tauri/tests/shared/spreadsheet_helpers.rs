#![allow(dead_code)]

use calamine::{Data, Range};
use spreadsheet_ods::Sheet;

pub fn get_xlsx_cell_str(range: &Range<Data>, row: usize, col: usize) -> String {
    match range.get((row, col)) {
        Some(Data::String(s)) => s.clone(),
        Some(Data::Float(f)) => f.to_string(),
        Some(Data::Int(i)) => i.to_string(),
        Some(Data::Empty) => String::new(),
        _ => String::new(),
    }
}

pub fn get_xlsx_cell_f64(range: &Range<Data>, row: usize, col: usize) -> f64 {
    match range.get((row, col)) {
        Some(Data::Float(f)) => *f,
        Some(Data::Int(i)) => *i as f64,
        Some(Data::String(s)) => s.parse().unwrap_or(0.0),
        _ => 0.0,
    }
}

pub fn get_ods_cell_str(sheet: &Sheet, row: usize, col: usize) -> String {
    sheet
        .value(row as u32, col as u32)
        .as_str_or("")
        .to_string()
}

pub fn get_ods_cell_f64(sheet: &Sheet, row: usize, col: usize) -> f64 {
    sheet.value(row as u32, col as u32).as_f64_or(0.0)
}
