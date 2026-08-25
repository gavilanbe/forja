import SwiftUI

struct WorkoutView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    let day: WorkoutDay
    var existingSessionID: UUID?
    var unscheduled = false

    @State private var sessionID: UUID?
    @State private var weightText = ""
    @State private var reps = 8
    @State private var rir = 2
    @State private var showingTechnique = false
    @State private var showingDiscomfort = false
    @State private var showingFinishConfirmation = false
    @State private var showingAbandonConfirmation = false
    @State private var completedSession: TrainingSession?
    @State private var saving = false
    @State private var setPendingDeletion: LoggedSet?
    @FocusState private var weightFocused: Bool

    private var session: TrainingSession? {
        guard let sessionID else { return nil }
        return model.database.sessions.first(where: { $0.id == sessionID })
    }

    private var currentIndex: Int {
        min(max(0, session?.currentExerciseIndex ?? 0), max(0, day.entries.count - 1))
    }

    private var prescription: ExercisePrescription? {
        guard day.entries.indices.contains(currentIndex) else { return nil }
        return day.entries[currentIndex]
    }

    private var currentSets: [LoggedSet] {
        guard let sessionID, let exerciseID = prescription?.exerciseID else { return [] }
        return model.database.setLogs
            .filter { $0.sessionID == sessionID && $0.exerciseID == exerciseID }
            .sorted { $0.setNumber < $1.setNumber }
    }

    private var profile: UserProfile? { model.activeProfile }

    private var currentTimer: RestTimerState? {
        guard model.database.activeTimer?.sessionID == sessionID else { return nil }
        return model.database.activeTimer
    }

    var body: some View {
        ForjaPage {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    workoutHeader
                    if let prescription {
                        exerciseIdentity(prescription)
                        RestTimerPanel(
                            timer: currentTimer,
                            hapticsEnabled: profile?.preferences.hapticsEnabled ?? true,
                            onAdd: { adjustTimer(by: 15) },
                            onPauseResume: toggleTimer,
                            onSkip: stopTimer
                        )
                        progressionPanel(prescription)
                        inputPanel(prescription)
                        loggedSetsPanel
                        exerciseNavigation
                        safetyActions
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .padding(.bottom, 40)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationTitle(day.name)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Terminar misión", systemImage: "flag.checkered") {
                        showingFinishConfirmation = true
                    }
                    Button("Abandonar misión", systemImage: "xmark", role: .destructive) {
                        showingAbandonConfirmation = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Hecho") { weightFocused = false }
            }
        }
        .task { await prepareSession() }
        .onChange(of: currentIndex) { _, _ in seedInputs() }
        .sheet(isPresented: $showingTechnique) {
            if let prescription, let guide = model.guide(prescription.exerciseID) {
                TechniqueSheet(guide: guide)
            }
        }
        .sheet(isPresented: $showingDiscomfort) {
            if let sessionID, let prescription {
                DiscomfortSheet(sessionID: sessionID, exerciseID: prescription.exerciseID)
            }
        }
        .sheet(item: $completedSession) { session in
            MissionSummaryView(session: session) { dismiss() }
                .interactiveDismissDisabled()
        }
        .confirmationDialog("¿Sellar esta misión?", isPresented: $showingFinishConfirmation) {
            Button("Terminar y calcular el resultado") { Task { await finish() } }
            Button("Seguir entrenando", role: .cancel) {}
        } message: {
            Text("FORJA distinguirá entre misión completada, adaptada o parcial según lo registrado.")
        }
        .confirmationDialog("¿Abandonar la misión?", isPresented: $showingAbandonConfirmation) {
            Button("Abandonar sin recompensa", role: .destructive) { Task { await abandon() } }
            Button("Volver", role: .cancel) {}
        } message: {
            Text("Tus series guardadas no se borran. La misión quedará marcada como abandonada.")
        }
        .alert(
            "Eliminar serie",
            isPresented: Binding(
                get: { setPendingDeletion != nil },
                set: { if !$0 { setPendingDeletion = nil } }
            )
        ) {
            Button("Eliminar", role: .destructive) {
                if let setPendingDeletion {
                    Task { await model.deleteSet(setPendingDeletion.id) }
                }
                setPendingDeletion = nil
            }
            Button("Cancelar", role: .cancel) { setPendingDeletion = nil }
        } message: {
            Text("La serie se quitará del historial y el XP se recalculará.")
        }
        .keepScreenAwake(profile?.preferences.keepScreenAwake ?? false)
    }

    private var workoutHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                ForjaPill(
                    text: unscheduled ? "Misión opcional · sin XP" : "Misión activa",
                    color: unscheduled ? ForjaTheme.blue : ForjaTheme.ember
                )
                Spacer()
                Text("ETAPA \(currentIndex + 1)/\(day.entries.count)")
                    .font(.forjaLabel(10))
                    .foregroundStyle(ForjaTheme.muted)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(ForjaTheme.coalRaised)
                    Capsule().fill(ForjaTheme.ember)
                        .frame(width: proxy.size.width * CGFloat(currentIndex + 1) / CGFloat(max(1, day.entries.count)))
                }
            }
            .frame(height: 7)
            .accessibilityHidden(true)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(unscheduled ? "Misión opcional sin XP" : "Misión activa"). Etapa \(currentIndex + 1) de \(day.entries.count)"
        )
    }

    private func exerciseIdentity(_ prescription: ExercisePrescription) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(model.workoutName(prescription.exerciseID))
                .font(.forjaScreenTitle)
            HStack(spacing: 10) {
                ForjaPill(text: "\(prescription.sets) × \(prescription.repMin)–\(prescription.repMax)")
                ForjaPill(
                    text: "\(formatRest(prescription.restMinSec))–\(formatRest(prescription.restMaxSec))",
                    color: ForjaTheme.blue
                )
            }
            if let note = prescription.note {
                Text(note).font(.subheadline).foregroundStyle(ForjaTheme.gold)
            }
            HStack(spacing: 10) {
                Button {
                    showingTechnique = true
                } label: {
                    Label("Técnica", systemImage: "book.pages")
                }
                .buttonStyle(ForjaSecondaryButtonStyle())

                Button {
                    showingDiscomfort = true
                } label: {
                    Label("Molestia", systemImage: "cross.case")
                }
                .buttonStyle(ForjaSecondaryButtonStyle())
            }
        }
    }

    @ViewBuilder
    private func progressionPanel(_ prescription: ExercisePrescription) -> some View {
        let previous = previousComparableSets(for: prescription.exerciseID)
        let hasDiscomfort = model.database.discomforts.contains {
            $0.profileID == profile?.id && $0.exerciseID == prescription.exerciseID && $0.level >= 3
        }
        let increment = prescription.restMinSec >= 150
            ? profile?.preferences.compoundIncrementKg ?? 2.5
            : profile?.preferences.isolationIncrementKg ?? 1.25
        let suggestion = ProgressionEngine.suggest(
            prescription: prescription,
            previousSets: previous,
            hasActiveDiscomfort: hasDiscomfort,
            incrementKg: increment
        )

        ForjaCard(accent: suggestion.kind == .increase ? ForjaTheme.green : ForjaTheme.blue) {
            VStack(alignment: .leading, spacing: 5) {
                HStack {
                    Text("SIGUIENTE PASO").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.blue)
                    Spacer()
                    if let weight = suggestion.weightKg {
                        Text("\(weight.formatted(.number.precision(.fractionLength(0...2)))) kg")
                            .font(.headline.monospacedDigit())
                    }
                }
                Text(suggestion.reason)
                    .font(.caption)
                    .foregroundStyle(ForjaTheme.muted)
            }
        }
    }

    private func inputPanel(_ prescription: ExercisePrescription) -> some View {
        let nextSet = currentSets.count + 1
        let target = prescription.rirPerSet[min(max(0, nextSet - 1), prescription.rirPerSet.count - 1)].rir
        return ForjaCard(accent: ForjaTheme.ember) {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text(nextSet <= prescription.sets ? "SERIE \(nextSet) DE \(prescription.sets)" : "SERIE EXTRA · SIN XP")
                        .font(.forjaLabel(11))
                        .foregroundStyle(nextSet <= prescription.sets ? ForjaTheme.ember : ForjaTheme.muted)
                    Spacer()
                    Text("RIR objetivo \(target.label)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ForjaTheme.gold)
                }

                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("PESO").font(.forjaLabel(9)).foregroundStyle(ForjaTheme.muted)
                        HStack(spacing: 6) {
                            TextField("0", text: $weightText)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.center)
                                .font(.forjaMetric)
                                .focused($weightFocused)
                                .accessibilityLabel("Peso en kilogramos")
                            Text("kg")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(ForjaTheme.muted)
                        }
                        .frame(minHeight: 52)
                        .padding(.horizontal, 10)
                        .background(ForjaTheme.ink.opacity(0.5))
                        .clipShape(RoundedRectangle(cornerRadius: ForjaRadius.control))
                    }
                    .frame(maxWidth: .infinity)

                    numberStepper(title: "REPETICIONES", value: $reps, range: 1...200)
                        .frame(maxWidth: .infinity)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("RIR REAL").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.muted)
                    Picker("RIR real", selection: $rir) {
                        ForEach(0...4, id: \.self) { value in
                            Text(value == 4 ? "4+" : "\(value)").tag(value)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Button {
                    Task { await saveSet(prescription: prescription, number: nextSet) }
                } label: {
                    if saving {
                        ProgressView().tint(ForjaTheme.ink)
                    } else {
                        Label("Guardar serie", systemImage: "hammer.fill")
                    }
                }
                .buttonStyle(ForjaPrimaryButtonStyle())
                .disabled(saving || weightText.replacingOccurrences(of: ",", with: ".").isEmpty)
                .opacity(saving ? 0.6 : 1)
            }
        }
    }

    private func numberStepper(
        title: String,
        value: Binding<Int>,
        range: ClosedRange<Int>
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.forjaLabel(9)).foregroundStyle(ForjaTheme.muted)
            HStack(spacing: 2) {
                Button {
                    value.wrappedValue = max(range.lowerBound, value.wrappedValue - 1)
                } label: {
                    Image(systemName: "minus")
                        .frame(width: 44, height: 52)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(value.wrappedValue == range.lowerBound)
                .accessibilityLabel("Reducir repeticiones")

                Text("\(value.wrappedValue)")
                    .font(.forjaMetric)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity)

                Button {
                    value.wrappedValue = min(range.upperBound, value.wrappedValue + 1)
                } label: {
                    Image(systemName: "plus")
                        .frame(width: 44, height: 52)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(value.wrappedValue == range.upperBound)
                .accessibilityLabel("Aumentar repeticiones")
            }
            .frame(minHeight: 52)
            .background(ForjaTheme.ink.opacity(0.5))
            .clipShape(RoundedRectangle(cornerRadius: ForjaRadius.control))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Repeticiones")
            .accessibilityValue("\(value.wrappedValue)")
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment: value.wrappedValue = min(range.upperBound, value.wrappedValue + 1)
                case .decrement: value.wrappedValue = max(range.lowerBound, value.wrappedValue - 1)
                @unknown default: break
                }
            }
        }
    }

    @ViewBuilder
    private var loggedSetsPanel: some View {
        if !currentSets.isEmpty {
            VStack(alignment: .leading, spacing: 9) {
                Text("SERIES GUARDADAS").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
                ForEach(currentSets) { set in
                    loggedSetRow(set)
                }
            }
        }
    }

    private func loggedSetRow(_ set: LoggedSet) -> some View {
        HStack(spacing: 10) {
            Text("\(set.setNumber)")
                .font(.forjaLabel())
                .frame(width: 30, height: 30)
                .background(ForjaTheme.green.opacity(0.18))
                .clipShape(Circle())
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(set.weightKg.formatted(.number.precision(.fractionLength(0...2)))) kg × \(set.reps)")
                    .font(.headline.monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Text("RIR \(set.rir == 4 ? "4+" : "\(set.rir)")")
                    .font(.caption)
                    .foregroundStyle(ForjaTheme.muted)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel(
                "Serie \(set.setNumber): \(set.weightKg.formatted(.number.precision(.fractionLength(0...2)))) kilos por \(set.reps) repeticiones, RIR \(set.rir == 4 ? "4 o más" : "\(set.rir)")"
            )
            Spacer(minLength: 4)
            Button(role: .destructive) {
                setPendingDeletion = set
            } label: {
                Image(systemName: "trash")
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("Eliminar serie \(set.setNumber)")
        }
        .padding(.leading, 12)
        .padding(.trailing, 4)
        .padding(.vertical, 6)
        .background(ForjaTheme.coalRaised)
        .clipShape(RoundedRectangle(cornerRadius: ForjaRadius.control))
    }

    private var exerciseNavigation: some View {
        VStack(spacing: 10) {
            if currentIndex < day.entries.count - 1 {
                Button {
                    Task { await move(to: currentIndex + 1) }
                } label: {
                    Label("Siguiente etapa", systemImage: "arrow.right")
                }
                .buttonStyle(ForjaSecondaryButtonStyle())
            } else {
                Button {
                    showingFinishConfirmation = true
                } label: {
                    Label("Terminar misión", systemImage: "flag.checkered")
                }
                .buttonStyle(ForjaPrimaryButtonStyle(tone: ForjaTheme.gold))
            }
            if currentIndex > 0 {
                Button("Volver a la etapa anterior") {
                    Task { await move(to: currentIndex - 1) }
                }
                .font(.subheadline)
                .foregroundStyle(ForjaTheme.muted)
                .frame(minHeight: 44)
            }
        }
    }

    private var safetyActions: some View {
        Text("FORJA organiza el entrenamiento; no diagnostica. Si una molestia persiste o empeora, consulta a un fisioterapeuta o médico.")
            .font(.caption)
            .foregroundStyle(ForjaTheme.muted)
            .padding(.top, 8)
    }

    private func prepareSession() async {
        if let existingSessionID {
            sessionID = existingSessionID
        } else if let started = await model.startSession(day: day, unscheduled: unscheduled) {
            sessionID = started.id
        }
        seedInputs()
    }

    private func seedInputs() {
        guard let prescription else { return }
        let previous = previousComparableSets(for: prescription.exerciseID)
        if let weight = previous.last?.weightKg {
            weightText = weight.formatted(.number.precision(.fractionLength(0...2)))
        } else if weightText.isEmpty {
            weightText = bodyweightExercise(prescription.exerciseID) ? "0" : ""
        }
        reps = (prescription.repMin + prescription.repMax) / 2
        rir = prescription.rirPerSet.first?.rir.min ?? 2
    }

    private func saveSet(prescription: ExercisePrescription, number: Int) async {
        guard let sessionID else { return }
        let normalized = weightText.replacingOccurrences(of: ",", with: ".")
        guard let weight = Double(normalized), weight >= 0 else {
            model.presentedError = "Introduce un peso válido."
            return
        }
        if weight == 0 && !bodyweightExercise(prescription.exerciseID) {
            model.presentedError = "Introduce el peso de trabajo para este ejercicio."
            return
        }
        saving = true
        let saved = await model.logSet(
            sessionID: sessionID,
            request: LogSetRequest(
                exerciseID: prescription.exerciseID,
                setNumber: number,
                weightKg: weight,
                reps: reps,
                rir: rir
            )
        )
        if saved != nil {
            Haptics.setSaved(enabled: profile?.preferences.hapticsEnabled ?? true)
            await startRest(prescription)
        }
        saving = false
    }

    private func startRest(_ prescription: ExercisePrescription) async {
        guard let sessionID else { return }
        let seconds = prescription.restMinSec
        let timer = RestTimerState(
            sessionID: sessionID,
            exerciseID: prescription.exerciseID,
            totalSeconds: seconds,
            targetEndAt: Date().addingTimeInterval(TimeInterval(seconds)),
            pausedRemainingSeconds: nil
        )
        await model.saveTimer(timer)
        guard profile?.preferences.restNotificationsEnabled ?? false else { return }
        let allowed = await NotificationService.shared.requestPermission()
        if allowed {
            await NotificationService.shared.scheduleRestEnd(
                timer: timer,
                exerciseName: model.workoutName(prescription.exerciseID)
            )
        }
    }

    private func adjustTimer(by seconds: Int) {
        guard var timer = currentTimer else { return }
        if let paused = timer.pausedRemainingSeconds {
            timer.pausedRemainingSeconds = max(0, paused + seconds)
        } else {
            timer.targetEndAt = timer.targetEndAt.addingTimeInterval(TimeInterval(seconds))
        }
        Task { await model.saveTimer(timer) }
    }

    private func toggleTimer() {
        guard var timer = currentTimer else { return }
        if let paused = timer.pausedRemainingSeconds {
            timer.pausedRemainingSeconds = nil
            timer.targetEndAt = Date().addingTimeInterval(TimeInterval(paused))
        } else {
            timer.pausedRemainingSeconds = timer.remainingSeconds()
            NotificationService.shared.cancelRestEnd()
        }
        Task { await model.saveTimer(timer) }
    }

    private func stopTimer() {
        guard currentTimer != nil else { return }
        NotificationService.shared.cancelRestEnd()
        Task { await model.saveTimer(nil) }
    }

    private func move(to index: Int) async {
        guard let sessionID else { return }
        stopTimer()
        await model.setCurrentExercise(sessionID: sessionID, index: index)
    }

    private func finish() async {
        guard let sessionID else { return }
        stopTimer()
        if let sealed = await model.completeSession(sessionID) {
            completedSession = sealed
        }
    }

    private func abandon() async {
        guard let sessionID else { return }
        stopTimer()
        _ = await model.completeSession(sessionID, abandon: true)
        dismiss()
    }

    private func previousComparableSets(for exerciseID: String) -> [LoggedSet] {
        guard let profile else { return [] }
        let current = sessionID
        let previousSessionIDs = model.database.sessions
            .filter { $0.profileID == profile.id && $0.id != current && $0.status != .active }
            .sorted { ($0.completedAt ?? $0.startedAt) > ($1.completedAt ?? $1.startedAt) }
            .map(\.id)
        guard let latestID = previousSessionIDs.first(where: { id in
            model.database.setLogs.contains { $0.sessionID == id && $0.exerciseID == exerciseID }
        }) else { return [] }
        return model.database.setLogs
            .filter { $0.sessionID == latestID && $0.exerciseID == exerciseID }
            .sorted { $0.setNumber < $1.setNumber }
    }

    private func bodyweightExercise(_ id: String) -> Bool {
        ["elevacion-rodillas-colgado"].contains(id)
    }

    private func formatRest(_ seconds: Int) -> String {
        if seconds % 60 == 0 { return "\(seconds / 60) min" }
        return "\(seconds / 60):\(String(format: "%02d", seconds % 60))"
    }
}

private struct RestTimerPanel: View {
    var timer: RestTimerState?
    var hapticsEnabled = true
    var onAdd: () -> Void
    var onPauseResume: () -> Void
    var onSkip: () -> Void

    var body: some View {
        if let timer {
            TimelineView(.periodic(from: .now, by: 1)) { context in
                let remaining = timer.remainingSeconds(at: context.date)
                let paused = timer.pausedRemainingSeconds != nil
                let finished = remaining == 0
                ForjaCard(
                    accent: finished ? ForjaTheme.green : ForjaTheme.blue,
                    prominent: true
                ) {
                    VStack(spacing: 13) {
                        Text(finished ? "DESCANSO CUMPLIDO" : paused ? "DESCANSO EN PAUSA" : "DESCANSO")
                            .font(.forjaLabel(11))
                            .foregroundStyle(finished ? ForjaTheme.green : ForjaTheme.blue)
                        Text(clock(remaining))
                            .font(.system(.largeTitle, design: .monospaced, weight: .black))
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                            .contentTransition(.numericText())
                            .accessibilityLabel(finished ? "Descanso cumplido" : spokenRemaining(remaining))
                        ViewThatFits(in: .horizontal) {
                            HStack(spacing: 9) { timerButtons(paused: paused, finished: finished) }
                            VStack(spacing: 9) { timerButtons(paused: paused, finished: finished) }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                // Al terminar en primer plano no llega ninguna notificación: confirmamos con háptico.
                .sensoryFeedback(.success, trigger: finished) { _, isFinished in
                    isFinished && hapticsEnabled
                }
            }
        }
    }

    @ViewBuilder
    private func timerButtons(paused: Bool, finished: Bool) -> some View {
        Button("+15 s", action: onAdd)
            .buttonStyle(ForjaSecondaryButtonStyle())
            .accessibilityLabel("Añadir 15 segundos")
        Button(paused ? "Seguir" : "Pausa", action: onPauseResume)
            .buttonStyle(ForjaSecondaryButtonStyle())
            .disabled(finished)
            .accessibilityLabel(paused ? "Reanudar descanso" : "Pausar descanso")
        Button(finished ? "Continuar" : "Saltar", action: onSkip)
            .buttonStyle(ForjaSecondaryButtonStyle())
            .accessibilityLabel(finished ? "Cerrar el descanso y continuar" : "Saltar el descanso")
    }

    private func clock(_ seconds: Int) -> String {
        String(format: "%d:%02d", seconds / 60, seconds % 60)
    }

    private func spokenRemaining(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let rest = seconds % 60
        if minutes == 0 { return "\(rest) segundos restantes" }
        if rest == 0 { return "\(minutes) \(minutes == 1 ? "minuto" : "minutos") restantes" }
        return "\(minutes) \(minutes == 1 ? "minuto" : "minutos") y \(rest) segundos restantes"
    }
}

private struct TechniqueSheet: View {
    @Environment(\.dismiss) private var dismiss
    let guide: ExerciseGuide

    var body: some View {
        NavigationStack {
            ForjaPage {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        ForjaSectionTitle(kicker: guide.muscles, title: guide.name, detail: guide.rationale)
                        guideSection("Colocación", values: guide.setup, icon: "figure.stand")
                        guideSection("Ejecución", values: guide.execution, icon: "arrow.down.and.line.horizontal.and.arrow.up")
                        guideSection("Evita", values: guide.mistakes, icon: "exclamationmark.triangle")
                        guideSection("Alternativas", values: guide.alternatives, icon: "arrow.triangle.branch")
                    }
                    .padding(18)
                }
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Cerrar") { dismiss() } }
            }
        }
    }

    private func guideSection(_ title: String, values: [String], icon: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(ForjaTheme.gold)
            ForEach(Array(values.enumerated()), id: \.offset) { index, value in
                HStack(alignment: .top, spacing: 10) {
                    Text("\(index + 1)").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.ember)
                    Text(value).font(.subheadline).foregroundStyle(ForjaTheme.parchment)
                }
            }
        }
    }
}

