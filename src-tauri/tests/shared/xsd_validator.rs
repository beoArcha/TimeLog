#![allow(dead_code)]

//! A validator for the XSD subset used by `schemas/xml/report/v2/report.xsd`.
//!
//! No native XSD validator is available to the Rust test suite, so this one interprets the
//! schema file itself: named complex and simple types, `xs:sequence` of elements with
//! `minOccurs` / `maxOccurs`, attributes with `use` / `fixed`, attribute groups, enumerations
//! and the built-in types the schema references. Anything else in the schema is reported as
//! unsupported instead of being ignored, so a schema change cannot silently pass.

use quick_xml::events::Event;
use quick_xml::{Reader, XmlVersion};

#[derive(Debug, Default, Clone)]
pub struct Node {
    pub name: String,
    pub attrs: Vec<(String, String)>,
    pub children: Vec<Node>,
    pub text: String,
}

impl Node {
    pub fn attr(&self, name: &str) -> Option<&str> {
        self.attrs
            .iter()
            .find(|(key, _)| key == name)
            .map(|(_, value)| value.as_str())
    }

    pub fn child(&self, name: &str) -> Option<&Node> {
        self.children.iter().find(|child| child.name == name)
    }

    pub fn children_named<'a>(&'a self, name: &'a str) -> impl Iterator<Item = &'a Node> {
        self.children.iter().filter(move |child| child.name == name)
    }
}

fn local_name(name: &str) -> &str {
    name.rsplit(':').next().unwrap_or(name)
}

fn resolve_entity(name: &str) -> Result<char, String> {
    match name {
        "amp" => Ok('&'),
        "lt" => Ok('<'),
        "gt" => Ok('>'),
        "quot" => Ok('"'),
        "apos" => Ok('\''),
        other => Err(format!("unknown entity &{other};")),
    }
}

fn start_node(start: &quick_xml::events::BytesStart<'_>) -> Result<Node, String> {
    let mut node = Node {
        name: start.name().as_ref().to_string(),
        ..Node::default()
    };
    for attribute in start.attributes() {
        let attribute = attribute.map_err(|e| e.to_string())?;
        let value = attribute
            .normalized_value(XmlVersion::Implicit1_0)
            .map_err(|e| e.to_string())?;
        node.attrs
            .push((attribute.key.as_ref().to_string(), value.into_owned()));
    }
    Ok(node)
}

pub fn parse_xml(xml: &str) -> Result<Node, String> {
    let mut reader = Reader::from_str(xml);
    let mut stack: Vec<Node> = Vec::new();
    let mut root: Option<Node> = None;
    loop {
        match reader.read_event().map_err(|e| e.to_string())? {
            Event::Start(start) => stack.push(start_node(&start)?),
            Event::Empty(start) => attach(&mut stack, &mut root, start_node(&start)?)?,
            Event::End(_) => {
                let node = stack.pop().ok_or("unbalanced end tag")?;
                attach(&mut stack, &mut root, node)?;
            }
            Event::Text(text) => push_text(&mut stack, &text.xml_content(XmlVersion::Implicit1_0)),
            Event::CData(data) => push_text(&mut stack, &data.xml_content(XmlVersion::Implicit1_0)),
            Event::GeneralRef(reference) => {
                let resolved = match reference.resolve_char_ref().map_err(|e| e.to_string())? {
                    Some(c) => c,
                    None => resolve_entity(&reference)?,
                };
                push_text(&mut stack, &resolved.to_string());
            }
            Event::Eof => break,
            _ => {}
        }
    }
    if !stack.is_empty() {
        return Err("unclosed element".to_string());
    }
    root.ok_or_else(|| "document has no root element".to_string())
}

fn push_text(stack: &mut [Node], text: &str) {
    if let Some(top) = stack.last_mut() {
        top.text.push_str(text);
    }
}

fn attach(stack: &mut [Node], root: &mut Option<Node>, node: Node) -> Result<(), String> {
    match stack.last_mut() {
        Some(parent) => parent.children.push(node),
        None if root.is_none() => *root = Some(node),
        None => return Err("more than one root element".to_string()),
    }
    Ok(())
}

