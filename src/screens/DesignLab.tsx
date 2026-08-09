// Vista interna del sistema visual de PRODUCCIÓN (dirección Acero Arcade).
// SOLO desarrollo: la ruta /dev/diseno se registra únicamente en DEV y no
// aparece en la navegación. Para las tres direcciones exploratorias,
// ver /dev/art-directions.

import { useState } from "react";
import {
  FlameSprite,
  PixelButton,
  PixelFrame,
  PixelModal,
  StatusChip,
  XPBar
} from "../ui/Pixel";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { buildChar, type CharId, type StateId } from "../ui/arcade/chars";
import {
  ANVIL_C,
  BELL_C,
  BELL_RING_C,
  BONFIRE_C,
  CHAPTER_NODES_C,
  COIN_C,
  DISC_BIG_C,
  FORJATRON_C,
  HAMMER_C,
  SEAL_ADAPT_C,
  SEAL_DONE_C,
  SPARKSTAR_C,
  STARBURST_C
} from "../ui/arcade/props";
import {
  G_ADAPT,
  G_CAMP,
  G_CHECK,
  G_CROSS,
  G_HAMMER,
  G_LOCK,
  G_STAR,
  NAV_CAMPANA,
  NAV_CODICE,
  NAV_HOY,
  NAV_PERFIL,
  NAV_PROGRESO
} from "../ui/arcade/icons";
import { discTower, heatMeter, rackBar } from "../ui/arcade/dataviz";
import { NumberField, RirSelector } from "../ui/controls";
import type { FlameState } from "../logic/campaign";

const STATES: StateId[] = [
  "neutral",
  "preparado",
  "golpeando",
  "descansando",
  "celebrando",
  "record",
  "adaptacion"
];
const FLAMES: FlameState[] = ["apagada", "rescoldo", "encendida", "roja"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="lab-section">
      <h2 className="px-label px-label--gold">{title}</h2>
      <div className="lab-section__body">{children}</div>
    </section>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="lab-cell">
      <div className="lab-cell__art">{children}</div>
      <span className="lab-cell__label">{label}</span>
    </div>
  );
}

function CharCell({ who, state }: { who: CharId; state: StateId }) {
  const { frames, fps } = buildChar(who, state);
  return (
    <Cell label={`${who} ${state}`}>
      <PxSprite frames={frames} palette={PAL_C} fps={fps} scale={2} />
    </Cell>
  );
}

