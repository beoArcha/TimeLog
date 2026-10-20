use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=../dist");
    println!("cargo:rerun-if-changed=../dev.config.json");

    let profile = std::env::var("PROFILE").unwrap_or_default();
    let dist_index = Path::new("../dist/index.html");

    // Cargo ignores beforeBuildCommand defined in tauri.conf.json.
    // Ensure production bundle exists in release mode before embedding assets.
    if profile == "release" && !dist_index.exists() {
        println!("cargo:warning=dist/index.html not found. Building frontend bundle via bun run build...");

        let status = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(["/C", "bun run build"])
                .current_dir("..")
                .status()
        } else {
            Command::new("bun")
                .args(["run", "build"])
                .current_dir("..")
                .status()
        };

        match status {
            Ok(s) if s.success() && dist_index.exists() => {
                println!("cargo:warning=Frontend assets compiled successfully.");
            }
            _ => {
                panic!(
                    "Missing '../dist/index.html' required for release build.\n\
                    Automated 'bun run build' failed. Compile frontend assets before running 'cargo build --release'."
                );
            }
        }
    }

    tauri_build::build();
}