pub struct Xsd {
    schema: Node,
}

impl Xsd {
    pub fn parse(xsd: &str) -> Result<Self, String> {
        let mut schema = parse_xml(xsd)?;
        strip_prefixes(&mut schema);
        Ok(Self { schema })
    }

    pub fn validate(&self, xml: &str) -> Result<(), String> {
        let document = parse_xml(xml)?;
        let declaration = self
            .global("element", &document.name)
            .ok_or_else(|| format!("no global element '{}' in the schema", document.name))?;
        self.validate_element(declaration, &document, &document.name)
    }

    fn global<'a>(&'a self, kind: &str, name: &str) -> Option<&'a Node> {
        self.schema
            .children
            .iter()
            .find(|node| node.name == kind && node.attr("name") == Some(name))
    }

    fn validate_element(&self, declaration: &Node, node: &Node, path: &str) -> Result<(), String> {
        let type_name = declaration
            .attr("type")
            .ok_or_else(|| format!("{path}: anonymous types are not supported"))?;
        if let Some(complex) = self.global("complexType", type_name) {
            return self.validate_complex(complex, node, path);
        }
        if !node.children.is_empty() || !node.attrs.is_empty() {
            return Err(format!("{path}: simple content expected"));
        }
        self.validate_value(type_name, &node.text)
            .map_err(|e| format!("{path}: {e}"))
    }

    fn validate_complex(&self, complex: &Node, node: &Node, path: &str) -> Result<(), String> {
        self.validate_attributes(complex, node, path)?;
        let sequence = complex.child("sequence");
        let Some(sequence) = sequence else {
            return if node.children.is_empty() {
                Ok(())
            } else {
                Err(format!("{path}: no child elements expected"))
            };
        };
        if !node.text.trim().is_empty() {
            return Err(format!("{path}: unexpected text content"));
        }
        let mut next = 0;
        for particle in sequence.children_named("element") {
            next += self.match_particle(particle, &node.children[next..], path)?;
        }
        match node.children.get(next) {
            Some(extra) => Err(format!("{path}: unexpected element <{}>", extra.name)),
            None => Ok(()),
        }
    }

    fn match_particle(
        &self,
        particle: &Node,
        remaining: &[Node],
        path: &str,
    ) -> Result<usize, String> {
        let name = particle.attr("name").ok_or("element without a name")?;
        let min = occurs(particle.attr("minOccurs"), 1)?;
        let max = occurs(particle.attr("maxOccurs"), 1)?;
        let mut count = 0;
        for child in remaining.iter().take_while(|child| child.name == name) {
            if count == max {
                break;
            }
            self.validate_element(particle, child, &format!("{path}/{name}"))?;
            count += 1;
        }
        if count < min {
            return Err(format!(
                "{path}: <{name}> is required {min} time(s), found {count}"
            ));
        }
        Ok(count)
    }

    fn attribute_declarations<'a>(&'a self, owner: &'a Node) -> Result<Vec<&'a Node>, String> {
        let mut declarations = Vec::new();
        for child in &owner.children {
            match child.name.as_str() {
                "attribute" => declarations.push(child),
                "attributeGroup" => {
                    let reference = child.attr("ref").ok_or("attributeGroup without ref")?;
                    let group = self
                        .global("attributeGroup", reference)
                        .ok_or_else(|| format!("unknown attributeGroup '{reference}'"))?;
                    declarations.extend(self.attribute_declarations(group)?);
                }
                _ => {}
            }
        }
        Ok(declarations)
    }

    fn validate_attributes(&self, complex: &Node, node: &Node, path: &str) -> Result<(), String> {
        let declarations = self.attribute_declarations(complex)?;
        for (name, value) in &node.attrs {
            let declaration = declarations
                .iter()
                .find(|declaration| declaration.attr("name") == Some(name))
                .ok_or_else(|| format!("{path}: unexpected attribute '{name}'"))?;
            let type_name = declaration.attr("type").unwrap_or("string");
            self.validate_value(type_name, value)
                .map_err(|e| format!("{path}@{name}: {e}"))?;
            if let Some(fixed) = declaration.attr("fixed").filter(|fixed| fixed != value) {
                return Err(format!("{path}@{name}: must be '{fixed}', found '{value}'"));
            }
        }
        for declaration in declarations {
            let name = declaration.attr("name").ok_or("attribute without a name")?;
            if declaration.attr("use") == Some("required") && node.attr(name).is_none() {
                return Err(format!("{path}: missing required attribute '{name}'"));
            }
        }
        Ok(())
    }

    fn validate_value(&self, type_name: &str, value: &str) -> Result<(), String> {
        if let Some(simple) = self.global("simpleType", type_name) {
            return self.validate_restriction(simple, value);
        }
        match type_name {
            "string" => Ok(()),
            "nonNegativeInteger" => check(
                !value.is_empty() && value.chars().all(|c| c.is_ascii_digit()),
                value,
                type_name,
            ),
            "boolean" => check(
                matches!(value, "true" | "false" | "1" | "0"),
                value,
                type_name,
            ),
            "date" => check(is_date(value), value, type_name),
            "dateTime" => check(is_date_time(value), value, type_name),
            other => Err(format!("unsupported type '{other}'")),
        }
    }

    fn validate_restriction(&self, simple: &Node, value: &str) -> Result<(), String> {
        let restriction = simple
            .child("restriction")
            .ok_or("simpleType without restriction")?;
        let base = restriction.attr("base").ok_or("restriction without base")?;
        self.validate_value(base, value)?;
        let allowed: Vec<&str> = restriction
            .children_named("enumeration")
            .filter_map(|e| e.attr("value"))
            .collect();
        check(
            allowed.is_empty() || allowed.contains(&value),
            value,
            &format!("one of {allowed:?}"),
        )
    }
}

