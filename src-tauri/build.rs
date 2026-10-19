fn main() {
    println!("cargo:rerun-if-changed=../dist");
    println!("cargo:rerun-if-changed=../dev.config.json");
    tauri_build::build()
}
