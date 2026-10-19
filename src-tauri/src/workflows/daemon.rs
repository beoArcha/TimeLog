use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{FrontendEvent, WorkflowCheckResult, WorkflowConfig, WorkflowStatus};
use crate::workflows::evaluator::evaluate_rules;
use chrono::{DateTime, Utc};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;

pub type WorkflowEventSink = Arc<dyn Fn(&str, &WorkflowCheckResult) + Send + Sync>;

pub struct WorkflowDaemon {
    is_running: Arc<AtomicBool>,
    status: Arc<Mutex<WorkflowStatus>>,
    event_sink: Option<WorkflowEventSink>,
    join_handle: Mutex<Option<JoinHandle<()>>>,
}

impl Default for WorkflowDaemon {
    fn default() -> Self {
        Self::new(None)
    }
}

impl WorkflowDaemon {
    pub fn new(event_sink: Option<WorkflowEventSink>) -> Self {
        Self {
            is_running: Arc::new(AtomicBool::new(false)),
            status: Arc::new(Mutex::new(WorkflowStatus::default())),
            event_sink,
            join_handle: Mutex::new(None),
        }
    }

    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }

    pub fn get_status(&self) -> WorkflowStatus {
        let mut st = self.status.lock().unwrap().clone();
        st.is_daemon_running = self.is_running();
        st
    }

    pub fn start(&self, persistence: Arc<Persistence>) {
        if self.is_running.swap(true, Ordering::SeqCst) {
            return;
        }

        if let Ok(mut st) = self.status.lock() {
            st.is_daemon_running = true;
        }

        let is_running_flag = Arc::clone(&self.is_running);
        let status_ref = Arc::clone(&self.status);
        let persistence_ref = Arc::clone(&persistence);
        let event_sink_opt = self.event_sink.clone();

        let handle = thread::spawn(move || {
            while is_running_flag.load(Ordering::Relaxed) {
                for _ in 0..10 {
                    if !is_running_flag.load(Ordering::Relaxed) {
                        return;
                    }
                    thread::sleep(Duration::from_millis(1000));
                }

                let now = Utc::now();
                let config = persistence_ref.workflow.get_config().unwrap_or_default();
                let active_logs: Vec<crate::types::TimeLog> = persistence_ref
                    .time_logs
                    .get_all()
                    .unwrap_or_default()
                    .into_iter()
                    .filter(|l| l.end_time.is_none())
                    .collect();

                if !active_logs.is_empty() {
                    let result = evaluate_rules(&config, &active_logs, now);

                    if result.stopped {
                        let engine = Engine::new(&persistence_ref);
                        let _ = engine.stop_timer(None);

                        if let Ok(mut st) = status_ref.lock() {
                            st.last_auto_stop_reason = result.reason.clone();
                            st.last_auto_stop_time_iso = Some(now.to_rfc3339());
                        }

                        if let Some(ref sink) = event_sink_opt {
                            sink(FrontendEvent::WorkflowAutoStopped.as_str(), &result);
                        }
                    } else if result.warning {
                        if let Some(ref sink) = event_sink_opt {
                            sink(FrontendEvent::WorkflowWarning.as_str(), &result);
                        }
                    }
                }

                if let Ok(mut st) = status_ref.lock() {
                    st.last_check_iso = Some(now.to_rfc3339());
                }
            }
        });

        if let Ok(mut lock) = self.join_handle.lock() {
            *lock = Some(handle);
        }
    }

    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
        if let Ok(mut st) = self.status.lock() {
            st.is_daemon_running = false;
        }
    }

    pub fn check_rules_now(
        &self,
        persistence: &Persistence,
        config: &WorkflowConfig,
        now: Option<DateTime<Utc>>,
    ) -> WorkflowCheckResult {
        let current_time = now.unwrap_or_else(Utc::now);
        let active_logs: Vec<crate::types::TimeLog> = persistence
            .time_logs
            .get_all()
            .unwrap_or_default()
            .into_iter()
            .filter(|l| l.end_time.is_none())
            .collect();

        let result = evaluate_rules(config, &active_logs, current_time);
        if result.stopped {
            let engine = Engine::new(persistence);
            let _ = engine.stop_timer(None);

            if let Ok(mut st) = self.status.lock() {
                st.last_auto_stop_reason = result.reason.clone();
                st.last_auto_stop_time_iso = Some(current_time.to_rfc3339());
            }
        }

        if let Ok(mut st) = self.status.lock() {
            st.last_check_iso = Some(current_time.to_rfc3339());
        }

        result
    }
}

impl Drop for WorkflowDaemon {
    fn drop(&mut self) {
        self.stop();
    }
}