private struct DiscomfortSheet: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss
    let sessionID: UUID
    let exerciseID: String

    @State private var level = 0
    @State private var note = ""

    var body: some View {
        NavigationStack {
            ForjaPage {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        ForjaSectionTitle(
                            kicker: "Escucha al cuerpo",
                            title: "Molestia o dolor",
                            detail: "Regístralo para adaptar esta sesión y evitar recomendaciones agresivas."
                        )
                        VStack(spacing: 10) {
                            Text("\(level)/10")
                                .font(.forjaDisplay)
                                .accessibilityHidden(true)
                                .foregroundStyle(level > 4 ? ForjaTheme.red : level > 2 ? ForjaTheme.gold : ForjaTheme.green)
                            Slider(value: Binding(get: { Double(level) }, set: { level = Int($0) }), in: 0...10, step: 1)
                                .tint(level > 4 ? ForjaTheme.red : ForjaTheme.gold)
                                .accessibilityLabel("Nivel de molestia")
                                .accessibilityValue("\(level) de 10")
                        }
                        .padding(18)
                        .background(ForjaTheme.coalRaised)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                        TextField("Nota opcional", text: $note, axis: .vertical)
                            .lineLimit(3...6)
                            .padding(14)
                            .background(ForjaTheme.coalRaised)
                            .clipShape(RoundedRectangle(cornerRadius: 12))

                        if level <= 2 {
                            actionButton("Registrar y continuar", action: .continueTraining, tone: ForjaTheme.green)
                        } else if level <= 4 {
                            actionButton("Adaptar carga o recorrido", action: .adapt, tone: ForjaTheme.gold)
                        } else {
                            actionButton("Detener este ejercicio", action: .stop, tone: ForjaTheme.red)
                            actionButton("Adaptar en vez de detener", action: .adapt, tone: ForjaTheme.gold)
                        }
                        Text("FORJA no diagnostica. Si la molestia persiste o empeora, consulta a un fisioterapeuta o médico.")
                            .font(.caption)
                            .foregroundStyle(ForjaTheme.muted)
                    }
                    .padding(18)
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancelar") { dismiss() } }
            }
        }
    }

    private func actionButton(_ title: String, action: DiscomfortAction, tone: Color) -> some View {
        Button(title) {
            Task {
                await model.recordDiscomfort(
                    sessionID: sessionID,
                    exerciseID: exerciseID,
                    level: level,
                    action: action,
                    note: note.isEmpty ? nil : note
                )
                Haptics.warning(enabled: model.activeProfile?.preferences.hapticsEnabled ?? true)
                dismiss()
            }
        }
        .buttonStyle(ForjaPrimaryButtonStyle(tone: tone))
    }
}

