#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$IOS_DIR/.." && pwd)"
XCODE_APP="${FORJA_XCODE_APP:-/Applications/Xcode-26.3.0.app}"
XCODE_DEVELOPER="$XCODE_APP/Contents/Developer"
TEAM_ID="${FORJA_TEAM_ID:-}"
PROFILE_NAME="${FORJA_PROFILE_NAME:-FORJA App Store 1.0}"
SIGNING_KEYCHAIN="${FORJA_SIGNING_KEYCHAIN:-}"
ARCHIVE_DIR="${FORJA_ARCHIVE_DIR:-$IOS_DIR/build/archives}"
ARCHIVE_PATH="$ARCHIVE_DIR/FORJA-1.0-1.xcarchive"

[[ -n "$TEAM_ID" ]] || { echo "Define FORJA_TEAM_ID con el Team ID de Apple." >&2; exit 64; }
[[ -d "$XCODE_DEVELOPER" ]] || { echo "No se encuentra Xcode en $XCODE_APP" >&2; exit 69; }
[[ -z "$SIGNING_KEYCHAIN" || -f "$SIGNING_KEYCHAIN" ]] \
  || { echo "No se encuentra el llavero de firma en $SIGNING_KEYCHAIN" >&2; exit 66; }
[[ -z "$(git -C "$REPO_DIR" status --porcelain --untracked-files=all)" ]] \
  || { echo "El repositorio debe estar limpio antes de archivar." >&2; exit 65; }

mkdir -p "$ARCHIVE_DIR"

SIGNING_SETTINGS=(
  "DEVELOPMENT_TEAM=$TEAM_ID"
  "CODE_SIGN_STYLE=Manual"
  "CODE_SIGN_IDENTITY=Apple Distribution"
  "PROVISIONING_PROFILE_SPECIFIER=$PROFILE_NAME"
)

if [[ -n "$SIGNING_KEYCHAIN" ]]; then
  SIGNING_SETTINGS+=("OTHER_CODE_SIGN_FLAGS=--keychain $SIGNING_KEYCHAIN")
fi

DEVELOPER_DIR="$XCODE_DEVELOPER" xcodebuild \
  -project "$IOS_DIR/ForjaIOS.xcodeproj" \
  -scheme FORJA \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  "${SIGNING_SETTINGS[@]}" \
  archive

echo "Archivo firmado creado en: $ARCHIVE_PATH"
