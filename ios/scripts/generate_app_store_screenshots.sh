#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 <directorio-capturas-6.9> <directorio-salida>" >&2
  exit 64
fi

SOURCE_DIR="$1"
OUTPUT_DIR="$2"
MAGICK_BIN="${MAGICK_BIN:-$(command -v magick || true)}"

if [[ -z "$MAGICK_BIN" ]]; then
  echo "ImageMagick no esta disponible (se esperaba el comando magick)." >&2
  exit 69
fi

mkdir -p "$OUTPUT_DIR"
WORK_DIR="$(mktemp -d -t forja-app-store.XXXXXX)"
trap 'rm -rf "$WORK_DIR"' EXIT

WIDTH=1320
HEIGHT=2868
SHOT_WIDTH=1000
SHOT_HEIGHT=2173
SHOT_X=160
SHOT_Y=595

make_screenshot() {
  local source_name="$1"
  local output_name="$2"
  local eyebrow="$3"
  local title="$4"
  local subtitle="$5"
  local accent="$6"
  local source_path="$SOURCE_DIR/$source_name"
  local output_path="$OUTPUT_DIR/$output_name"
  local title_text="${title//|/$'\n'}"

  if [[ ! -f "$source_path" ]]; then
    echo "Falta la captura fuente: $source_path" >&2
    exit 66
  fi

  "$MAGICK_BIN" -size "${WIDTH}x${HEIGHT}" \
    gradient:'#17130F-#261812' \
    "$WORK_DIR/background.png"

  "$MAGICK_BIN" -size 1160x960 xc:none \
    -fill "$accent" -draw 'ellipse 580,180 1120,700 0,360' \
    -blur 0x170 "$WORK_DIR/glow.png"

  "$MAGICK_BIN" "$source_path" \
    -auto-orient -resize "${SHOT_WIDTH}x${SHOT_HEIGHT}!" \
    -colorspace sRGB "$WORK_DIR/screen-flat.png"

  "$MAGICK_BIN" -size "${SHOT_WIDTH}x${SHOT_HEIGHT}" xc:black \
    -fill white -draw "roundrectangle 0,0,$((SHOT_WIDTH - 1)),$((SHOT_HEIGHT - 1)),54,54" \
    "$WORK_DIR/screen-mask.png"

  "$MAGICK_BIN" "$WORK_DIR/screen-flat.png" \
    "$WORK_DIR/screen-mask.png" -alpha off \
    -compose CopyOpacity -composite \
    "$WORK_DIR/screen.png"

  "$MAGICK_BIN" -size "${SHOT_WIDTH}x${SHOT_HEIGHT}" xc:none \
    -fill '#00000099' -draw "roundrectangle 0,0,$((SHOT_WIDTH - 1)),$((SHOT_HEIGHT - 1)),54,54" \
    -blur 0x36 "$WORK_DIR/shadow.png"

  "$MAGICK_BIN" -size 1080x52 xc:none \
    -font Avenir-Next-Demi-Bold -pointsize 28 -kerning 7 \
    -fill "$accent" -gravity northwest \
    -annotate +0+0 "FORJA  ·  $eyebrow" \
    "$WORK_DIR/eyebrow.png"

  "$MAGICK_BIN" -background none -fill '#FFF4E4' \
    -font Avenir-Next-Bold -pointsize 88 -interline-spacing -5 \
    -gravity northwest -size 1080x225 \
    "caption:$title_text" "$WORK_DIR/title.png"

  "$MAGICK_BIN" -background none -fill '#CBBDAE' \
    -font Avenir-Next-Medium -pointsize 38 -interline-spacing 3 \
    -gravity northwest -size 1080x115 \
    "caption:$subtitle" "$WORK_DIR/subtitle.png"

  "$MAGICK_BIN" "$WORK_DIR/background.png" \
    "$WORK_DIR/glow.png" -geometry +150-260 -compose over -composite \
    -fill "$accent" -draw 'roundrectangle 80,90 98,254 9,9' \
    -fill '#FFF4E426' -draw 'roundrectangle 110,90 1240,92 1,1' \
    "$WORK_DIR/eyebrow.png" -geometry +120+118 -compose over -composite \
    "$WORK_DIR/title.png" -geometry +120+184 -compose over -composite \
    "$WORK_DIR/subtitle.png" -geometry +120+420 -compose over -composite \
    "$WORK_DIR/shadow.png" -geometry +${SHOT_X}+$((SHOT_Y + 24)) -compose over -composite \
    "$WORK_DIR/screen.png" -geometry +${SHOT_X}+${SHOT_Y} -compose over -composite \
    -fill none -stroke '#FFF4E42E' -strokewidth 2 \
    -draw "roundrectangle ${SHOT_X},${SHOT_Y},$((SHOT_X + SHOT_WIDTH - 1)),$((SHOT_Y + SHOT_HEIGHT - 1)),54,54" \
    -strip -interlace Plane -sampling-factor 4:4:4 -quality 92 \
    "$output_path"

  local dimensions opaque
  dimensions="$($MAGICK_BIN identify -format '%wx%h' "$output_path")"
  opaque="$($MAGICK_BIN identify -format '%[opaque]' "$output_path")"
  if [[ "$dimensions" != "${WIDTH}x${HEIGHT}" || "$opaque" != "True" ]]; then
    echo "Salida no valida (${dimensions}, opaque=${opaque}): $output_path" >&2
    exit 65
  fi
  echo "Generada: $output_path"
}

make_screenshot \
  'iphone-16-pro-max-today-light.jpg' \
  '01-hoy.jpg' \
  'TU MISIÓN DE HOY' \
  'Entrena con una|misión clara' \
  'Tu sesión, tu ritmo y cero ruido.' \
  '#F2B84B'

make_screenshot \
  'iphone-16-pro-max-workout-light.jpg' \
  '02-entrenamiento.jpg' \
  'REGISTRO RAPIDO' \
  'Cada serie, en|segundos' \
  'Peso, repeticiones y RIR sin salir del flujo.' \
  '#F06D2F'

make_screenshot \
  'iphone-16-pro-max-campaign-light.jpg' \
  '03-campana.jpg' \
  'SEIS SEMANAS' \
  'Una rutina convertida|en campaña' \
  'La constancia se ve, capítulo a capítulo.' \
  '#E86D32'

make_screenshot \
  'iphone-16-pro-max-progress-light.jpg' \
  '04-progreso.jpg' \
  'EVIDENCIA, NO PRESIÓN' \
  'Progreso real,|sin atajos' \
  'Historial y tendencias que nunca cambian cargas por ti.' \
  '#61A9D6'

make_screenshot \
  'iphone-16-pro-max-profile-light.jpg' \
  '05-perfil.jpg' \
  'TU FORJADOR' \
  'Tu perfil.|Tus reglas.' \
  'Avatar por capas y datos bajo tu control.' \
  '#E8B84A'