export function DesignLab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [num, setNum] = useState<number | null>(null);
  const [rir, setRir] = useState(2);

  return (
    <main className="screen">
      <h1 className="screen-title">Sistema visual · Acero Arcade</h1>
      <p className="small dim" style={{ marginBottom: 16 }}>
        Solo desarrollo. Los assets de producción, en un sitio.
      </p>

      <Section title="Paleta">
        <div className="lab-grid">
          {Object.entries(PAL_C)
            .filter(([ch]) => ch !== "x")
            .map(([ch, hex]) => (
              <Cell key={ch} label={`${ch} ${hex}`}>
                <span className="lab-swatch" style={{ background: hex }} />
              </Cell>
            ))}
        </div>
      </Section>

      <Section title="Tipografía">
        <p className="px-title">Marcador pixel 13px</p>
        <p className="px-label">Etiqueta pixel 8px — solo decorativa</p>
        <p style={{ fontSize: "var(--fs-body-lg)" }}>Sans 17 — datos importantes</p>
        <p>Sans 15 — texto normal con acentos: fragua, corazón, ¡España!</p>
        <p className="small dim">Sans 13 tenue — mínimo para info real</p>
      </Section>

      <Section title="Avatares 32×32 × 7 estados">
        <div className="lab-grid">
          {(["nahuel", "carlos"] as const).flatMap((who) =>
            STATES.map((st) => <CharCell key={`${who}-${st}`} who={who} state={st} />)
          )}
        </div>
      </Section>

      <Section title="Llama × estado">
        <div className="lab-grid">
          {FLAMES.map((f) => (
            <Cell key={f} label={f}>
              <FlameSprite state={f} scale={3} />
            </Cell>
          ))}
        </div>
      </Section>

      <Section title="Atrezzo">
        <div className="lab-grid">
          <Cell label="martillo"><PxSprite frames={[HAMMER_C]} palette={PAL_C} scale={3} /></Cell>
          <Cell label="yunque"><PxSprite frames={[ANVIL_C]} palette={PAL_C} scale={3} /></Cell>
          <Cell label="chispa"><PxSprite frames={SPARKSTAR_C} palette={PAL_C} fps={12} scale={3} /></Cell>
          <Cell label="starburst"><PxSprite frames={STARBURST_C} palette={PAL_C} fps={10} scale={3} /></Cell>
          <Cell label="hoguera"><PxSprite frames={BONFIRE_C} palette={PAL_C} fps={8} scale={3} /></Cell>
          <Cell label="FORJA-TRON"><PxSprite frames={[FORJATRON_C]} palette={PAL_C} scale={3} /></Cell>
          <Cell label="campana"><PxSprite frames={[BELL_C, BELL_C, BELL_RING_C]} palette={PAL_C} fps={6} scale={3} /></Cell>
          <Cell label="moneda"><PxSprite frames={[COIN_C]} palette={PAL_C} scale={3} /></Cell>
          <Cell label="disco"><PxSprite frames={[DISC_BIG_C]} palette={PAL_C} scale={3} /></Cell>
          <Cell label="sello completada"><PxSprite frames={[SEAL_DONE_C]} palette={PAL_C} scale={3} /></Cell>
          <Cell label="sello adaptada"><PxSprite frames={[SEAL_ADAPT_C]} palette={PAL_C} scale={3} /></Cell>
        </div>
      </Section>

      <Section title="Nodos de campaña (1–6)">
        <div className="lab-grid">
          {CHAPTER_NODES_C.map((m, i) => (
            <Cell key={i} label={`cap. ${i + 1}`}>
              <PxSprite frames={[m]} palette={PAL_C} scale={3} />
            </Cell>
          ))}
        </div>
      </Section>

      <Section title="Glifos e iconos de navegación">
        <div className="lab-grid">
          {(
            [
              ["check", G_CHECK],
              ["adapt", G_ADAPT],
              ["cross", G_CROSS],
              ["star", G_STAR],
              ["lock", G_LOCK],
              ["hammer", G_HAMMER],
              ["camp", G_CAMP],
              ["hoy", NAV_HOY],
              ["campaña", NAV_CAMPANA],
              ["progreso", NAV_PROGRESO],
              ["códice", NAV_CODICE],
              ["perfil", NAV_PERFIL]
            ] as const
          ).map(([label, map]) => (
            <Cell key={label} label={label}>
              <PxSprite frames={[map]} palette={PAL_C} scale={3} />
            </Cell>
          ))}
        </div>
      </Section>

      <Section title="Data-viz arcade">
        <div className="lab-grid">
          <Cell label="rack 47,5 kg">
            <PxSprite frames={[rackBar(47.5)]} palette={PAL_C} scale={2} />
          </Cell>
          <Cell label="calor RIR 2">
            <PxSprite frames={[heatMeter(2)]} palette={PAL_C} scale={2} />
          </Cell>
          <Cell label="torre 96 series">
            <PxSprite frames={[discTower(96)]} palette={PAL_C} scale={2} />
          </Cell>
        </div>
      </Section>

      <Section title="Botones">
        <div className="stack stack--tight">
          <PixelButton tone="primary" big block>Empezar misión</PixelButton>
          <PixelButton tone="gold" block>Acción dorada</PixelButton>
          <PixelButton tone="done" block>Confirmación</PixelButton>
          <PixelButton tone="danger" block>Peligro</PixelButton>
          <PixelButton tone="ghost" sans block>Secundaria en sans</PixelButton>
        </div>
      </Section>

      <Section title="Marcos, paneles y chips">
        <div className="stack">
          <PixelFrame tone="ember"><p>Marco héroe (marquesina brasa).</p></PixelFrame>
          <PixelFrame tone="gold"><p>Marco héroe dorado.</p></PixelFrame>
          <div className="panel"><p>Panel informativo ligero.</p></div>
          <div className="row row--wrap">
            <StatusChip tone="done" dot>Guardado aquí</StatusChip>
            <StatusChip tone="warn" dot>2 pendientes</StatusChip>
            <StatusChip tone="danger" dot>Reintento</StatusChip>
            <StatusChip>Sin conexión</StatusChip>
          </div>
          <XPBar value={40} max={120} label="XP" />
          <XPBar tone="ember" value={2} max={5} label="Semana" />
        </div>
      </Section>

      <Section title="Controles de registro">
        <div className="stack">
          <NumberField
            label="Peso"
            hint="kg · pasos de 2.5"
            placeholder="kg"
            value={num}
            step={2.5}
            decimals
            error={num === 0 ? "0 kg no es una carga válida aquí." : null}
            onChange={setNum}
          />
          <RirSelector value={rir} targetMin={1} targetMax={2} onChange={setRir} />
        </div>
      </Section>

      <Section title="Modal">
        <PixelButton tone="ghost" block onClick={() => setModalOpen(true)}>
          Abrir modal de prueba
        </PixelButton>
        <PixelModal open={modalOpen} title="Modal de prueba" onClose={() => setModalOpen(false)}>
          <div className="stack stack--tight">
            <p className="small">Foco atrapado, Escape cierra, X visible, scroll bloqueado.</p>
            <PixelButton tone="gold" block onClick={() => setModalOpen(false)}>
              Entendido
            </PixelButton>
          </div>
        </PixelModal>
      </Section>
    </main>
  );
}
