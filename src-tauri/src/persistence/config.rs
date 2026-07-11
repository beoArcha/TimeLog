use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct PersistenceConfig {
    pub db_path: PathBuf,
    pub csv_directory: PathBuf,
}
