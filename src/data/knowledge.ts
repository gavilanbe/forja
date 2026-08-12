// Conocimiento general del manual (§2 Reglas generales). Transcripción del
// DOCX de referencia: nada inventado, sin consejos médicos añadidos.
// Fuente: Manual de hipertrofia — Nahuel y Carlos, v1.0 (agosto 2026).

export interface KnowledgeSection {
  id: string;
  titulo: string;
  puntos: string[];
}

export const KNOWLEDGE: KnowledgeSection[] = [
  {
    id: "carga",
    titulo: "Cómo elegir el peso",
    puntos: [
      "En la primera semana, elige una carga que permita alcanzar la parte media del rango con RIR 2 real y técnica estable.",
      "La última repetición debe ser más lenta por esfuerzo, pero no cambiar el recorrido ni la postura.",
      "Si no llegas al mínimo de repeticiones con el RIR prescrito, reduce un 5-10 % o usa el siguiente escalón inferior de la máquina.",
      "Si superas el máximo y todavía conservas más RIR del indicado, sube la carga en la siguiente sesión."
    ]
  },
  {
    id: "rir",
    titulo: "Qué significa RIR",
    puntos: [
      "RIR 3: al terminar la serie podrías hacer unas 3 repeticiones limpias más.",
      "RIR 2: quedan aproximadamente 2 repeticiones buenas.",
      "RIR 1: queda 1 repetición limpia.",
      "RIR 0: fallo técnico — no puedes completar otra repetición con el recorrido y la técnica acordados.",
      "Calibración: si creías terminar a RIR 1 y habrías podido hacer 4 repeticiones más, el peso fue demasiado bajo. Si fallas antes del mínimo de repeticiones, fue demasiado alto. Ajusta en la siguiente serie, no a mitad de una repetición."
    ]
  },
  {
    id: "descansos",
    titulo: "Descansos",
    puntos: [
      "Compuestos pesados: 2:30-3:00 min. Empieza la siguiente serie cuando respiración, agarre y concentración vuelvan a estar listos.",
      "Máquinas y aislamientos: 60-120 s según la ficha. Si el rendimiento cae más de 2 repeticiones sin explicación, añade 30-45 s.",
      "Series por lado: el descanso indicado comienza después de completar ambos lados, salvo que la ficha diga otra cosa."
    ]
  },
  {
    id: "calentamiento",
    titulo: "Calentamiento y series de aproximación",
    puntos: [
      "5-8 minutos de bicicleta o caminata suave. Para la rodilla, prioriza una opción de bajo impacto.",
      "Movilidad dinámica específica: 1-2 movimientos suaves para hombro/cadera/rodilla, sin convertirlo en una sesión aparte.",
      "Primer compuesto: 3-4 series de aproximación. Ejemplo orientativo: 40 % × 8, 60 % × 5, 75 % × 2-3 y, si hace falta, una repetición cercana a la carga de trabajo.",
      "En el primer ejercicio de un patrón nuevo, realiza 1-2 aproximaciones adicionales. Ninguna aproximación debe acercarse al fallo.",
      "Las series de aproximación no cuentan dentro del volumen prescrito."
    ]
  },
  {
    id: "progresion",
    titulo: "Progresión: doble progresión",
    puntos: [
      "Mantén el peso mientras sumas repeticiones dentro del rango, respetando el RIR de cada serie.",
      "Cuando todas las series alcancen el máximo del rango con el RIR previsto y técnica repetible, aumenta la carga la sesión siguiente.",
      "Subida orientativa: 2-5 % en compuestos; el menor salto disponible en poleas y aislamientos. Si el salto es grande, vuelve a la parte baja del rango.",
      "Si durante dos sesiones seguidas empeoran repeticiones, RIR y técnica, mantén o reduce 5-10 % y revisa sueño, estrés y volumen.",
      "No añadas series porque un día te sientas fuerte. Primero progresa repeticiones y carga durante al menos 3-4 semanas."
    ]
  },
  {
    id: "descarga",
    titulo: "Bloque y descarga",
    puntos: [
      "Bloque inicial: 6 semanas de trabajo. Semana 1 conservadora; semanas 2-5 de progresión; semana 6 de evaluación.",
      "Descarga solo si hace falta: reduce las series un 40-50 %, conserva los ejercicios y termina a RIR 3-4 durante 5-7 días.",
      "Úsala si se acumulan caídas de rendimiento, dolor articular, sueño peor o falta de recuperación."
    ]
  },
  {
    id: "rodilla",
    titulo: "Reglas de seguridad de rodilla",
    puntos: [
      "Verde (0-2/10 y vuelve a la línea base en 24 h): mantén la variante y progresa con prudencia.",
      "Ámbar (3-4/10 o más rigidez al día siguiente): reduce carga 10-20 %, acorta solo el rango irritante o cambia a la alternativa.",
      "Rojo (>4/10, dolor agudo o síntomas que aumentan): detén el ejercicio. No lo atravieses para cumplir la rutina.",
      "Orden de modificación: baja carga → ajusta profundidad → ralentiza y controla → cambia a belt squat/prensa → reduce series.",
      "No fuerces una profundidad concreta. Amplía el recorrido gradualmente solo si la respuesta durante y 24 horas después es buena.",
      "Suspende la sesión y solicita valoración si hay bloqueo, fallo de la rodilla, incapacidad para apoyar, hinchazón marcada, deformidad, o calor/enrojecimiento acompañado de fiebre.",
      "Si la molestia persiste varias semanas o empeora, consulta a un fisioterapeuta o médico antes de seguir progresando cargas.",
      "Este manual organiza el entrenamiento; no diagnostica ni sustituye una valoración sanitaria o fisioterapéutica."
    ]
  }
];
