import { lazy, Suspense, useEffect, useState } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { ensureSeed } from "./db/seed";
import { db } from "./db/db";
import { KV_ONBOARDED, Onboarding } from "./screens/Onboarding";
import { NavBar } from "./ui/NavBar";
import { Today } from "./screens/Today";
import { Workout } from "./screens/Workout";
import { MissionComplete } from "./screens/MissionComplete";
import { Campaign } from "./screens/Campaign";
import { Progress } from "./screens/Progress";
import { Codex } from "./screens/Codex";
import { CodexDetail } from "./screens/CodexDetail";
import { ProfileScreen } from "./screens/Profile";
import { UpdateToast } from "./ui/UpdateToast";
import { useActiveProfile, usePrefs } from "./ui/hooks";
// Solo desarrollo: carga perezosa para que jamás pese en producción.
const DesignLab = lazy(() =>
  import("./screens/DesignLab").then((m) => ({ default: m.DesignLab }))
);
const ArtDirections = lazy(() =>
  import("./devart/ArtDirections").then((m) => ({ default: m.ArtDirections }))
);

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
  return null;
}

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

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
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/mision" element={<Workout />} />
          <Route path="/mision/resumen/:sessionId" element={<MissionComplete />} />
          <Route path="/campana" element={<Campaign />} />
          <Route path="/progreso" element={<Progress />} />
          <Route path="/codice" element={<Codex />} />
          <Route path="/codice/:exerciseId" element={<CodexDetail />} />
          <Route path="/perfil" element={<ProfileScreen />} />
          {import.meta.env.DEV && (
            <Route
              path="/dev/diseno"
              element={
                <Suspense fallback={<main className="screen" />}>
                  <DesignLab />
                </Suspense>
              }
            />
          )}
          {import.meta.env.DEV && (
            <Route
              path="/dev/art-directions"
              element={
                <Suspense fallback={<main className="screen" />}>
                  <ArtDirections />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<Today />} />
        </Routes>
        <NavBar />
        <UpdateToast />
      </div>
    </HashRouter>
  );
}
