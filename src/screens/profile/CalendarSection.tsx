// Calendario semanal: mover una misión dentro de la semana, registrar
// ausencias (viaje/enfermedad), marcar una semana de descarga, posponerla o
// volver al calendario original. Nada de esto genera XP ni duplica misiones.

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Profile } from "../../db/types";
import { dayById } from "../../data/routine";
import { PixelButton, PixelFrame, StatusChip } from "../../ui/Pixel";
import { WEEKDAY_LONG } from "../../logic/dates";
import { dateKeyOf, mondayOf } from "../../logic/dates";
import {
  addOverride,
  effectiveWeekFor,
  overridesForWeek,
  resetWeek,
  setDeloadWeek
} from "../../logic/calendar";
import { forjaNow } from "../../logic/clock";

export function CalendarSection({ profile }: { profile: Profile }) {
  const today = forjaNow();
  const weekStartKey = dateKeyOf(mondayOf(today));
  const [moveFrom, setMoveFrom] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const effWeek = useLiveQuery(
    async () => await effectiveWeekFor(profile, today),
    [profile.id, weekStartKey]
  );
  const overrides = useLiveQuery(
    async () => await overridesForWeek(profile.id, weekStartKey),
    [profile.id, weekStartKey]
  );

  if (!effWeek || !overrides) return null;

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 3000);
  };

  const move = async (to: number) => {
    if (moveFrom === null) return;
    await addOverride(profile, weekStartKey, "mover", {
      fromWeekday: moveFrom,
      toWeekday: to,
      dayId: effWeek.days[moveFrom].dayId ?? undefined
    });
    setMoveFrom(null);
    flash("Misión movida. No cambia la XP ni duplica nada: solo el día.");
  };

  const markAbsence = async (weekday: number, reason: string) => {
    await addOverride(profile, weekStartKey, "ausencia", {
      weekdays: [weekday],
      reason
    });
    flash("Ausencia registrada: ese día no cuenta para el objetivo ni rompe la Llama.");
  };

  return (
    <PixelFrame as="section">
      <div className="field-label">
        <span>Calendario de esta semana</span>
        <span className="field-label__hint">
          objetivo efectivo {effWeek.effectiveTarget}
        </span>
      </div>

      {effWeek.deload && (
        <StatusChip tone="warn" dot>
          Semana de descarga · volumen al {Math.round(effWeek.deloadFactor * 100)} %
        </StatusChip>
      )}
      {effWeek.postponed && (
        <StatusChip tone="default" dot>
          Semana pospuesta: sin objetivo esta semana
        </StatusChip>
      )}

      <div className="stack stack--tight" style={{ marginTop: 8 }}>
        {effWeek.days.map((d, i) => (
          <div key={i} className="cal-row">
            <span className="cal-row__day">{WEEKDAY_LONG[i]}</span>
            <span className="grow small">
              {d.absent
                ? `Ausencia${d.absenceReason ? ` (${d.absenceReason})` : ""}`
                : d.dayId
                  ? `${dayById(d.dayId)?.name}${d.movedFrom !== undefined ? ` (movida del ${WEEKDAY_LONG[d.movedFrom]})` : ""}`
                  : "Campamento"}
            </span>
            {moveFrom === null ? (
              d.dayId && !d.absent ? (
                <button
                  type="button"
                  className="mini-btn"
                  aria-label={`Mover ${dayById(d.dayId)?.name} a otro día`}
                  onClick={() => setMoveFrom(i)}
                >
                  mover
                </button>
              ) : null
            ) : moveFrom === i ? (
              <button type="button" className="mini-btn" onClick={() => setMoveFrom(null)}>
                cancelar
              </button>
            ) : !d.dayId && !d.absent ? (
              <button
                type="button"
                className="mini-btn"
                aria-label={`Mover aquí (${WEEKDAY_LONG[i]})`}
                onClick={() => void move(i)}
              >
                aquí
              </button>
            ) : null}
            {moveFrom === null && !d.absent && (
              <button
                type="button"
                className="mini-btn"
                aria-label={`Registrar ausencia el ${WEEKDAY_LONG[i]}`}
                onClick={() => void markAbsence(i, "Viaje o ausencia")}
              >
                ausente
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="stack stack--tight" style={{ marginTop: 12 }}>
        {!effWeek.deload && (
          <PixelButton
            tone="ghost"
            block
            onClick={async () => {
              await setDeloadWeek(profile, weekStartKey, 0.5);
              flash(
                "Descarga marcada: el plan real de la semana es el reducido, sin fingir la prescripción completa."
              );
            }}
          >
            Marcar semana de descarga (50 % del volumen)
          </PixelButton>
        )}
        {!effWeek.postponed && (
          <PixelButton
            tone="ghost"
            block
            onClick={async () => {
              await addOverride(profile, weekStartKey, "posponer", {
                reason: "Semana pospuesta"
              });
              flash("Semana pospuesta: sin objetivo exigible; la Llama no se rompe.");
            }}
          >
            Posponer esta semana
          </PixelButton>
        )}
        {overrides.length > 0 && (
          <PixelButton
            tone="ghost"
            sans
            block
            onClick={async () => {
              await resetWeek(profile.id, weekStartKey);
              flash("Calendario original restaurado para esta semana.");
            }}
          >
            Volver al calendario original
          </PixelButton>
        )}
      </div>

      {note && (
        <p className="small" style={{ color: "var(--done)", marginTop: 8 }} role="status">
          {note}
        </p>
      )}
      <p className="small dim" style={{ marginTop: 8 }}>
        Reprogramar nunca genera XP extra. Los entrenamientos fuera de plan no
        cuentan para la Llama y los campamentos jamás la rompen.
      </p>
    </PixelFrame>
  );
}
