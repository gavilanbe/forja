// Genera los iconos PNG de la PWA a partir del arte pixel del yunque.
// Sin dependencias: codifica PNG a mano usando zlib de Node.
// Uso: npm run icons  →  escribe public/icons/*.png

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const PALETTE = {
  k: "#05070d",
  K: "#232c40",
  s: "#3b4963",
  S: "#9aa7bd",
  w: "#f4e7c5",
  e: "#ff873d",
  E: "#c2532a",
  y: "#ffd166",
  ".": null
};

// Yunque con brasa, centrado en 16×16, con marco de acero.
const ICON = [
  "kkkkkkkkkkkkkkkk",
  "k......e.......k",
  "k.....eee......k",
  "k.....eye......k",
  "k....eyye......k",
  "k.SSSSSSSSSSSS.k",
  "k.ssssssssssss.k",
  "k...ssssssss...k",
  "k.....ssss.....k",
  "k.....Ksss.....k",
  "k....ssssss....k",
  "k...ssssssss...k",
  "k..KssssssssK..k",
  "k.KKKKKKKKKKKK.k",
  "k.KKKKKKKKKKKK.k",
  "kkkkkkkkkkkkkkkk"
];

const BG = [11, 15, 26]; // #0B0F1A

const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16)
];

// ── Codificador PNG mínimo ──────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const encodePng = (pixels, w, h) => {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filtro none
    pixels.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
};

// ── Composición ─────────────────────────────────────────────────────────────

const render = (size, artScale, drawFrame) => {
  const px = Buffer.alloc(size * size * 4);
  const put = (x, y, [r, g, b]) => {
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) put(x, y, BG);

  const art = ICON.map((row) => (drawFrame ? row : row.replaceAll("k", ".")));
  const artPx = 16 * artScale;
  const off = Math.round((size - artPx) / 2);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = art[y][x];
      const hex = PALETTE[ch];
      if (!hex) continue;
      const rgb = hexToRgb(hex);
      for (let dy = 0; dy < artScale; dy++)
        for (let dx = 0; dx < artScale; dx++)
          put(off + x * artScale + dx, off + y * artScale + dy, rgb);
    }
  }
  return encodePng(px, size, size);
};

const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "icon-192.png"), render(192, 12, true));
writeFileSync(join(outDir, "icon-512.png"), render(512, 32, true));
// Maskable: arte al 75 % para respetar la zona segura del recorte.
writeFileSync(join(outDir, "icon-maskable-512.png"), render(512, 24, false));
console.log("Iconos generados en public/icons/");