fn strip_prefixes(node: &mut Node) {
    node.name = local_name(&node.name).to_string();
    for (key, value) in node.attrs.iter_mut() {
        if key == "type" || key == "base" {
            *value = value.strip_prefix("xs:").unwrap_or(value).to_string();
        }
    }
    node.children.iter_mut().for_each(strip_prefixes);
}

fn occurs(value: Option<&str>, default: usize) -> Result<usize, String> {
    match value {
        None => Ok(default),
        Some("unbounded") => Ok(usize::MAX),
        Some(number) => number.parse().map_err(|_| format!("bad occurs '{number}'")),
    }
}

fn check(condition: bool, value: &str, expected: &str) -> Result<(), String> {
    if condition {
        Ok(())
    } else {
        Err(format!("'{value}' is not a valid {expected}"))
    }
}

fn digits(text: &str, len: usize) -> Option<u32> {
    if text.len() == len && text.chars().all(|c| c.is_ascii_digit()) {
        text.parse().ok()
    } else {
        None
    }
}

fn is_date(value: &str) -> bool {
    let parts: Vec<&str> = value.split('-').collect();
    let [year, month, day] = parts[..] else {
        return false;
    };
    let month = digits(month, 2).unwrap_or(0);
    let day = digits(day, 2).unwrap_or(0);
    digits(year, 4).is_some() && (1..=12).contains(&month) && (1..=31).contains(&day)
}

fn is_date_time(value: &str) -> bool {
    let Some((date, time)) = value.split_once('T') else {
        return false;
    };
    let time = time.strip_suffix('Z').unwrap_or(time);
    let clock = time.split('.').next().unwrap_or(time);
    let parts: Vec<&str> = clock.split(':').collect();
    let [hour, minute, second] = parts[..] else {
        return false;
    };
    is_date(date)
        && digits(hour, 2).is_some_and(|h| h < 24)
        && digits(minute, 2).is_some_and(|m| m < 60)
        && digits(second, 2).is_some_and(|s| s < 60)
}

pub const REPORT_XSD_V2: &str = include_str!("../../../schemas/xml/report/v2/report.xsd");

pub fn assert_valid_report_xml(xml: &str) {
    let xsd = Xsd::parse(REPORT_XSD_V2).expect("the v2 XSD must parse");
    if let Err(error) = xsd.validate(xml) {
        panic!("XML does not satisfy report.xsd v2: {error}\n{xml}");
    }
}
