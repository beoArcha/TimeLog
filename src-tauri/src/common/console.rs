#[cfg(target_os = "windows")]
pub fn attach_parent_console() -> bool {
    // When OxyFlow is built with the windows subsystem in release mode,
    // stdout/stderr are detached from the caller's console. Attach to the
    // parent process console so terminal executions can print output.
    unsafe {
        extern "system" {
            fn AttachConsole(dw_process_id: u32) -> i32;
        }
        const ATTACH_PARENT_PROCESS: u32 = 0xFFFFFFFF;
        AttachConsole(ATTACH_PARENT_PROCESS) != 0
    }
}

#[cfg(not(target_os = "windows"))]
pub fn attach_parent_console() -> bool {
    true
}
