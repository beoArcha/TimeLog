pub mod billing;
pub mod error;
pub mod metrics;
pub mod range;
pub mod timer;
pub mod validation;

pub use error::EngineError;
pub use timer::StartOutcome;

use crate::persistence::Persistence;

pub struct Engine<'a> {
    pub(crate) persistence: &'a Persistence,
}

impl<'a> Engine<'a> {
    pub fn new(persistence: &'a Persistence) -> Self {
        Self { persistence }
    }
}
