// Exportación CSV del historial de series, para análisis fuera de FORJA.
// Se genera por rangos con cursores indexados: nunca carga años de historial
// de golpe en memoria.

import { db } from "../db/db";
import { codexById } from "../data/codex";
import { variantById } from "../data/variants";
import { dayById } from "../data/routine";

const CSV_HEADER = [
  "fecha",
  "campana",
  "dia",
  "ejercicio",
  "variante",
  "serie",
  "peso_kg",
  "repeticiones",
  "rir",
  "omitida",
  "motivo_omision",
  "estado_sesion"
].join(";");

const esc = (v: string | number | undefined | null): string => {
  const s = String(v ?? "");
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export interface CsvOptions {
  fromKey?: string;
  toKey?: string;
}

export const exportSetsCsv = async (
  profileId: string,
  opts: CsvOptions = {}
): Promise<string> => {
  const campaigns = await db.campaigns.where("profileId").equals(profileId).toArray();
  const campaignName = new Map(
    campaigns.map((c, i) => [c.id, `Campaña ${i + 1} (${c.startKey})`])
  );

  const sessions = await db.sessions
    .where("profileId")
    .equals(profileId)
    .and(
      (s) =>
        (!opts.fromKey || s.dateKey >= opts.fromKey) &&
        (!opts.toKey || s.dateKey <= opts.toKey)
    )
    .toArray();
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const lines: string[] = [CSV_HEADER];
  // Recorrido por sesión: cada consulta usa el índice sessionId.
  for (const session of sessions.sort((a, b) => a.dateKey.localeCompare(b.dateKey))) {
    const sets = await db.setLogs
      .where("sessionId")
      .equals(session.id)
      .sortBy("createdAt");
    for (const s of sets) {
      const sess = sessionById.get(s.sessionId);
      lines.push(
        [
          esc(sess?.dateKey),
          esc(s.campaignId ? campaignName.get(s.campaignId) : ""),
          esc(dayById(s.dayId)?.name ?? s.dayId),
          esc(codexById(s.exerciseId)?.nombre ?? s.exerciseId),
          esc(variantById(s.variantId)?.nombre ?? ""),
          esc(s.setNumber),
          esc(s.skipped ? "" : s.weightKg),
          esc(s.skipped ? "" : s.reps),
          esc(s.skipped ? "" : s.rir),
          esc(s.skipped ? "sí" : "no"),
          esc(s.skipReason),
          esc(sess?.status)
        ].join(";")
      );
    }
  }
  return lines.join("\n");
};

export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
