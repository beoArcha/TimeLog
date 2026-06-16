import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDir = path.join(__dirname, 'src', 'rust-mock');
const tauriDir = path.join(__dirname, 'src-tauri');
const tauriSrcDir = path.join(tauriDir, 'src');
const tauriEngineDir = path.join(tauriSrcDir, 'engine');

if (!fs.existsSync(tauriEngineDir)) {
  fs.mkdirSync(tauriEngineDir, { recursive: true });
}

fs.copyFileSync(
  path.join(mockDir, 'src_tauri_Cargo_toml.rs'),
  path.join(tauriDir, 'Cargo.toml')
);
fs.copyFileSync(
  path.join(mockDir, 'src_tauri_build_rs.rs'),
  path.join(tauriDir, 'build.rs')
);
fs.copyFileSync(
  path.join(mockDir, 'src_tauri_src_main_rs.rs'),
  path.join(tauriSrcDir, 'main.rs')
);
fs.copyFileSync(
  path.join(mockDir, 'src_tauri_src_cli_rs.rs'),
  path.join(tauriSrcDir, 'cli.rs')
);
fs.copyFileSync(
  path.join(mockDir, 'src_tauri_tauri_conf_json.rs'),
  path.join(tauriDir, 'tauri.conf.json')
);

fs.writeFileSync(path.join(tauriEngineDir, 'mod.rs'), `pub mod counting;\npub mod db;\n`);

fs.copyFileSync(
  path.join(mockDir, 'src_tauri_src_engine_counting_rs.rs'),
  path.join(tauriEngineDir, 'counting.rs')
);

const dbCode = fs.readFileSync(path.join(mockDir, 'src_tauri_src_engine_db_rs.rs'), 'utf8');
const dbTestCode = fs.readFileSync(path.join(mockDir, 'src_tauri_src_engine_db_test_rs.rs'), 'utf8');

fs.writeFileSync(path.join(tauriEngineDir, 'db.rs'), dbCode + '\n' + dbTestCode);

console.log("Deployed Rust code to src-tauri/");
