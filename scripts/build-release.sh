#!/usr/bin/env bash
# ==============================================================================
# Builds release packages for oXyFlow TimeLog with automated pre-flight quality checks.
# POSIX-compliant, supports Linux and macOS developer environments.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

BUNDLE="auto"
SKIP_TESTS=false
CLEAN=false
DRY_RUN=false

print_usage() {
    cat <<EOF
Usage: ./scripts/build-release.sh [OPTIONS]

Options:
  --bundle <target>    Package target: auto, appimage, deb, rpm, dmg, nsis, all, none (default: auto)
  --skip-tests         Skip pre-flight code checks and automated tests
  --clean              Clean release directory prior to building
  --dry-run            Run pre-flight checks and toolchain verification without building
  -h, --help           Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --bundle)
            BUNDLE="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown argument: $1" >&2
            print_usage
            exit 1
            ;;
    esac
done

step() {
    echo ""
    echo "=== $1 ==="
}

success() {
    echo "[OK] $1"
}

failure() {
    echo "[ERROR] $1" >&2
}

assert_tool() {
    if ! command -v "$1" >/dev/null 2>&1; then
        failure "Required tool '$1' was not found in PATH."
        exit 1
    fi
    success "Found $1 at $(command -v "$1")"
}

step "Checking Environment & Toolchains"
assert_tool "bun"
assert_tool "cargo"

if [ "${CLEAN}" = true ]; then
    step "Cleaning Build Artifacts"
    RELEASE_DIR="${PROJECT_ROOT}/src-tauri/target/release"
    if [ -d "${RELEASE_DIR}" ]; then
        echo "Removing ${RELEASE_DIR}..."
        rm -rf "${RELEASE_DIR}"
        success "Release directory cleaned."
    fi
fi

if [ "${SKIP_TESTS}" = false ]; then
    step "Executing Pre-Flight Quality Checks"

    echo "Running typecheck, lint, clippy, and rustfmt checks..."
    bun run check
    success "Typecheck, lint, and formatting passed."

    echo "Running Vitest test suite..."
    bun run test
    success "Vitest tests passed."

    echo "Running Cargo tests..."
    cargo test --manifest-path src-tauri/Cargo.toml
    success "Cargo tests passed."
else
    echo "Skipping pre-flight tests (--skip-tests specified)."
fi

if [ "${DRY_RUN}" = true ]; then
    step "Dry-Run Complete"
    success "All pre-flight checks and toolchains verified successfully. Exiting without building."
    exit 0
fi

# Determine default bundle target if auto
if [ "${BUNDLE}" = "auto" ]; then
    OS="$(uname -s)"
    case "${OS}" in
        Darwin*)
            BUNDLE="dmg"
            ;;
        Linux*)
            BUNDLE="appimage"
            ;;
        *)
            BUNDLE="all"
            ;;
    esac
fi

step "Building Release Packages (Bundle: ${BUNDLE})"

