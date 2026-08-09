// Controles de registro: grandes, de una mano, con teclado numérico móvil.
// El campo numérico admite estado vacío (null): una primera sesión no debe
// fingir que "0 kg" es una carga elegida.

import { useId } from "react";

export function NumberField({
  label,
  hint,
  error,
  placeholder,
  value,
  step,
  min = 0,
  max = 999,
  decimals = false,
  onChange
}: {
  label: string;
  hint?: string;
  /** Mensaje de validación inline; también marca el campo como inválido. */
  error?: string | null;
  /** Texto tenue cuando el campo está vacío, p. ej. "kg". */
  placeholder?: string;
  value: number | null;
  step: number;
  min?: number;
  max?: number;
  decimals?: boolean;
  onChange: (v: number | null) => void;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const round = (v: number) => (decimals ? Math.round(v * 100) / 100 : Math.round(v));
  const display = value === null ? "" : decimals ? String(value) : String(Math.round(value));
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        <span>{label}</span>
        {hint && <span className="field-label__hint">{hint}</span>}
      </label>
      <div className="numctl">
        <button
          type="button"
          className="numctl__btn"
          aria-label={`Restar ${step} a ${label}`}
          onClick={() => onChange(clamp(round((value ?? 0) - step)))}
        >
          −
        </button>
        <input
          id={id}
          className="numctl__value"
          type="text"
          inputMode={decimals ? "decimal" : "numeric"}
          value={display}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            const raw = e.target.value.replace(",", ".").trim();
            if (raw === "" || raw === "." || raw === "-") {
              onChange(null);
              return;
            }
            const v = Number(raw);
            if (!Number.isNaN(v)) onChange(clamp(v));
          }}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className="numctl__btn"
          aria-label={`Sumar ${step} a ${label}`}
          onClick={() => onChange(clamp(round((value ?? 0) + step)))}
        >
          +
        </button>
      </div>
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function RirSelector({
  value,
  targetMin,
  targetMax,
  onChange
}: {
  value: number;
  targetMin: number;
  targetMax: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="field-label">
        <span>RIR — repeticiones en reserva</span>
        <span className="field-label__hint">
          objetivo {targetMin === targetMax ? targetMin : `${targetMin}–${targetMax}`}
        </span>
      </div>
      <div className="rirsel" role="radiogroup" aria-label="RIR de la serie">
        {[0, 1, 2, 3, 4].map((n) => {
          const inTarget = n >= targetMin && n <= targetMax;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              className={`rirsel__opt${value === n ? " rirsel__opt--sel" : ""}${
                inTarget && value !== n ? " rirsel__opt--target" : ""
              }`}
              onClick={() => onChange(n)}
            >
              {n === 4 ? "4+" : n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
