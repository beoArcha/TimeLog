// Domain submodules (>= 2 test files)
pub mod cli;
pub mod commands;
pub mod common;
pub mod engine;
pub mod persistence;
pub mod repositories;
pub mod sinks;
pub mod tray;
pub mod workflow;

// Single-test domain modules retained at root (avoiding redundant 1-test folders)
pub mod app_state_test;
pub mod cli_shared_test;
pub mod locale_test;
pub mod override_state_test;
pub mod project_delete_tests;
