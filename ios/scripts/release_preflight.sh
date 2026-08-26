#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$IOS_DIR/.." && pwd)"
XCODE_APP="${FORJA_XCODE_APP:-/Applications/Xcode-26.3.0.app}"
XCODE_DEVELOPER="$XCODE_APP/Contents/Developer"
PROJECT_FILE="$IOS_DIR/ForjaIOS.xcodeproj"
ICON_FILE="$IOS_DIR/ForjaApp/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
PRIVACY_FILE="$IOS_DIR/ForjaApp/PrivacyInfo.xcprivacy"
DERIVED_DIR="$(mktemp -d -t forja-release-preflight.XXXXXX)"

trap 'rm -rf "$DERIVED_DIR"' EXIT

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1" >&2; exit 1; }

[[ -d "$XCODE_DEVELOPER" ]] || fail "No se encuentra Xcode en $XCODE_APP"

XCODE_VERSION_OUTPUT="$(DEVELOPER_DIR="$XCODE_DEVELOPER" xcodebuild -version)"
XCODE_VERSION="${XCODE_VERSION_OUTPUT%%$'\n'*}"
[[ "$XCODE_VERSION" == Xcode\ 26* ]] || fail "Se requiere Xcode 26 o posterior; encontrado: $XCODE_VERSION"
pass "$XCODE_VERSION"

if ! DEVELOPER_DIR="$XCODE_DEVELOPER" xcodebuild -license check >/dev/null 2>&1; then
  fail "La licencia de Xcode debe revisarse y aceptarse personalmente antes de compilar"
fi
pass "Licencia de Xcode aceptada"

if ! DEVELOPER_DIR="$XCODE_DEVELOPER" xcodebuild -checkFirstLaunchStatus >/dev/null 2>&1; then
  fail "Xcode necesita completar su preparacion inicial con xcodebuild -runFirstLaunch"
fi
pass "Preparacion inicial de Xcode completada"

SDK_VERSION="$(DEVELOPER_DIR="$XCODE_DEVELOPER" xcrun --sdk iphoneos --show-sdk-version)"
SDK_MAJOR="${SDK_VERSION%%.*}"
(( SDK_MAJOR >= 26 )) || fail "Se requiere el SDK de iOS 26 o posterior; encontrado: $SDK_VERSION"
pass "SDK de iOS $SDK_VERSION"

[[ -z "$(git -C "$REPO_DIR" status --porcelain --untracked-files=all)" ]] || fail "El repositorio contiene cambios sin confirmar"
git -C "$REPO_DIR" diff --check
pass "Repositorio limpio y diff valido"

rg -q 'PRODUCT_BUNDLE_IDENTIFIER = dev\.ngavilan\.forja;' "$PROJECT_FILE/project.pbxproj" \
  || fail "Bundle ID inesperado"
rg -q 'MARKETING_VERSION = 1\.0;' "$PROJECT_FILE/project.pbxproj" \
  || fail "Version publica inesperada"
rg -q 'CURRENT_PROJECT_VERSION = 1;' "$PROJECT_FILE/project.pbxproj" \
  || fail "Numero de build inesperado"
rg -q 'INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO;' "$PROJECT_FILE/project.pbxproj" \
  || fail "Falta la declaracion de cifrado"
rg -q 'CODE_SIGN_STYLE = Automatic;' "$PROJECT_FILE/project.pbxproj" \
  || fail "La firma del target debe estar configurada como automatica"
if rg -q 'DEVELOPMENT_TEAM = [A-Z0-9]+;' "$PROJECT_FILE/project.pbxproj"; then
  fail "El Team ID personal no debe persistirse en el proyecto publico"
fi
rg -q 'TEAM_ID="\$\{FORJA_TEAM_ID:-\}"' "$SCRIPT_DIR/archive_release.sh" \
  || fail "El archivado debe recibir el Team ID mediante FORJA_TEAM_ID"
pass "Identidad, version y firma automatica preparadas sin publicar el Team ID"

[[ -f "$PRIVACY_FILE" ]] || fail "Falta PrivacyInfo.xcprivacy"
[[ "$(plutil -extract NSPrivacyTracking raw -o - "$PRIVACY_FILE")" == "false" ]] \
  || fail "La declaracion de tracking no coincide con la version 1.0"
plutil -extract NSPrivacyCollectedDataTypes xml1 -o - "$PRIVACY_FILE" | rg -q '<array/>' \
  || fail "La declaracion contiene tipos de datos recopilados"
pass "Manifest de privacidad sin tracking ni recopilacion"

[[ -f "$ICON_FILE" ]] || fail "Falta el icono 1024 x 1024"
ICON_WIDTH="$(sips -g pixelWidth "$ICON_FILE" | awk '/pixelWidth/ {print $2}')"
ICON_HEIGHT="$(sips -g pixelHeight "$ICON_FILE" | awk '/pixelHeight/ {print $2}')"
ICON_ALPHA="$(sips -g hasAlpha "$ICON_FILE" | awk '/hasAlpha/ {print $2}')"
[[ "$ICON_WIDTH" == "1024" && "$ICON_HEIGHT" == "1024" && "$ICON_ALPHA" == "no" ]] \
  || fail "El icono debe ser PNG opaco de 1024 x 1024"
pass "Icono App Store 1024 x 1024 y opaco"

for public_url in \
  'https://ngavilan.dev/forja/' \
  'https://ngavilan.dev/forja/privacy/' \
  'https://ngavilan.dev/forja/support/'; do
  [[ "$(curl -sS -o /dev/null -w '%{http_code}' "$public_url")" == "200" ]] \
    || fail "La URL publica no responde 200: $public_url"
done
pass "Marketing, privacidad y soporte publicados"

(
  cd "$IOS_DIR"
  DEVELOPER_DIR="$XCODE_DEVELOPER" xcrun swift test
)
pass "Pruebas del nucleo"

DEVELOPER_DIR="$XCODE_DEVELOPER" xcodebuild \
  -project "$PROJECT_FILE" \
  -scheme ForjaIOS \
  -configuration Release \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$DERIVED_DIR" \
  CODE_SIGNING_ALLOWED=NO \
  build

APP_BINARY="$DERIVED_DIR/Build/Products/Release-iphonesimulator/ForjaIOS.app/ForjaIOS"
[[ -x "$APP_BINARY" ]] || fail "No se encontro el binario Release"
if strings "$APP_BINARY" | rg -q 'forja-ui-demo|forja-onboarding-step|forja-tab|forja-workout-demo'; then
  fail "El binario Release contiene hooks exclusivos de QA"
fi
pass "Release de Simulator sin hooks de QA"

printf '\nFORJA ha superado el preflight de Release.\n'
