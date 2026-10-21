use std::path::Path;
use tauri::Url;

pub const DEFAULT_DEV_URL: &str = "http://127.0.0.1:3000/";

pub fn resolve_authorized_dev_origin(config_path: Option<&Path>) -> String {
    if let Some(dev_url) = std::env::var("DEV_URL")
        .ok()
        .filter(|s| !s.trim().is_empty())
    {
        let trimmed = dev_url.trim();
        let mut url = trimmed.to_string();
        if !url.ends_with('/') {
            url.push('/');
        }
        return url;
    }

    let default_path = Path::new("../dev.config.json");
    let target_path = config_path.unwrap_or(default_path);

    if let Ok(content) = std::fs::read_to_string(target_path) {
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&content) {
            let protocol = parsed
                .get("protocol")
                .and_then(|v| v.as_str())
                .unwrap_or("http");
            let host = parsed
                .get("host")
                .and_then(|v| v.as_str())
                .unwrap_or("127.0.0.1");
            let port = parsed.get("port").and_then(|v| v.as_u64()).unwrap_or(3000);
            return format!("{}://{}:{}/", protocol, host, port);
        }
    }

    DEFAULT_DEV_URL.to_string()
}

pub fn is_authorized_origin(target_url: &str, authorized_dev_origin: &str) -> bool {
    if target_url == "about:blank" {
        return true;
    }

    let target = match Url::parse(target_url) {
        Ok(u) => u,
        Err(_) => return false,
    };

    if target.scheme() == "tauri" || target.scheme() == "asset" {
        return true;
    }

    #[cfg(not(debug_assertions))]
    {
        let _ = authorized_dev_origin;
        target.host_str() == Some("localhost") || target.host_str() == Some("tauri.localhost")
    }

    #[cfg(debug_assertions)]
    {
        if target.host_str() == Some("localhost") || target.host_str() == Some("tauri.localhost") {
            return true;
        }

        let expected = match Url::parse(authorized_dev_origin) {
            Ok(u) => u,
            Err(_) => return false,
        };

        target.scheme() == expected.scheme()
            && target.host_str() == expected.host_str()
            && target.port() == expected.port()
    }
}

pub fn validate_or_fallback_url<'a>(target_url: &'a str, fallback_origin: &'a str) -> &'a str {
    if is_authorized_origin(target_url, fallback_origin) {
        target_url
    } else {
        fallback_origin
    }
}
