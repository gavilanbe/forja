import { lazy, Suspense, useEffect, useState } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { ensureSeed } from "./db/seed";
import { db } from "./db/db";
import { KV_ONBOARDED, Onboarding } from "./screens/Onboarding";
import { NavBar } from "./ui/NavBar";
import { Today } from "./screens/Today";
import { Workout } from "./screens/Workout";
import { UpdateToast } from "./ui/UpdateToast";
import { useActiveProfile, usePrefs } from "./ui/hooks";

// Pantallas fuera del camino crítico (Hoy/Misión): carga diferida para
// reducir el JavaScript inicial. El precache del service worker las deja
// disponibles offline igualmente.
const MissionComplete = lazy(() =>
  import("./screens/MissionComplete").then((m) => ({ default: m.MissionComplete }))
);
const Campaign = lazy(() =>
  import("./screens/Campaign").then((m) => ({ default: m.Campaign }))
);
const Progress = lazy(() =>
  import("./screens/Progress").then((m) => ({ default: m.Progress }))
);
const Codex = lazy(() => import("./screens/Codex").then((m) => ({ default: m.Codex })));
const CodexDetail = lazy(() =>
  import("./screens/CodexDetail").then((m) => ({ default: m.CodexDetail }))
);
const ProfileScreen = lazy(() =>
  import("./screens/Profile").then((m) => ({ default: m.ProfileScreen }))
);
const History = lazy(() =>
  import("./screens/History").then((m) => ({ default: m.History }))
);
const SessionDetail = lazy(() =>
  import("./screens/History").then((m) => ({ default: m.SessionDetail }))
);
// Solo desarrollo: en producción ni siquiera se genera el chunk.
const NullScreen = () => null;
const DesignLab = import.meta.env.DEV
  ? lazy(() => import("./screens/DesignLab").then((m) => ({ default: m.DesignLab })))
  : NullScreen;
const ArtDirections = import.meta.env.DEV
  ? lazy(() => import("./devart/ArtDirections").then((m) => ({ default: m.ArtDirections })))
  : NullScreen;

function MotionPref() {
  const profile = useActiveProfile();
  const prefs = usePrefs(profile?.id);
  useEffect(() => {
    const root = document.documentElement;
    if (!prefs) return;
    if (prefs.animacionReducida === "reducida") root.dataset.motion = "reducida";
    else if (prefs.animacionReducida === "completa") root.dataset.motion = "completa";
    else delete root.dataset.motion;
  }, [prefs]);
  // Accesibilidad por perfil: tamaño de texto y alto contraste.
  useEffect(() => {
    const root = document.documentElement;
    const acc = profile?.accessibility;
    if (acc?.textSize && acc.textSize !== "normal") root.dataset.textsize = acc.textSize;
    else delete root.dataset.textsize;
    if (acc?.highContrast) root.dataset.contrast = "alto";
    else delete root.dataset.contrast;
    const theme = profile?.appearance?.theme;
    if (theme && theme !== "tema-brasa") root.dataset.theme = theme;
    else delete root.dataset.theme;
  }, [profile]);
  return null;
}

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const Fallback = () => <main className="screen" />;

export function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    ensureSeed()
      .then(async () => {
        const row = await db.kv.get(KV_ONBOARDED);
        setOnboarded(row?.value === true);
        setReady(true);
      })
      .catch((e) => setBootError(String(e)));
  }, []);

  if (bootError) {
    return (
      <div className="app-shell">
        <div className="boot boot--error" role="alert">
          <p className="px-title">FORJA</p>
          <p>No se pudo abrir la base de datos local.</p>
          <p className="boot__detail">{bootError}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="boot" aria-label="Cargando FORJA">
          <p className="px-title">FORJA</p>
        </div>
      </div>
    );
  }

  // Los laboratorios de desarrollo no pasan por onboarding.
  const isDevRoute =
    import.meta.env.DEV && window.location.hash.startsWith("#/dev/");

  // El router y el UpdateToast envuelven también el onboarding: así el
  // service worker se registra y precachea desde la primerísima visita.
  if (onboarded === false && !isDevRoute) {
    return (
      <HashRouter>
        <div className="app-shell">
          <Onboarding onDone={() => setOnboarded(true)} />
          <UpdateToast />
        </div>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <div className="app-shell">
        <MotionPref />
        <ScrollReset />
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/mision" element={<Workout />} />
            <Route path="/mision/resumen/:sessionId" element={<MissionComplete />} />
            <Route path="/campana" element={<Campaign />} />
            <Route path="/progreso" element={<Progress />} />
            <Route path="/historial" element={<History />} />
            <Route path="/historial/:sessionId" element={<SessionDetail />} />
            <Route path="/codice" element={<Codex />} />
            <Route path="/codice/:exerciseId" element={<CodexDetail />} />
            <Route path="/perfil" element={<ProfileScreen />} />
            {import.meta.env.DEV && (
              <Route path="/dev/diseno" element={<DesignLab />} />
            )}
            {import.meta.env.DEV && (
              <Route path="/dev/art-directions" element={<ArtDirections />} />
            )}
            <Route path="*" element={<Today />} />
          </Routes>
        </Suspense>
        <NavBar />
        <UpdateToast />
      </div>
    </HashRouter>
  );
}
