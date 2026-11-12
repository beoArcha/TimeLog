use std::path::PathBuf;
use std::process::{Command, Output, Stdio};
use std::time::{Duration, Instant};

pub struct TempEnvDir {
    pub path: PathBuf,
}

impl TempEnvDir {
    pub fn new(prefix: &str) -> Self {
        let path = std::env::temp_dir().join(format!("{}_{}", prefix, uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&path).expect("failed to create temp directory");
        Self { path }
    }

    pub fn db_path(&self) -> PathBuf {
        self.path.join("test.db")
    }

    pub fn existing_db_path(&self) -> PathBuf {
        let p = self.db_path();
        if !p.exists() {
            std::fs::File::create(&p).expect("failed to create test db");
        }
        p
    }
}

impl Drop for TempEnvDir {
    fn drop(&mut self) {
        if self.path.exists() {
            let _ = std::fs::remove_dir_all(&self.path);
        }
    }
}

pub fn execute_oxy_with_timeout(env_dir: &TempEnvDir, args: &[&str], timeout: Duration) -> Output {
    let bin_path = env!("CARGO_BIN_EXE_oxy");
    let mut cmd = Command::new(bin_path);
    cmd.env("APPDATA", &env_dir.path)
        .env("HOME", &env_dir.path)
        .env("USERPROFILE", &env_dir.path)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd.spawn().expect("failed to spawn oxy CLI binary");
    let start = Instant::now();

    loop {
        match child.try_wait().expect("failed to check child status") {
            Some(_status) => {
                return child
                    .wait_with_output()
                    .expect("failed to read child output");
            }
            None => {
                if start.elapsed() > timeout {
                    let _ = child.kill();
                    panic!("oxy process timed out after {:?}", timeout);
                }
                std::thread::sleep(Duration::from_millis(10));
            }
        }
    }
}
