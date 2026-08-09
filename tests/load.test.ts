// Tipo de carga y validación de peso: 0 kg jamás pasa en carga externa,
// pero es la carga real en ejercicios de peso corporal.

import { describe, expect, it } from "vitest";
import { loadTypeOf, midReps, weightValid } from "../src/data/load";

describe("loadTypeOf", () => {
  it("los ejercicios de máquina/polea/barra son carga externa", () => {
    expect(loadTypeOf("press-inclinado-maquina")).toBe("externa");
    expect(loadTypeOf("crunch-polea")).toBe("externa");
    expect(loadTypeOf("rumano-smith")).toBe("externa");
  });

  it("la elevación de rodillas colgado es peso corporal", () => {
    expect(loadTypeOf("elevacion-rodillas-colgado")).toBe("corporal");
  });
});

describe("weightValid", () => {
  it("rechaza vacío y 0 kg en carga externa", () => {
    expect(weightValid("press-inclinado-maquina", null)).toBe(false);
    expect(weightValid("press-inclinado-maquina", 0)).toBe(false);
    expect(weightValid("press-inclinado-maquina", -5)).toBe(false);
  });

  it("acepta cargas reales en carga externa", () => {
    expect(weightValid("press-inclinado-maquina", 42.5)).toBe(true);
  });

  it("acepta 0 (y lastre) en peso corporal", () => {
    expect(weightValid("elevacion-rodillas-colgado", 0)).toBe(true);
    expect(weightValid("elevacion-rodillas-colgado", 5)).toBe(true);
    expect(weightValid("elevacion-rodillas-colgado", null)).toBe(false);
  });
});

describe("midReps", () => {
  it("apunta al punto medio del rango prescrito", () => {
    expect(midReps(6, 10)).toBe(8);
    expect(midReps(8, 12)).toBe(10);
    expect(midReps(12, 20)).toBe(16);
    expect(midReps(10, 15)).toBe(13);
  });
});
