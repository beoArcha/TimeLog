use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Represents a tri-state value for patch/update semantics:
/// - `Absent`: Field was omitted by caller -> leave unchanged in storage.
/// - `Set(None)`: Field was explicitly set to null -> clear value in storage.
/// - `Set(Some(v))`: Field was explicitly set to a value -> update value in storage.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum TriState<T> {
    #[default]
    Absent,
    Set(Option<T>),
}

impl<'de, T: Deserialize<'de>> Deserialize<'de> for TriState<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        Option::<T>::deserialize(deserializer).map(TriState::Set)
    }
}

impl<T: Serialize> Serialize for TriState<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self {
            TriState::Absent => serializer.serialize_none(),
            TriState::Set(opt) => opt.serialize(serializer),
        }
    }
}

impl<T> TriState<T> {
    pub fn is_absent(&self) -> bool {
        matches!(self, TriState::Absent)
    }

    pub fn is_set(&self) -> bool {
        matches!(self, TriState::Set(_))
    }

    pub fn as_set(&self) -> Option<Option<&T>> {
        match self {
            TriState::Absent => None,
            TriState::Set(opt) => Some(opt.as_ref()),
        }
    }
}