if [ "${BUNDLE}" = "all" ]; then
    BUNDLE_DIR="${PROJECT_ROOT}/src-tauri/target/release/bundle"
    if [ -d "${BUNDLE_DIR}" ]; then
        echo "Cleaning previous bundle output in ${BUNDLE_DIR}..."
        rm -rf "${BUNDLE_DIR:?}"/*
    fi
elif [ -d "${PROJECT_ROOT}/src-tauri/target/release/bundle/${BUNDLE}" ]; then
    echo "Cleaning previous ${BUNDLE} bundle output in src-tauri/target/release/bundle/${BUNDLE}..."
    rm -rf "${PROJECT_ROOT}/src-tauri/target/release/bundle/${BUNDLE:?}"/*
fi

if [ "${BUNDLE}" = "none" ]; then
    echo "Building release binary without packaging bundle..."
    cargo build --release --manifest-path src-tauri/Cargo.toml
elif [ "${BUNDLE}" = "all" ]; then
    echo "Building all configured release packages via Tauri..."
    bun x tauri build
else
    echo "Building ${BUNDLE} release package via Tauri..."
    bun x tauri build --bundles "${BUNDLE}"
fi

step "Release Artifacts Normalization & Summary"
NORMALIZED_DIR="${PROJECT_ROOT}/artifacts-release"
if [ -d "${NORMALIZED_DIR}" ]; then
    echo "Cleaning previous release artifacts in ${NORMALIZED_DIR}..."
    rm -rf "${NORMALIZED_DIR:?}"/*
else
    mkdir -p "${NORMALIZED_DIR}"
fi

compute_hash() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    else
        echo "sha256-unavailable"
    fi
}

# Normalize known bundle formats
if [ "${BUNDLE}" = "appimage" ] || [ "${BUNDLE}" = "all" ]; then
    APPIMAGE_PATH=$(find src-tauri/target/release/bundle/appimage -type f -name "*.AppImage" 2>/dev/null | head -n 1 || true)
    if [ -n "${APPIMAGE_PATH}" ]; then
        cp "${APPIMAGE_PATH}" "${NORMALIZED_DIR}/oXyFlow_TimeLog-x86_64.AppImage"
    fi
fi

if [ "${BUNDLE}" = "deb" ] || [ "${BUNDLE}" = "all" ]; then
    DEB_PATH=$(find src-tauri/target/release/bundle/deb -type f -name "*.deb" 2>/dev/null | head -n 1 || true)
    if [ -n "${DEB_PATH}" ]; then
        cp "${DEB_PATH}" "${NORMALIZED_DIR}/timelog_amd64.deb"
    fi
fi

if [ "${BUNDLE}" = "rpm" ] || [ "${BUNDLE}" = "all" ]; then
    RPM_PATH=$(find src-tauri/target/release/bundle/rpm -type f -name "*.rpm" 2>/dev/null | head -n 1 || true)
    if [ -n "${RPM_PATH}" ]; then
        cp "${RPM_PATH}" "${NORMALIZED_DIR}/timelog.x86_64.rpm"
    fi
fi

if [ "${BUNDLE}" = "dmg" ] || [ "${BUNDLE}" = "all" ]; then
    DMG_PATH=$(find src-tauri/target/release/bundle/dmg -type f -name "*.dmg" 2>/dev/null | head -n 1 || true)
    if [ -n "${DMG_PATH}" ]; then
        cp "${DMG_PATH}" "${NORMALIZED_DIR}/oXyFlow_TimeLog-Universal.dmg"
    fi
fi

if [ "${BUNDLE}" = "nsis" ] || [ "${BUNDLE}" = "all" ]; then
    NSIS_PATH=$(find src-tauri/target/release/bundle/nsis -type f -name "*.exe" 2>/dev/null | head -n 1 || true)
    if [ -n "${NSIS_PATH}" ]; then
        cp "${NSIS_PATH}" "${NORMALIZED_DIR}/oXyFlow_TimeLog-Setup-x64.exe"
    fi
fi

if [ "${BUNDLE}" = "standalone" ] || [ "${BUNDLE}" = "all" ]; then
    EXE_PATH=$(find src-tauri/target/release -maxdepth 1 -type f \( -name "TimeLog.exe" -o -name "timelog.exe" -o -name "timelog" \) 2>/dev/null | head -n 1 || true)
    if [ -n "${EXE_PATH}" ] && [[ "${EXE_PATH}" == *.exe ]]; then
        cp "${EXE_PATH}" "${NORMALIZED_DIR}/oXyFlow_TimeLog-Standalone-x64.exe"
    fi
fi

FOUND=0
CHECKSUM_FILE="${NORMALIZED_DIR}/SHA256SUMS.txt"
rm -f "${CHECKSUM_FILE}"

for file in "${NORMALIZED_DIR}"/*; do
    if [ -f "${file}" ] && [ "$(basename "${file}")" != "SHA256SUMS.txt" ]; then
        BASENAME="$(basename "${file}")"
        HASH="$(compute_hash "${file}")"
        SIZE="$(ls -lh "${file}" | awk '{print $5}')"
        echo "Artifact: ${BASENAME}"
        echo "  Path:   ${file}"
        echo "  Size:   ${SIZE}"
        echo "  SHA256: ${HASH}"
        echo "${HASH}  ${BASENAME}" >> "${CHECKSUM_FILE}"
        FOUND=$((FOUND + 1))
    fi
done

# Verify release artifacts completeness
EXPECTED_ARTIFACTS=()
case "${BUNDLE}" in
    appimage)
        EXPECTED_ARTIFACTS+=("oXyFlow_TimeLog-x86_64.AppImage")
        ;;
    deb)
        EXPECTED_ARTIFACTS+=("timelog_amd64.deb")
        ;;
    rpm)
        EXPECTED_ARTIFACTS+=("timelog.x86_64.rpm")
        ;;
    dmg)
        EXPECTED_ARTIFACTS+=("oXyFlow_TimeLog-Universal.dmg")
        ;;
    nsis)
        EXPECTED_ARTIFACTS+=("oXyFlow_TimeLog-Setup-x64.exe")
        ;;
    all)
        OS="$(uname -s)"
        case "${OS}" in
            Darwin*)
                EXPECTED_ARTIFACTS+=("oXyFlow_TimeLog-Universal.dmg")
                ;;
            Linux*)
                EXPECTED_ARTIFACTS+=("oXyFlow_TimeLog-x86_64.AppImage" "timelog_amd64.deb" "timelog.x86_64.rpm")
                ;;
        esac
        ;;
esac

MISSING_EXPECTED=()
for expected in "${EXPECTED_ARTIFACTS[@]}"; do
    if [ ! -f "${NORMALIZED_DIR}/${expected}" ]; then
        MISSING_EXPECTED+=("${expected}")
    fi
done

if [ ${#MISSING_EXPECTED[@]} -gt 0 ]; then
    failure "Completeness check failed: missing expected release artifact(s): ${MISSING_EXPECTED[*]}"
    exit 1
fi

if [ "${FOUND}" -eq 0 ] && [ "${BUNDLE}" != "none" ]; then
    echo "Build completed, but no release packages were located in standard bundle paths."
else
    success "Release packaging completed successfully (${FOUND} normalized artifacts in ${NORMALIZED_DIR})."
fi
