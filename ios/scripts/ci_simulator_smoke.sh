#!/usr/bin/env bash

set -euo pipefail

DERIVED_DATA_PATH="${1:?Derived data path is required}"
OUTPUT_DIR="${2:?Screenshot output directory is required}"
APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/FORJA.app"
BUNDLE_ID="dev.ngavilan.forja"

test -d "$APP_PATH"
mkdir -p "$OUTPUT_DIR"

RUNTIME_ID="$(
  xcrun simctl list runtimes -j |
    jq -r '.runtimes
      | map(select(.isAvailable == true and (.identifier | startswith("com.apple.CoreSimulator.SimRuntime.iOS"))))
      | sort_by(.version)
      | last
      | .identifier // empty'
)"

if [[ -z "$RUNTIME_ID" ]]; then
  echo "No available iOS Simulator runtime was found."
  exit 1
fi

SIMULATOR_UDID=""

cleanup() {
  if [[ -n "$SIMULATOR_UDID" ]]; then
    xcrun simctl shutdown "$SIMULATOR_UDID" >/dev/null 2>&1 || true
    xcrun simctl delete "$SIMULATOR_UDID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

capture_device() {
  local device_name="$1"
  local output_name="$2"
  local device_type_id

  device_type_id="$(
    xcrun simctl list devicetypes -j |
      jq -r --arg name "$device_name" '.devicetypes
        | map(select(.name == $name))
        | first
        | .identifier // empty'
  )"

  if [[ -z "$device_type_id" ]]; then
    echo "Skipping unavailable simulator device: $device_name"
    return
  fi

  SIMULATOR_UDID="$(xcrun simctl create "FORJA CI $device_name" "$device_type_id" "$RUNTIME_ID")"
  xcrun simctl boot "$SIMULATOR_UDID"
  xcrun simctl bootstatus "$SIMULATOR_UDID" -b
  xcrun simctl ui "$SIMULATOR_UDID" appearance light
  xcrun simctl install "$SIMULATOR_UDID" "$APP_PATH"

  if [[ "$device_name" == "iPhone 16 Pro" ]]; then
    for step in 0 1 2 3 4 5; do
      xcrun simctl launch "$SIMULATOR_UDID" "$BUNDLE_ID" -forja-onboarding-step "$step"
      sleep 2
      xcrun simctl io "$SIMULATOR_UDID" screenshot --type=png "$OUTPUT_DIR/$output_name-step-$step-light.png"
      xcrun simctl terminate "$SIMULATOR_UDID" "$BUNDLE_ID"
    done

    xcrun simctl ui "$SIMULATOR_UDID" appearance dark
    xcrun simctl launch "$SIMULATOR_UDID" "$BUNDLE_ID"
    sleep 2
    xcrun simctl io "$SIMULATOR_UDID" screenshot --type=png "$OUTPUT_DIR/$output_name-step-0-dark.png"
    xcrun simctl terminate "$SIMULATOR_UDID" "$BUNDLE_ID"
  else
    xcrun simctl launch "$SIMULATOR_UDID" "$BUNDLE_ID"
    sleep 4
    xcrun simctl io "$SIMULATOR_UDID" screenshot --type=png "$OUTPUT_DIR/$output_name-step-0-light.png"
    xcrun simctl terminate "$SIMULATOR_UDID" "$BUNDLE_ID"
  fi

  if [[ "$device_name" == "iPhone 16 Pro" || "$device_name" == "iPhone 16 Pro Max" ]]; then
    xcrun simctl ui "$SIMULATOR_UDID" appearance light
    for tab in today campaign progress codex profile; do
      xcrun simctl launch "$SIMULATOR_UDID" "$BUNDLE_ID" -forja-ui-demo -forja-tab "$tab"
      if [[ "$tab" == "today" ]]; then
        sleep 6
      else
        sleep 3
      fi
      xcrun simctl io "$SIMULATOR_UDID" screenshot --type=png "$OUTPUT_DIR/$output_name-$tab-light.png"
      xcrun simctl terminate "$SIMULATOR_UDID" "$BUNDLE_ID"
    done

    xcrun simctl launch "$SIMULATOR_UDID" "$BUNDLE_ID" -forja-ui-demo -forja-workout-demo
    sleep 6
    xcrun simctl io "$SIMULATOR_UDID" screenshot --type=png "$OUTPUT_DIR/$output_name-workout-light.png"
    xcrun simctl terminate "$SIMULATOR_UDID" "$BUNDLE_ID"
  fi

  xcrun simctl shutdown "$SIMULATOR_UDID"
  xcrun simctl delete "$SIMULATOR_UDID"
  SIMULATOR_UDID=""
}

capture_device "iPhone SE (3rd generation)" "iphone-se-3"
capture_device "iPhone 16 Pro" "iphone-16-pro"
capture_device "iPhone 16 Pro Max" "iphone-16-pro-max"

test -n "$(find "$OUTPUT_DIR" -name '*.png' -print -quit)"

APP_STORE_DIR="$OUTPUT_DIR/app-store-6.9"
mkdir -p "$APP_STORE_DIR"
for screenshot in "$OUTPUT_DIR"/iphone-16-pro-max-*.png; do
  output_file="$APP_STORE_DIR/$(basename "${screenshot%.png}").jpg"
  sips -s format jpeg -s formatOptions best "$screenshot" --out "$output_file" >/dev/null
done

test -n "$(find "$APP_STORE_DIR" -name '*.jpg' -print -quit)"
