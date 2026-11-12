use crate::cli::error::CliError;
use crate::types::{ReportDocument, SuccessEnvelope};
use schemars::generate::SchemaSettings;
use schemars::transform::RecursiveTransform;
use schemars::{JsonSchema, Schema};
use serde_json::{Map, Value};

const NULL_TYPE: &str = "null";

fn render<T: JsonSchema>() -> Result<String, CliError> {
    // Serialize mode describes what the CLI emits.
    let generator = SchemaSettings::draft2020_12()
        .for_serialize()
        .with_transform(RecursiveTransform(forbid_null_in_optional_properties))
        .into_generator();
    let schema = generator.into_root_schema_for::<T>();
    Ok(serde_json::to_string_pretty(&schema)?)
}

pub fn report_json_schema() -> Result<String, CliError> {
    render::<ReportDocument>()
}

pub fn envelope_json_schema() -> Result<String, CliError> {
    render::<SuccessEnvelope>()
}

/// `Option<T>` generates a nullable type, but absent values are omitted from the document and
/// never written as `null`, so an optional property must not accept `null`.
fn forbid_null_in_optional_properties(schema: &mut Schema) {
    let Some(object) = schema.as_object_mut() else {
        return;
    };
    let required = required_names(object);
    let Some(properties) = object.get_mut("properties").and_then(Value::as_object_mut) else {
        return;
    };
    for (name, property) in properties.iter_mut() {
        if !required.contains(name) {
            remove_null_alternative(property);
        }
    }
}

fn required_names(object: &Map<String, Value>) -> Vec<String> {
    object
        .get("required")
        .and_then(Value::as_array)
        .map(|names| {
            names
                .iter()
                .filter_map(|name| name.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

fn remove_null_alternative(property: &mut Value) {
    let Some(object) = property.as_object_mut() else {
        return;
    };
    strip_null_from_type_array(object);
    strip_null_from_any_of(object);
}

fn is_null_type(value: &Value) -> bool {
    value.as_str() == Some(NULL_TYPE)
}

fn strip_null_from_type_array(object: &mut Map<String, Value>) {
    let Some(types) = object.get_mut("type").and_then(Value::as_array_mut) else {
        return;
    };
    types.retain(|value| !is_null_type(value));
    if types.len() == 1 {
        let only = types.remove(0);
        object.insert("type".to_string(), only);
    }
}

/// `anyOf: [{ "$ref": … }, { "type": "null" }]` collapses to the remaining alternative.
fn strip_null_from_any_of(object: &mut Map<String, Value>) {
    let Some(alternatives) = object.get_mut("anyOf").and_then(Value::as_array_mut) else {
        return;
    };
    alternatives.retain(|alternative| alternative.get("type").is_none_or(|t| !is_null_type(t)));
    if alternatives.len() != 1 {
        return;
    }
    let remaining = alternatives.remove(0);
    object.remove("anyOf");
    if let Value::Object(fields) = remaining {
        object.extend(fields);
    }
}
