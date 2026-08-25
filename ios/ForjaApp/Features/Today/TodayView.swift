import SwiftUI

struct TodayView: View {
    @EnvironmentObject private var model: AppModel
    @State private var statistics: ProfileStatistics?
    @State private var showingAllWorkouts = false

    private var profile: UserProfile? { model.activeProfile }

    var body: some View {
        ForjaPage {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    identityHeader
                    missionSection
                    weekContext
                    dailyGuide
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
            }
            .refreshable { await reloadStatistics() }
        }
        .navigationTitle("Hoy")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
        .task { await reloadStatistics() }
        .onChange(of: model.database) { _, _ in Task { await reloadStatistics() } }
        .sheet(isPresented: $showingAllWorkouts) {
            NavigationStack {
                WorkoutPickerView()
            }
        }
    }

    @ViewBuilder
    private var identityHeader: some View {
        if let profile {
            let level = GameRules.level(for: profile.xp)
            HStack(spacing: 16) {
                ZStack {
                    Circle().fill(ForjaTheme.ember.opacity(0.14))
                    PixelAvatarView(avatar: profile.avatar, label: "Avatar de \(profile.name)")
                        .padding(6)
                }
                .frame(width: 84, height: 84)

                VStack(alignment: .leading, spacing: 4) {
                    Text(greeting)
                        .font(.forjaLabel(10))
                        .foregroundStyle(ForjaTheme.ember)
                    Text(profile.name)
                        .font(.forjaCardTitle)
                        .lineLimit(2)
                        .minimumScaleFactor(0.8)
                    Text("Nv. \(level.level) · \(level.title)")
                        .font(.caption)
                        .foregroundStyle(ForjaTheme.muted)
                    ProgressView(value: level.progress)
                        .tint(ForjaTheme.gold)
                        .accessibilityLabel("Progreso hacia el siguiente nivel")
                }
            }
            .accessibilityElement(children: .combine)
        }
    }

    private var weekContext: some View {
        ForjaCard(accent: ForjaTheme.gold.opacity(0.5)) {
            VStack(alignment: .leading, spacing: ForjaSpacing.md) {
                ForjaGroupHeader(title: "Tu semana", detail: "Entrenamiento y recuperación en un vistazo")
                weekStrip
                Divider().overlay(ForjaTheme.parchment.opacity(0.1))
                campaignPulse
            }
        }
    }

    private var weekStrip: some View {
        HStack(spacing: 3) {
            ForEach(Weekday.allCases) { day in
                let schedule = profile.map(PlanBuilder.schedule) ?? [:]
                let hasMission = schedule[day] != nil
                let isToday = day == Weekday.current()
                VStack(spacing: 7) {
                    Text(day.shortTitle)
                        .font(.forjaLabel(10))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    ZStack {
                        Circle()
                            .fill(isToday ? ForjaTheme.ember : ForjaTheme.coalRaised)
                        if hasMission {
                            Image(systemName: "hammer.fill")
                                .font(.caption2)
                                .foregroundStyle(isToday ? ForjaTheme.ink : ForjaTheme.gold)
                        } else {
                            Image(systemName: "flame")
                                .font(.caption2)
                                .foregroundStyle(ForjaTheme.muted.opacity(0.55))
                        }
                    }
                    .frame(width: 30, height: 30)
                }
                .frame(maxWidth: .infinity)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("\(day.title), \(hasMission ? "entrenamiento" : "descanso")\(isToday ? ", hoy" : "")")
            }
        }
        .padding(.top, ForjaSpacing.xs)
    }

    @ViewBuilder
    private var missionSection: some View {
        if let active = model.activeSession {
            ForjaCard(accent: ForjaTheme.ember, prominent: true) {
                VStack(alignment: .leading, spacing: 14) {
                    ForjaPill(text: "Misión activa", color: ForjaTheme.ember)
                    Text(active.prescriptionSnapshot.name)
                        .font(.forjaScreenTitle)
                    Text("Tu sesión sigue exactamente donde la dejaste.")
                        .foregroundStyle(ForjaTheme.muted)
                    NavigationLink {
                        WorkoutView(day: active.prescriptionSnapshot, existingSessionID: active.id)
                    } label: {
                        Label("Continuar misión", systemImage: "play.fill")
                    }
                    .buttonStyle(ForjaPrimaryButtonStyle())
                }
            }
        } else if let day = model.scheduledWorkout() {
            ForjaCard(accent: ForjaTheme.gold, prominent: true) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        ForjaPill(text: "Misión de hoy")
                        Spacer()
                        Text("\(day.durationMin)–\(day.durationMax) min")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(ForjaTheme.muted)
                            .accessibilityLabel("Entre \(day.durationMin) y \(day.durationMax) minutos")
                    }
                    Text(day.name).font(.forjaScreenTitle)
                    Text(day.focus)
                        .font(.subheadline)
                        .foregroundStyle(ForjaTheme.muted)
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 15) {
                            Label("\(day.entries.count) etapas", systemImage: "list.number")
                            Label("\(day.entries.reduce(0) { $0 + $1.sets }) series", systemImage: "square.stack.3d.up.fill")
                        }
                        VStack(alignment: .leading, spacing: 6) {
                            Label("\(day.entries.count) etapas", systemImage: "list.number")
                            Label("\(day.entries.reduce(0) { $0 + $1.sets }) series", systemImage: "square.stack.3d.up.fill")
                        }
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(ForjaTheme.gold)

                    NavigationLink {
                        WorkoutView(day: day)
                    } label: {
                        Label("Comenzar misión", systemImage: "hammer.fill")
                    }
                    .buttonStyle(ForjaPrimaryButtonStyle())
                }
            }
        } else {
            ForjaCard(accent: ForjaTheme.green, prominent: true) {
                VStack(alignment: .leading, spacing: 14) {
                    ForjaPill(text: "Campamento", color: ForjaTheme.green)
                    Text("Hoy se recupera")
                        .font(.forjaScreenTitle)
                    Text("Descansar forma parte del plan y nunca rompe la llama semanal.")
                        .foregroundStyle(ForjaTheme.muted)
                    Button("Entrenar otro día de forma opcional") {
                        showingAllWorkouts = true
                    }
                    .buttonStyle(ForjaSecondaryButtonStyle())
                }
            }
        }
    }

    private var campaignPulse: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("PULSO DE LA SEMANA").font(.forjaLabel(11)).foregroundStyle(ForjaTheme.gold)
                Spacer()
                Text("\(statistics?.currentWeekCompleted ?? 0)/\(statistics?.weeklyTarget ?? profile?.daysPerWeek ?? 0)")
                    .font(.headline.monospacedDigit())
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel(
                "Pulso de la semana: \(statistics?.currentWeekCompleted ?? 0) de \(statistics?.weeklyTarget ?? profile?.daysPerWeek ?? 0) misiones"
            )
            GeometryReader { proxy in
                let target = max(1, statistics?.weeklyTarget ?? 1)
                let done = statistics?.currentWeekCompleted ?? 0
                ZStack(alignment: .leading) {
                    Capsule().fill(ForjaTheme.coalRaised)
                    Capsule().fill(
                        LinearGradient(
                            colors: [ForjaTheme.ember, ForjaTheme.gold],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: proxy.size.width * min(1, CGFloat(done) / CGFloat(target)))
                }
            }
            .frame(height: 12)
            .accessibilityHidden(true)
            Text(weeklyMessage)
                .font(.caption)
                .foregroundStyle(ForjaTheme.muted)
        }
    }

    private var dailyGuide: some View {
        ForjaCard(accent: ForjaTheme.blue) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(ForjaTheme.blue)
                VStack(alignment: .leading, spacing: 5) {
                    Text(personalGuide.title).font(.headline)
                    Text(personalGuide.detail)
                        .font(.subheadline)
                        .foregroundStyle(ForjaTheme.muted)
                    if let placeNotice {
                        Divider().overlay(ForjaTheme.blue.opacity(0.35)).padding(.vertical, 4)
                        Text(placeNotice)
                            .font(.caption)
                            .foregroundStyle(ForjaTheme.gold)
                    }
                }
            }
        }
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 13 { return "BUENOS DÍAS" }
        if hour < 20 { return "BUENAS TARDES" }
        return "BUENAS NOCHES"
    }

    private var weeklyMessage: String {
        guard let statistics else { return "Calculando el calor de la fragua…" }
        if statistics.currentWeekCompleted >= statistics.weeklyTarget {
            return "Objetivo cumplido. La llama está al rojo."
        }
        let remaining = max(0, statistics.weeklyTarget - statistics.currentWeekCompleted)
        return remaining == 1 ? "Queda una misión; todavía hay margen." : "Quedan \(remaining) misiones; sin prisas ni castigos."
    }

    private func reloadStatistics() async {
        statistics = await model.statistics()
    }

    private var personalGuide: (title: String, detail: String) {
        guard let profile else {
            return ("Guía rápida: RIR", "RIR 2 significa que podrías haber hecho unas dos repeticiones limpias más.")
        }
        switch profile.goal {
        case .muscleGain:
            return ("Objetivo: músculo", "Busca repeticiones controladas dentro del rango y progresa solo cuando completes todas las series con el RIR previsto.")
        case .strength:
            return ("Objetivo: fuerza", "La carga importa, pero la repetición válida manda. Mantén técnica y descanso; una sugerencia de subida nunca es obligatoria.")
        case .consistency:
            return ("Objetivo: constancia", "Completar una versión realista vale más que perseguir volumen extra. Una misión adaptada también sostiene la semana.")
        case .recomposition:
            return ("Objetivo: recomposición", "Usa el registro para sostener el entrenamiento. FORJA no convierte el peso corporal ni la comida en una puntuación.")
        case .learnTechnique:
            return ("Objetivo: técnica", "Abre la ficha antes de cada etapa y elige una carga que te permita repetir la misma ejecución sin llegar al fallo.")
        }
    }

    private var placeNotice: String? {
        guard let profile, profile.trainingPlace != .gym else { return nil }
        return "La prescripción actual nació para gimnasio. Consulta las alternativas del Códice; FORJA todavía no sustituye material automáticamente."
    }
}

private struct WorkoutPickerView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ForjaPage {
            List(model.routine.days) { day in
                NavigationLink {
                    WorkoutView(day: day, unscheduled: true)
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(day.name).font(.headline)
                        Text(day.focus).font(.caption).foregroundStyle(ForjaTheme.muted)
                    }
                    .padding(.vertical, 5)
                }
                .listRowBackground(ForjaTheme.coalRaised)
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Misión opcional")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cerrar") { dismiss() }
            }
        }
    }
}
