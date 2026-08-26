#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$IOS_DIR/.." && pwd)"
XCODE_APP="${FORJA_XCODE_APP:-/Applications/Xcode-26.3.0.app}"
XCODE_DEVELOPER="$XCODE_APP/Contents/Developer"
TEAM_ID="${FORJA_TEAM_ID:-}"
ARCHIVE_DIR="${FORJA_ARCHIVE_DIR:-$IOS_DIR/build/archives}"
ARCHIVE_PATH="$ARCHIVE_DIR/FORJA-1.0-1.xcarchive"

[[ -n "$TEAM_ID" ]] || { echo "Define FORJA_TEAM_ID con el Team ID de Apple." >&2; exit 64; }
[[ -d "$XCODE_DEVELOPER" ]] || { echo "No se encuentra Xcode en $XCODE_APP" >&2; exit 69; }
[[ -z "$(git -C "$REPO_DIR" status --porcelain --untracked-files=all)" ]] \
  || { echo "El repositorio debe estar limpio antes de archivar." >&2; exit 65; }

mkdir -p "$ARCHIVE_DIR"

DEVELOPER_DIR="$XCODE_DEVELOPER" xcodebuild \
  -project "$IOS_DIR/ForjaIOS.xcodeproj" \
  -scheme ForjaIOS \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  -allowProvisioningUpdates \
  archive

echo "Archivo firmado creado en: $ARCHIVE_PATH"
