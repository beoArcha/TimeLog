import src_tauri_Cargo_toml_content from '../rust-mock/src_tauri_Cargo_toml.rs?raw';
import src_tauri_src_cli_rs_content from '../rust-mock/src_tauri_src_cli_rs.rs?raw';
import src_tauri_src_engine_counting_rs_content from '../rust-mock/src_tauri_src_engine_counting_rs.rs?raw';
import src_tauri_src_engine_db_rs_content from '../rust-mock/src_tauri_src_engine_db_rs.rs?raw';
import src_tauri_src_engine_db_test_rs_content from '../rust-mock/src_tauri_src_engine_db_test_rs.rs?raw';
import src_tauri_src_main_rs_content from '../rust-mock/src_tauri_src_main_rs.rs?raw';
import src_tauri_tauri_conf_json_content from '../rust-mock/src_tauri_tauri_conf_json.rs?raw';

export interface RustFile { name: string; path: string; content: string; category: "engine" | "cli" | "gui" | "config"; }

export const rustCodebase: RustFile[] = [
  { name: "Cargo.toml", path: "src-tauri/Cargo.toml", category: "config", content: src_tauri_Cargo_toml_content },
  { name: "cli.rs", path: "src-tauri/src/cli.rs", category: "cli", content: src_tauri_src_cli_rs_content },
  { name: "counting.rs", path: "src-tauri/src/engine/counting.rs", category: "engine", content: src_tauri_src_engine_counting_rs_content },
  { name: "db.rs", path: "src-tauri/src/engine/db.rs", category: "engine", content: src_tauri_src_engine_db_rs_content },
  { name: "db_test.rs", path: "src-tauri/src/engine/db_test.rs", category: "engine", content: src_tauri_src_engine_db_test_rs_content },
  { name: "main.rs", path: "src-tauri/src/main.rs", category: "gui", content: src_tauri_src_main_rs_content },
  { name: "tauri.conf.json", path: "src-tauri/tauri.conf.json", category: "config", content: src_tauri_tauri_conf_json_content },
];