private struct MissionSummaryView: View {
    @EnvironmentObject private var model: AppModel
    let session: TrainingSession
    let onDone: () -> Void

    private var title: String {
        switch session.status {
        case .completed: "Misión completada"
        case .adapted: "Misión adaptada"
        case .partial: "Trabajo registrado"
        case .abandoned: "Misión cerrada"
        case .active: "Misión activa"
        }
    }

    var body: some View {
        ForjaPage {
            VStack(spacing: 22) {
                Spacer()
                PixelAvatarView(avatar: model.activeProfile?.avatar ?? AvatarConfiguration())
                    .frame(maxWidth: 140, maxHeight: 210)
                Text(title).font(.forjaScreenTitle).multilineTextAlignment(.center)
                Text(summary)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(ForjaTheme.muted)
                ForjaPill(text: reward, color: ForjaTheme.gold)
                Spacer()
                Button("Volver a la fragua", action: onDone)
                    .buttonStyle(ForjaPrimaryButtonStyle())
            }
            .padding(24)
        }
    }

    private var summary: String {
        switch session.status {
        case .completed: "Completaste el plan previsto con un registro íntegro."
        case .adapted: "Adaptar con cabeza mantiene la adherencia sin fingir trabajo."
        case .partial: "Lo que hiciste cuenta como historial, sin convertirlo en una misión completa."
        case .abandoned: "Las series guardadas siguen en tu historial."
        case .active: "La sesión todavía no está sellada."
        }
    }

    private var reward: String {
        switch session.status {
        case .completed, .adapted: "+60 XP de misión"
        case .partial: "+25 XP de misión parcial"
        case .abandoned, .active: "Sin recompensa de misión"
        }
    }
}
