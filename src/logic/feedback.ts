// Sonido y vibración opcionales (apagados por defecto).
// El pitido se sintetiza con WebAudio: cero assets externos.

let ctx: AudioContext | null = null;

export const playRestEndBeep = () => {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    // Dos notas cortas estilo consola: cuadrada, seco.
    [[660, 0], [880, 0.14]].forEach(([freq, dt]) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, t0 + dt);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dt + 0.12);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t0 + dt);
      osc.stop(t0 + dt + 0.13);
    });
  } catch {
    // sin audio disponible: silencio
  }
};

export const vibrate = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // sin vibración disponible
  }
};
