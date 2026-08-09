// Primitivas visuales de FORJA. Todo el lenguaje de la interfaz nace aquí:
// marcos con esquinas recortadas, botones con pulsación física, chips de
// estado, barra de XP y modal. Sin librerías visuales externas.

import { useEffect, useId, useRef, type ReactNode } from "react";
import { PxSprite, type Frame } from "./px";
import { PAL_C } from "./arcade/palette";
import { FLAME_OFF_C, FLAME_ON_C, FORJATRON_C } from "./arcade/props";
import {
  FLAME_EMBER_C,
  FLAME_ON2_C,
  FLAME_RED1_C,
  FLAME_RED2_C
} from "./arcade/extra";
import type { FlameState } from "../logic/campaign";

// ── PixelFrame ──────────────────────────────────────────────────────────────

type FrameTone = "default" | "raised" | "ember" | "gold" | "danger";

export function PixelFrame({
  children,
  tone = "default",
  tight,
  flat,
  className,
  as: Tag = "div"
}: {
  children: ReactNode;
  tone?: FrameTone;
  tight?: boolean;
  flat?: boolean;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  const cls = [
    "pxframe",
    tone !== "default" && `pxframe--${tone === "raised" ? "raised" : tone}`,
    tone === "ember" && "pxframe--raised",
    tight && "pxframe--tight",
    flat && "pxframe--flat",
    className
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls}>
      <div className="pxframe__edge">
        <div className="pxframe__body">{children}</div>
      </div>
    </Tag>
  );
}

// ── PixelButton ─────────────────────────────────────────────────────────────

type ButtonTone = "default" | "primary" | "gold" | "done" | "danger" | "ghost";

export function PixelButton({
  children,
  tone = "default",
  big,
  sans,
  block,
  className,
  ...rest
}: {
  children: ReactNode;
  tone?: ButtonTone;
  big?: boolean;
  sans?: boolean;
  block?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = [
    "pxbtn",
    tone !== "default" && `pxbtn--${tone}`,
    big && "pxbtn--big",
    sans && "pxbtn--sans",
    className
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={`pxbtn-wrap${block ? " pxbtn-wrap--block" : ""}`}>
      <button type="button" className={cls} {...rest}>
        <span>{children}</span>
      </button>
    </span>
  );
}

// ── StatusChip ──────────────────────────────────────────────────────────────

type ChipTone = "default" | "done" | "gold" | "ember" | "blue" | "warn" | "danger";

export function StatusChip({
  children,
  tone = "default",
  dot,
  className,
  role,
  ariaLive
}: {
  children: ReactNode;
  tone?: ChipTone;
  dot?: boolean;
  className?: string;
  role?: string;
  ariaLive?: "polite" | "off";
}) {
  const cls = ["chip", tone !== "default" && `chip--${tone}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} role={role} aria-live={ariaLive}>
      {dot && <span className="chip__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

// ── XPBar ───────────────────────────────────────────────────────────────────

export function XPBar({
  value,
  max,
  tone = "gold",
  label
}: {
  value: number;
  max: number;
  tone?: "gold" | "ember";
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={`xpbar${tone === "ember" ? " xpbar--ember" : ""}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className="xpbar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── PixelModal ──────────────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PixelModal({
  open,
  title,
  onClose,
  children,
  center,
  tone = "raised"
}: {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
  center?: boolean;
  tone?: FrameTone;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Foco: al abrir, guardar el disparador, entrar al panel y atrapar Tab;
  // al cerrar, devolver el foco a quien abrió el modal.
  useEffect(() => {
    if (!open) return;
    const opener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    panel?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        );
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panel)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);

    // Bloqueo del scroll de fondo sin perder la posición.
    const scrollY = window.scrollY;
    const { position, top, width, overflowY } = document.body.style;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflowY = "scroll";

    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      document.body.style.overflowY = overflowY;
      window.scrollTo(0, scrollY);
      opener?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className={`pxmodal-overlay${center ? " pxmodal-overlay--center" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className="pxmodal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <PixelFrame tone={tone} flat>
          <div className="pxmodal__head">
            <div className="pxmodal__title" id={titleId}>
              {title}
            </div>
            {onClose && (
              <button
                type="button"
                className="pxmodal__close"
                aria-label="Cerrar"
                onClick={onClose}
              >
                <span className="px-x" aria-hidden="true" />
              </button>
            )}
          </div>
          {children}
        </PixelFrame>
      </div>
    </div>
  );
}

// ── Llama animada ───────────────────────────────────────────────────────────

const FLAME_FRAMES: Record<FlameState, Frame[]> = {
  apagada: [FLAME_OFF_C],
  rescoldo: [FLAME_EMBER_C],
  encendida: [FLAME_ON_C, FLAME_ON2_C],
  roja: [FLAME_RED1_C, FLAME_RED2_C]
};

export function FlameSprite({
  state = "encendida",
  scale = 2,
  label
}: {
  state?: FlameState;
  scale?: number;
  label?: string;
}) {
  return (
    <PxSprite
      frames={FLAME_FRAMES[state]}
      palette={PAL_C}
      scale={scale}
      fps={2.4}
      holdFirst
      label={label}
    />
  );
}

// ── Telón de fondo del entorno ──────────────────────────────────────────────
// Arcade: siluetas atenuadas de cabinas FORJA-TRON al pie de la pantalla.

const CABINET_DIM: Record<string, string> = Object.fromEntries(
  Object.keys(PAL_C).map((ch) => [ch, ch === "k" ? "#0d0f18" : "#1c2233"])
);

export function ForgeBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <PxSprite frames={[FORJATRON_C]} palette={CABINET_DIM} scale={4} />
      <PxSprite frames={[FORJATRON_C]} palette={CABINET_DIM} scale={3} />
      <PxSprite frames={[FORJATRON_C]} palette={CABINET_DIM} scale={4} />
    </div>
  );
}

// ── Separador ───────────────────────────────────────────────────────────────

export function RivetRule({ children }: { children?: ReactNode }) {
  return (
    <div className="rivet-rule" aria-hidden="true">
      {children && <span className="px-label">{children}</span>}
    </div>
  );
}
