#!/usr/bin/env node

// Convierte los datos TypeScript de la PWA en recursos JSON consumibles por
// Swift. No interpreta JSX ni ejecuta la aplicación original.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = process.argv[2] ?? "/Users/nahuelgavilan/forja";
const outputRoot = path.join(here, "..", "ForjaApp", "Resources");

const read = (relative) => fs.readFileSync(path.join(sourceRoot, relative), "utf8");
const write = (name, value) => {
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
};

const routineSource = read("src/data/routine.ts")
  .replace(/^import type .*$/gm, "")
  .replace(/export const/g, "const")
  .replace(/\(min:\s*number,\s*max\s*=\s*min\)/, "(min, max = min)")
  .replace(/const DAYS:\s*WorkoutDay\[\]/, "const DAYS")
  .replace(/const SCHEDULES:\s*Schedule\[\]/, "const SCHEDULES")
  .replace(/const dayById[\s\S]*?;\n\n/, "")
  .replace(/const scheduleById[\s\S]*?;\n\n/, "");

const routine = vm.runInNewContext(
  `${routineSource}\n({version: ROUTINE_VERSION, days: DAYS, schedules: SCHEDULES, campaignWeeks: CAMPAIGN_WEEKS, chapters: CHAPTERS})`,
  Object.create(null),
  { timeout: 2_000 }
);

const codexSource = read("src/data/codex.ts")
  .replace(/^import type .*$/gm, "")
  .replace(/export const CODEX:\s*CodexEntry\[\]/, "const CODEX")
  .replace(/export const codexById[\s\S]*$/, "");

const codex = vm.runInNewContext(
  `${codexSource}\nCODEX`,
  Object.create(null),
  { timeout: 2_000 }
);

write("routine.json", routine);
write("codex.json", codex);

console.log(`Imported ${routine.days.length} workout days and ${codex.length} codex entries.`);
