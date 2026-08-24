use oxy_flow::types::{
    AlwaysOnTopConfig, FrontendEvent, LayoutVariant, TextAndIconSize, WindowDimensions,
};

#[test]
fn test_layout_variant_from_str_opt() {
    assert_eq!(
        LayoutVariant::from_str_opt("compact"),
        Some(LayoutVariant::Compact)
    );
    assert_eq!(
        LayoutVariant::from_str_opt("MEDIUM"),
        Some(LayoutVariant::Medium)
    );
    assert_eq!(
        LayoutVariant::from_str_opt("Full"),
        Some(LayoutVariant::Full)
    );
    assert_eq!(LayoutVariant::from_str_opt("unknown"), None);
    assert_eq!(LayoutVariant::from_str_opt(""), None);
}

#[test]
fn test_layout_variant_default() {
    assert_eq!(LayoutVariant::default(), LayoutVariant::Full);
}

#[test]
fn test_layout_variant_get_dimensions() {
    let (dims, resizable) = LayoutVariant::Compact.get_dimensions(TextAndIconSize::Small);
    assert_eq!(dims.width, 360.0);
    assert_eq!(dims.height, 480.0);
    assert!(!resizable);

    let (dims_med_s, res_med_s) = LayoutVariant::Medium.get_dimensions(TextAndIconSize::Small);
    assert_eq!(dims_med_s.width, 480.0);
    assert_eq!(dims_med_s.height, 720.0);
    assert!(res_med_s);

    let (dims_med_m, res_med_m) = LayoutVariant::Medium.get_dimensions(TextAndIconSize::Medium);
    assert_eq!(dims_med_m.width, 720.0);
    assert_eq!(dims_med_m.height, 1080.0);
    assert!(res_med_m);

    let (dims_med_l, res_med_l) = LayoutVariant::Medium.get_dimensions(TextAndIconSize::Large);
    assert_eq!(dims_med_l.width, 960.0);
    assert_eq!(dims_med_l.height, 1440.0);
    assert!(res_med_l);

    let (dims_full_s, res_full_s) = LayoutVariant::Full.get_dimensions(TextAndIconSize::Small);
    assert_eq!(dims_full_s.width, 960.0);
    assert_eq!(dims_full_s.height, 960.0);
    assert!(res_full_s);

    let (dims_full_m, res_full_m) = LayoutVariant::Full.get_dimensions(TextAndIconSize::Medium);
    assert_eq!(dims_full_m.width, 1440.0);
    assert_eq!(dims_full_m.height, 1440.0);
    assert!(res_full_m);

    let (dims_full_l, res_full_l) = LayoutVariant::Full.get_dimensions(TextAndIconSize::Large);
    assert_eq!(dims_full_l.width, 1920.0);
    assert_eq!(dims_full_l.height, 1920.0);
    assert!(res_full_l);
}

#[test]
fn test_frontend_events_as_str() {
    assert_eq!(
        FrontendEvent::TraySetGuiVariant.as_str(),
        "tray-set-gui-variant"
    );
    assert_eq!(
        FrontendEvent::TrayToggleOnTop.as_str(),
        "tray-toggle-on-top"
    );
    assert_eq!(
        FrontendEvent::TrayStopAllTimers.as_str(),
        "tray-stop-all-timers"
    );
    assert_eq!(
        FrontendEvent::NativeCloseRequested.as_str(),
        "native-close-requested"
    );
    assert_eq!(
        FrontendEvent::NativeWindowMaximized.as_str(),
        "native-window-maximized"
    );
    assert_eq!(
        FrontendEvent::NativeWindowRestored.as_str(),
        "native-window-restored"
    );
    assert_eq!(
        FrontendEvent::NativeWindowMinimized.as_str(),
        "native-window-minimized"
    );
    assert_eq!(
        FrontendEvent::NativeWindowResized.as_str(),
        "native-window-resized"
    );
}

#[test]
fn test_always_on_top_and_dimensions_types() {
    let config = AlwaysOnTopConfig {
        small: true,
        main: false,
    };
    assert!(config.small);
    assert!(!config.main);

    let dims = WindowDimensions {
        width: 100.0,
        height: 200.0,
    };
    assert_eq!(dims.width, 100.0);
    assert_eq!(dims.height, 200.0);
}
