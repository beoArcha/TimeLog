use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export_to = "../../src/bindings/SinkType.ts")]
pub enum SinkType {
    Csv,
}
