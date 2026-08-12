// Mejoras progresivas del descanso: Wake Lock y notificación local.
// Ambas son opcionales y fallan en silencio: el temporizador nunca depende
// de ellas (usa timestamp absoluto persistido).

export interface WakeLockHandle {
  release: () => void;
}

/** Mantiene la pantalla encendida mientras dura el descanso, si se puede. */
export const acquireWakeLock = async (): Promise<WakeLockHandle | null> => {
  try {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    if (!nav.wakeLock) return null;
    const sentinel = await nav.wakeLock.request("screen");
    return { release: () => void sentinel.release().catch(() => undefined) };
  } catch {
    return null;
  }
};

export const notificationPermission = (): NotificationPermission | "unsupported" =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof Notification === "undefined") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
};

/** Notificación local de fin de descanso (best effort). */
export const notifyRestEnd = (exerciseName: string): void => {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification("Descanso cumplido — FORJA", {
      body: `Al yunque: ${exerciseName}`,
      tag: "forja-rest",
      silent: false
    });
  } catch {
    // Sin permiso o sin soporte: el pitido/vibración ya cubren el aviso.
  }
};
