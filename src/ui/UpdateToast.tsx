// Aviso de actualización del service worker. Nunca interrumpe una misión:
// si hay entrenamiento activo, el aviso espera a volver a la Forja.

import { useRegisterSW } from "virtual:pwa-register/react";
import { useLocation } from "react-router-dom";
import { PixelButton } from "./Pixel";

export function UpdateToast() {
  const { pathname } = useLocation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({ immediate: true });

  const inWorkout = pathname.startsWith("/mision");
  if (!needRefresh || inWorkout) return null;

  return (
    <div className="update-toast" role="status">
      <span>Hay una versión nueva de FORJA lista.</span>
      <div className="update-toast__actions">
        <PixelButton tone="gold" onClick={() => updateServiceWorker(true)}>
          Actualizar
        </PixelButton>
        <PixelButton tone="ghost" onClick={() => setNeedRefresh(false)}>
          Luego
        </PixelButton>
      </div>
    </div>
  );
}
