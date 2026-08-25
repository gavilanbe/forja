import SwiftUI

private struct OnboardingDraft {
    var name = ""
    var goal: TrainingGoal = .muscleGain
    var experience: ExperienceLevel = .beginner
    var place: TrainingPlace = .gym
    var daysPerWeek = 3
    var preferredDays: Set<Weekday> = [.monday, .wednesday, .friday]
    var sessionMinutes = 75
    var avatar = AvatarConfiguration()
}

struct OnboardingFlow: View {
    @EnvironmentObject private var model: AppModel
    var onFinished: (() -> Void)? = nil
    var onCancel: (() -> Void)? = nil
    @State private var step = 0
    @State private var draft = OnboardingDraft()
    @State private var saving = false

    private let totalSteps = 6

    var body: some View {
        ForjaPage {
            VStack(spacing: 0) {
                if step > 0 {
                    onboardingHeader
                } else if onCancel != nil {
                    cancelHeader
                }
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        stepContent
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, step == 0 ? 28 : 20)
                    .padding(.bottom, ForjaSpacing.xl)
                }
                .scrollDismissesKeyboard(.interactively)
            }
            .safeAreaInset(edge: .bottom) {
                actionBar
            }
        }
    }

    private var cancelHeader: some View {
        HStack {
            Spacer()
            Button {
                onCancel?()
            } label: {
                Image(systemName: "xmark")
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .foregroundStyle(ForjaTheme.parchment)
            .accessibilityLabel("Cancelar nuevo perfil")
        }
        .padding(.horizontal, ForjaSpacing.xs)
    }

    private var onboardingHeader: some View {
        HStack(spacing: 12) {
            Button {
                withAnimation(.snappy) { step = max(0, step - 1) }
            } label: {
                Image(systemName: "chevron.left")
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .foregroundStyle(ForjaTheme.parchment)
            .accessibilityLabel("Volver al paso anterior")

            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(ForjaTheme.coalRaised).frame(height: 6)
                    Capsule().fill(ForjaTheme.ember)
                        .frame(width: proxy.size.width * CGFloat(step) / CGFloat(totalSteps - 1), height: 6)
                }
            }
            .frame(height: 6)
            .accessibilityHidden(true)

            Text("PASO \(step) DE \(totalSteps - 1)")
                .font(.forjaLabel(9))
                .foregroundStyle(ForjaTheme.muted)
                .fixedSize()
                .accessibilityLabel("Paso \(step) de \(totalSteps - 1)")
                .accessibilityAddTraits(.isHeader)
        }
        .padding(.horizontal, 10)
        .padding(.top, 5)
    }

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 0: welcomeStep
        case 1: identityStep
        case 2: objectiveStep
        case 3: scheduleStep
        case 4: avatarStep
        default: guideStep
        }
    }

    private var welcomeStep: some View {
        VStack(spacing: 24) {
            Spacer(minLength: 8)
            ZStack {
                Circle()
                    .fill(ForjaTheme.ember.opacity(0.12))
                    .frame(width: 230, height: 230)
                PixelAvatarView(avatar: draft.avatar)
                    .frame(width: 125, height: 188)
            }
            VStack(spacing: 10) {
                Text("FORJA")
                    .font(.forjaDisplay)
                    .tracking(4)
                Text("Tu entrenamiento, convertido en una campaña que merece la pena continuar.")
                    .font(.title3.weight(.semibold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(ForjaTheme.muted)
            }

            ForjaCard(accent: ForjaTheme.ember) {
                VStack(alignment: .leading, spacing: 13) {
                    onboardingPromise("figure.walk.motion", "Plan realista", "Tus días mandan; descansar no rompe la campaña.")
                    onboardingPromise("bolt.shield.fill", "Funciona sin conexión", "Una serie se guarda antes de cualquier otra cosa.")
                    onboardingPromise("heart.text.square.fill", "Sin castigos", "No premiamos dolor, fallo ni volumen innecesario.")
                }
            }

            Text("Sin cuenta · Sin anuncios · Datos en tu iPhone")
                .font(.caption)
                .foregroundStyle(ForjaTheme.muted)
        }
        .frame(maxWidth: 520)
        .frame(maxWidth: .infinity)
    }

    private func onboardingPromise(_ icon: String, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(ForjaTheme.gold)
                .frame(width: 25)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(detail).font(.subheadline).foregroundStyle(ForjaTheme.muted)
            }
        }
    }

    private var identityStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForjaSectionTitle(
                kicker: "Tu identidad",
                title: "¿Cómo te llamamos?",
                detail: "Tu nombre aparece en la campaña y puedes cambiarlo cuando quieras."
            )
            TextField("Nombre del forjador", text: $draft.name)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled()
                .submitLabel(.next)
                .onSubmit {
                    if canContinue { withAnimation(.snappy) { step = 2 } }
                }
                .font(.title3.weight(.semibold))
                .padding(16)
                .background(ForjaTheme.coalRaised)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay {
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(draft.name.isEmpty ? ForjaTheme.parchment.opacity(0.15) : ForjaTheme.gold, lineWidth: 1)
                }
            Text("No necesitas correo ni crear una cuenta.")
                .font(.subheadline)
                .foregroundStyle(ForjaTheme.muted)
        }
    }

    private var objectiveStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForjaSectionTitle(
                kicker: "Tu punto de partida",
                title: "¿Qué quieres forjar?",
                detail: "Esto personaliza la guía y deja clara tu intención; nunca cambia cargas por ti."
            )
            VStack(spacing: 10) {
                ForEach(TrainingGoal.allCases) { goal in
                    selectionCard(
                        title: goal.title,
                        detail: goal.detail,
                        selected: draft.goal == goal
                    ) { draft.goal = goal }
                }
            }

            Text("Experiencia").font(.forjaLabel()).foregroundStyle(ForjaTheme.gold)
            VStack(spacing: 8) {
                ForEach(ExperienceLevel.allCases) { level in
                    selectionCard(
                        title: level.title,
                        detail: experienceDetail(level),
                        selected: draft.experience == level
                    ) { draft.experience = level }
                }
            }

            Text("Dónde entrenas").font(.forjaLabel()).foregroundStyle(ForjaTheme.gold)
            Picker("Lugar", selection: $draft.place) {
                ForEach(TrainingPlace.allCases) { place in
                    Text(place.title).tag(place)
                }
            }
            .pickerStyle(.segmented)

            if draft.place != .gym {
                Label(
                    "La rutina base actual usa material de gimnasio. Verás alternativas en el Códice, pero FORJA todavía no sustituye cada ejercicio automáticamente.",
                    systemImage: "info.circle.fill"
                )
                .font(.caption)
                .foregroundStyle(ForjaTheme.gold)
                .padding(ForjaSpacing.sm)
                .background(ForjaTheme.gold.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: ForjaRadius.control))
            }
        }
    }

    private var scheduleStep: some View {
        VStack(alignment: .leading, spacing: 22) {
            ForjaSectionTitle(
                kicker: "Tu semana",
                title: "Un plan que sí cabe",
                detail: "Elige una frecuencia sostenible. Podrás mover misiones sin perder la llama."
            )

            HStack(spacing: 10) {
                ForEach(3...5, id: \.self) { count in
                    Button {
                        draft.daysPerWeek = count
                        draft.preferredDays = Set(defaultDays(count))
                    } label: {
                        VStack(spacing: 4) {
                            Text("\(count)").font(.forjaTitle(28))
                            Text("DÍAS").font(.forjaLabel(9))
                        }
                        .frame(maxWidth: .infinity, minHeight: 78)
                        .foregroundStyle(draft.daysPerWeek == count ? ForjaTheme.ink : ForjaTheme.parchment)
                        .background(draft.daysPerWeek == count ? ForjaTheme.gold : ForjaTheme.coalRaised)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .contentShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(count) días por semana")
                    .accessibilityAddTraits(draft.daysPerWeek == count ? .isSelected : [])
                }
            }

            Text("Días preferidos").font(.forjaLabel()).foregroundStyle(ForjaTheme.gold)
            HStack(spacing: 7) {
                ForEach(Weekday.allCases) { weekday in
                    let selected = draft.preferredDays.contains(weekday)
                    Button {
                        toggle(weekday)
                    } label: {
                        Text(weekday.shortTitle)
                            .font(.system(.body, design: .monospaced, weight: .bold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .foregroundStyle(selected ? ForjaTheme.ink : ForjaTheme.parchment)
                            .background(selected ? ForjaTheme.ember : ForjaTheme.coalRaised)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .contentShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(weekday.title)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
            Text("\(draft.preferredDays.count) de \(draft.daysPerWeek) seleccionados")
                .font(.caption)
                .foregroundStyle(draft.preferredDays.count == draft.daysPerWeek ? ForjaTheme.green : ForjaTheme.muted)

            Text("Tiempo por sesión").font(.forjaLabel()).foregroundStyle(ForjaTheme.gold)
            VStack(spacing: 8) {
                Slider(value: Binding(
                    get: { Double(draft.sessionMinutes) },
                    set: { draft.sessionMinutes = Int($0.rounded() / 5) * 5 }
                ), in: 45...120, step: 5)
                .tint(ForjaTheme.ember)
                .accessibilityLabel("Tiempo por sesión")
                .accessibilityValue("\(draft.sessionMinutes) minutos")
                Text("Aproximadamente \(draft.sessionMinutes) minutos")
                    .font(.headline)
                    .accessibilityHidden(true)
            }
            .padding(16)
            .background(ForjaTheme.coalRaised)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            Text("La duración es una referencia para tu perfil. La primera versión no recorta series automáticamente sin que exista una regla de programación validada.")
                .font(.caption)
                .foregroundStyle(ForjaTheme.muted)
        }
    }

    private var avatarStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForjaSectionTitle(
                kicker: "Tu avatar",
                title: "Entra en la Forja",
                detail: "Cada capa tiene una identidad estable. Los sprites finales podrán mejorar sin perder tu personaje."
            )
            AvatarStudioView(avatar: $draft.avatar)
        }
    }

    private var guideStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForjaSectionTitle(
                kicker: "Antes de empezar",
                title: "Así funciona FORJA",
                detail: "Tres reglas para que la campaña ayude en vez de presionar."
            )
            guideCard(
                number: "01",
                title: "Registra con honestidad",
                detail: "Peso, repeticiones y RIR. RIR es cuántas repeticiones limpias te quedaban."
            )
            guideCard(
                number: "02",
                title: "El descanso también cuenta",
                detail: "La llama es semanal. Un día de campamento nunca rompe tu progreso."
            )
            guideCard(
                number: "03",
                title: "Adapta cuando haga falta",
                detail: "Si hay molestia, reduce carga o recorrido, cambia de variante o detén el ejercicio. FORJA no diagnostica."
            )
            ForjaCard(accent: ForjaTheme.green) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "lock.shield.fill")
                        .foregroundStyle(ForjaTheme.green)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Tus datos se quedan aquí").font(.headline)
                        Text("FORJA funciona sin cuenta y sin conexión. Tú decides cuándo exportar una copia.")
                            .font(.subheadline)
                            .foregroundStyle(ForjaTheme.muted)
                    }
                }
            }
            Text("Las notificaciones de descanso se pedirán cuando uses el primer temporizador, no antes.")
                .font(.caption)
                .foregroundStyle(ForjaTheme.muted)
        }
    }

    private func guideCard(number: String, title: String, detail: String) -> some View {
        ForjaCard(accent: ForjaTheme.ember) {
            HStack(alignment: .top, spacing: 14) {
                Text(number).font(.forjaLabel(18)).foregroundStyle(ForjaTheme.ember)
                VStack(alignment: .leading, spacing: 5) {
                    Text(title).font(.title3.weight(.bold))
                    Text(detail).font(.subheadline).foregroundStyle(ForjaTheme.muted)
                }
            }
        }
    }

    private func selectionCard(
        title: String,
        detail: String,
        selected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selected ? ForjaTheme.gold : ForjaTheme.muted)
                    .font(.title3)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.headline)
                    Text(detail).font(.subheadline).foregroundStyle(ForjaTheme.muted)
                }
                Spacer(minLength: 0)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? ForjaTheme.gold.opacity(0.1) : ForjaTheme.coalRaised)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(selected ? ForjaTheme.gold : Color.clear, lineWidth: 1)
            }
            .contentShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private var actionBar: some View {
        VStack(spacing: 8) {
            Button(actionTitle) {
                if step == totalSteps - 1 {
                    Task { await finish() }
                } else {
                    withAnimation(.snappy) { step += 1 }
                }
            }
            .buttonStyle(ForjaPrimaryButtonStyle())
            .disabled(!canContinue || saving)
            .opacity(canContinue && !saving ? 1 : 0.45)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
    }

    private var actionTitle: String {
        if step == 0 { return "Crear mi forjador" }
        if step == totalSteps - 1 { return "Encender mi campaña" }
        return "Continuar"
    }

    private var canContinue: Bool {
        switch step {
        case 1: !draft.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case 3: draft.preferredDays.count == draft.daysPerWeek
        default: true
        }
    }

    private func experienceDetail(_ level: ExperienceLevel) -> String {
        switch level {
        case .beginner: "Necesito contexto y una entrada conservadora."
        case .intermediate: "Conozco los movimientos y registro mis cargas."
        case .advanced: "Quiero control fino sin automatismos agresivos."
        }
    }

    private func toggle(_ day: Weekday) {
        if draft.preferredDays.contains(day) {
            draft.preferredDays.remove(day)
        } else if draft.preferredDays.count < draft.daysPerWeek {
            draft.preferredDays.insert(day)
        }
    }

    private func defaultDays(_ count: Int) -> [Weekday] {
        switch count {
        case 3: [.monday, .wednesday, .friday]
        case 4: [.monday, .tuesday, .thursday, .saturday]
        default: [.monday, .tuesday, .thursday, .friday, .saturday]
        }
    }

    private func finish() async {
        saving = true
        let profile = UserProfile(
            name: draft.name,
            goal: draft.goal,
            experience: draft.experience,
            trainingPlace: draft.place,
            daysPerWeek: draft.daysPerWeek,
            preferredDays: draft.preferredDays.sorted { $0.rawValue < $1.rawValue },
            preferredSessionMinutes: draft.sessionMinutes,
            avatar: draft.avatar,
            campaignStart: ForjaDate.monday(of: Date())
        )
        let created = await model.createProfile(profile)
        saving = false
        if created { onFinished?() }
    }
}
