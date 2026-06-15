#!/bin/bash
mkdir -p src-tauri/src/engine

cat src/rust-mock/src_tauri_Cargo_toml.rs > src-tauri/Cargo.toml
cat src/rust-mock/src_tauri_build_rs.rs > src-tauri/build.rs
cat src/rust-mock/src_tauri_src_main_rs.rs > src-tauri/src/main.rs
cat src/rust-mock/src_tauri_src_cli_rs.rs > src-tauri/src/cli.rs
cat src/rust-mock/src_tauri_tauri_conf_json.rs > src-tauri/tauri.conf.json

# Create engine/mod.rs
echo "pub mod counting;" > src-tauri/src/engine/mod.rs
echo "pub mod db;" >> src-tauri/src/engine/mod.rs

# Copy engine submodules into the engine directory
cat src/rust-mock/src_tauri_src_engine_counting_rs.rs > src-tauri/src/engine/counting.rs
cat src/rust-mock/src_tauri_src_engine_db_rs.rs > src-tauri/src/engine/db.rs
cat src/rust-mock/src_tauri_src_engine_db_test_rs.rs >> src-tauri/src/engine/db.rs

echo "Rust project generated at src-tauri"
