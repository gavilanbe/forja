import { NavLink, useLocation } from "react-router-dom";
import { PxSprite, type Frame } from "./px";
import { PAL_C } from "./arcade/palette";
import {
  NAV_CAMPANA,
  NAV_CODICE,
  NAV_HOY,
  NAV_PERFIL,
  NAV_PROGRESO,
  PAL_DIM
} from "./arcade/icons";

const TABS: { to: string; label: string; icon: Frame }[] = [
  { to: "/", label: "Hoy", icon: NAV_HOY },
  { to: "/campana", label: "Campaña", icon: NAV_CAMPANA },
  { to: "/progreso", label: "Progreso", icon: NAV_PROGRESO },
  { to: "/codice", label: "Códice", icon: NAV_CODICE },
  { to: "/perfil", label: "Perfil", icon: NAV_PERFIL }
];

export function NavBar() {
  const { pathname } = useLocation();
  // Durante una misión activa la navegación se oculta: una sola tarea a la vez.
  // Los laboratorios de dev a pantalla completa tampoco la muestran.
  if (pathname.startsWith("/mision") || pathname.startsWith("/dev/art-directions"))
    return null;
  return (
    <nav className="navbar" aria-label="Navegación principal">
      {TABS.map((t) => {
        const active =
          t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
        return (
          <NavLink
            key={t.to}
            to={t.to}
            className={`navbar__tab${active ? " navbar__tab--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <PxSprite
              frames={[t.icon]}
              palette={active ? PAL_C : PAL_DIM}
              scale={2}
            />
            <span>{t.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
