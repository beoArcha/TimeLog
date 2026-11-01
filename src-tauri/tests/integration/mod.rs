// Domain submodules (>= 2 test files)
pub mod cli;
pub mod persistence;
pub mod timer;

// Single-test domain modules retained at root (avoiding redundant 1-test folders)
pub mod billing_parity_test;
pub mod commands_test;
pub mod workflow_integration_test;
