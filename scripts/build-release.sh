#!/usr/bin/env bash
# ==============================================================================
# Builds release packages for OxyFlow with automated pre-flight quality checks.
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

step "Release Artifacts Summary"
ARTIFACTS_DIR="${PROJECT_ROOT}/src-tauri/target/release/bundle"

compute_hash() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    else
        echo "sha256-unavailable"
    fi
}

FOUND=0
if [ -d "${ARTIFACTS_DIR}" ]; then
    while IFS= read -r file; do
        if [ -f "${file}" ]; then
            HASH="$(compute_hash "${file}")"
            SIZE="$(ls -lh "${file}" | awk '{print $5}')"
            echo "Artifact: $(basename "${file}")"
            echo "  Path:   ${file}"
            echo "  Size:   ${SIZE}"
            echo "  SHA256: ${HASH}"
            FOUND=$((FOUND + 1))
        fi
    done < <(find "${ARTIFACTS_DIR}" -type f \( -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" -o -name "*.dmg" -o -name "*.exe" \))
fi

if [ "${FOUND}" -eq 0 ]; then
    echo "Build completed, but no release packages were located in standard bundle paths."
else
    success "Release packaging completed successfully (${FOUND} artifacts generated)."
fi
