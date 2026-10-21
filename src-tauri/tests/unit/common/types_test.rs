use oxy_flow::types::{
    AlwaysOnTopConfig, FrontendEvent, LayoutVariant, TextAndIconSize, WindowDimensions,
};

#[test]
fn test_layout_variant_from_str_opt() {
    // Arrange
    let inputs = [
        ("compact", Some(LayoutVariant::Compact)),
        ("MEDIUM", Some(LayoutVariant::Medium)),
        ("Full", Some(LayoutVariant::Full)),
        ("unknown", None),
        ("", None),
    ];

    for (raw_str, expected) in inputs {
        // Act
        let variant = LayoutVariant::from_str_opt(raw_str);

        // Assert
        assert_eq!(variant, expected);
    }
}

#[test]
fn test_layout_variant_default() {
    // Arrange & Act
    let default_variant = LayoutVariant::default();

    // Assert
    assert_eq!(default_variant, LayoutVariant::Full);
}

#[test]
fn test_layout_variant_get_dimensions() {
    // Arrange
    let compact = LayoutVariant::Compact;
    let medium = LayoutVariant::Medium;
    let full = LayoutVariant::Full;

    // Act
    let (dims_c, res_c) = compact.get_dimensions(TextAndIconSize::Small);
    let (dims_med_s, res_med_s) = medium.get_dimensions(TextAndIconSize::Small);
    let (dims_med_m, res_med_m) = medium.get_dimensions(TextAndIconSize::Medium);
    let (dims_med_l, res_med_l) = medium.get_dimensions(TextAndIconSize::Large);
    let (dims_full_s, res_full_s) = full.get_dimensions(TextAndIconSize::Small);
    let (dims_full_m, res_full_m) = full.get_dimensions(TextAndIconSize::Medium);
    let (dims_full_l, res_full_l) = full.get_dimensions(TextAndIconSize::Large);

    // Assert
    assert_eq!(dims_c.width, 360.0);
    assert_eq!(dims_c.height, 480.0);
    assert!(!res_c);

    assert_eq!(dims_med_s.width, 480.0);
    assert_eq!(dims_med_s.height, 720.0);
    assert!(res_med_s);

    assert_eq!(dims_med_m.width, 720.0);
    assert_eq!(dims_med_m.height, 1080.0);
    assert!(res_med_m);

    assert_eq!(dims_med_l.width, 960.0);
    assert_eq!(dims_med_l.height, 1440.0);
    assert!(res_med_l);

    assert_eq!(dims_full_s.width, 960.0);
    assert_eq!(dims_full_s.height, 960.0);
    assert!(res_full_s);

    assert_eq!(dims_full_m.width, 1440.0);
    assert_eq!(dims_full_m.height, 1440.0);
    assert!(res_full_m);

    assert_eq!(dims_full_l.width, 1920.0);
    assert_eq!(dims_full_l.height, 1920.0);
    assert!(res_full_l);
}

#[test]
fn test_frontend_events_as_str() {
    // Arrange
    let events = [
        (FrontendEvent::TraySetGuiVariant, "tray-set-gui-variant"),
        (FrontendEvent::TrayToggleOnTop, "tray-toggle-on-top"),
        (
            FrontendEvent::TrayToggleMinimizeToTray,
            "tray-toggle-minimize-to-tray",
        ),
        (FrontendEvent::TrayStopAllTimers, "tray-stop-all-timers"),
        (
            FrontendEvent::NativeCloseRequested,
            "native-close-requested",
        ),
        (
            FrontendEvent::NativeWindowMaximized,
            "native-window-maximized",
        ),
        (
            FrontendEvent::NativeWindowRestored,
            "native-window-restored",
        ),
        (
            FrontendEvent::NativeWindowMinimized,
            "native-window-minimized",
        ),
        (FrontendEvent::NativeWindowResized, "native-window-resized"),
        (FrontendEvent::WorkflowAutoStopped, "workflow-auto-stopped"),
        (FrontendEvent::WorkflowWarning, "workflow-warning"),
    ];

    for (event, expected_str) in events {
        // Act
        let actual_str = event.as_str();

        // Assert
        assert_eq!(actual_str, expected_str);
    }
}

#[test]
fn test_always_on_top_and_dimensions_types() {
    // Arrange
    let config = AlwaysOnTopConfig {
        small: true,
        main: false,
    };
    let dims = WindowDimensions {
        width: 100.0,
        height: 200.0,
    };

    // Act & Assert
    assert!(config.small);
    assert!(!config.main);
    assert_eq!(dims.width, 100.0);
    assert_eq!(dims.height, 200.0);
}
