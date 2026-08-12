import { describe, expect, it } from "vitest";
import { suggest } from "../src/logic/progression";
import { DAYS } from "../src/data/routine";
import type { SetLog } from "../src/db/types";

const press = DAYS[0].entries[0]; // press inclinado: 4 × 6–10, RIR 2,2,1,1

const makeSet = (over: Partial<SetLog>): SetLog => ({
  id: Math.random().toString(36),
  createdAt: 1,
  updatedAt: 1,
  localVersion: 1,
  syncStatus: "local",
  profileId: "p",
  sessionId: "s",
  exerciseId: press.exerciseId,
  dayId: "torso-a",
  setNumber: 1,
  weightKg: 60,
  reps: 10,
  rir: 2,
  source: "normal",
  ...over
});

describe("motor de progresión (doble progresión conservadora)", () => {
  it("sin datos previos: no sugiere carga concreta", () => {
    const s = suggest({
      prescription: press,
      lastSets: [],
      incrementKg: 2.5
    });
    expect(s.kind).toBe("sin-datos");
    expect(s.weightKg).toBeUndefined();
  });

  it("todas las series al tope del rango con RIR objetivo: sugiere subir el incremento", () => {
    const sets = [2, 2, 1, 1].map((rir, i) =>
      makeSet({ setNumber: i + 1, reps: 10, rir, weightKg: 60 })
    );
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incrementKg: 2.5
    });
    expect(s.kind).toBe("subir");
    expect(s.weightKg).toBe(62.5);
  });

  it("dentro del rango: mantener la carga", () => {
    const sets = [10, 8, 8, 7].map((reps, i) =>
      makeSet({ setNumber: i + 1, reps, rir: 2 })
    );
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incrementKg: 2.5
    });
    expect(s.kind).toBe("mantener");
    expect(s.weightKg).toBe(60);
  });

  it("por debajo del mínimo: mantener o reducir un 5 %", () => {
    const sets = [8, 6, 5, 5].map((reps, i) =>
      makeSet({ setNumber: i + 1, reps, rir: 1 })
    );
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incrementKg: 2.5
    });
    expect(s.kind).toBe("bajar");
    expect(s.weightKg).toBe(57);
  });

  it("no sube si el RIR quedó por debajo del previsto aunque las reps lleguen al tope", () => {
    const sets = [0, 0, 0, 0].map((rir, i) =>
      makeSet({ setNumber: i + 1, reps: 10, rir })
    );
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incrementKg: 2.5
    });
    expect(s.kind).not.toBe("subir");
  });

  it("no sube con series prescritas incompletas", () => {
    const sets = [10, 10].map((reps, i) => makeSet({ setNumber: i + 1, reps, rir: 2 }));
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incrementKg: 2.5
    });
    expect(s.kind).not.toBe("subir");
  });

  it("incidencia ACTIVA: desactiva la sugerencia de subida y lo explica", () => {
    const sets = [2, 2, 1, 1].map((rir, i) =>
      makeSet({ setNumber: i + 1, reps: 10, rir })
    );
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incidentStatus: "activa",
      incrementKg: 2.5
    });
    expect(s.kind).toBe("molestia");
    expect(s.weightKg).toBeUndefined();
    expect(s.motivo.length).toBeGreaterThan(10);
  });

  it("incidencia EN SEGUIMIENTO: mantiene la carga aunque los números pidan subir", () => {
    const sets = [2, 2, 1, 1].map((rir, i) =>
      makeSet({ setNumber: i + 1, reps: 10, rir, weightKg: 60 })
    );
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incidentStatus: "seguimiento",
      incrementKg: 2.5
    });
    expect(s.kind).toBe("seguimiento");
    expect(s.weightKg).toBe(60);
  });

  it("incidencia RESUELTA: las sugerencias vuelven con normalidad", () => {
    const sets = [2, 2, 1, 1].map((rir, i) =>
      makeSet({ setNumber: i + 1, reps: 10, rir, weightKg: 60 })
    );
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incidentStatus: "resuelta",
      incrementKg: 2.5
    });
    expect(s.kind).toBe("subir");
    expect(s.weightKg).toBe(62.5);
  });

  it("las series omitidas no cuentan como evidencia", () => {
    const sets = [
      makeSet({ setNumber: 1, skipped: true, reps: 0 }),
      makeSet({ setNumber: 2, skipped: true, reps: 0 })
    ];
    const s = suggest({
      prescription: press,
      lastSets: sets,
      incrementKg: 2.5
    });
    expect(s.kind).toBe("sin-datos");
  });
});
