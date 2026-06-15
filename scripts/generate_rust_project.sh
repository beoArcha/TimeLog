#!/bin/bash
mkdir -p src-tauri/src

cat src/rust-mock/src_tauri_Cargo_toml.rs > src-tauri/Cargo.toml
cat src/rust-mock/src_tauri_src_main_rs.rs > src-tauri/src/main.rs
cat src/rust-mock/src_tauri_src_cli_rs.rs > src-tauri/src/cli.rs
cat src/rust-mock/src_tauri_src_engine_counting_rs.rs > src-tauri/src/engine_counting.rs
cat src/rust-mock/src_tauri_src_engine_db_rs.rs > src-tauri/src/engine_db.rs
cat src/rust-mock/src_tauri_src_engine_db_test_rs.rs >> src-tauri/src/engine_db.rs

echo "Rust project generated at src-tauri"
