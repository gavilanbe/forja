import SwiftUI

struct ProgressScreen: View {
    @EnvironmentObject private var model: AppModel
    @State private var statistics: ProfileStatistics?
    @State private var selectedExerciseID: String?

    private var profile: UserProfile? { model.activeProfile }

    var body: some View {
        ForjaPage {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    ForjaSectionTitle(
                        kicker: "Evidencia, no presión",
                        title: "Tu progreso",
                        detail: "El historial muestra lo ocurrido. Las sugerencias nunca cambian una carga por ti."
                    )
                    metrics
                    weeklyChart
                    recentMissions
                    exerciseHistory
                }
                .padding(18)
            }
        }
        .navigationTitle("Progreso")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
        .task {
            statistics = await model.statistics()
            selectedExerciseID = usedExerciseIDs.first
        }
        .onChange(of: model.database) { _, _ in
            Task { statistics = await model.statistics() }
        }
    }

    private var metrics: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 10)], spacing: 10) {
            metric("MISIONES", value: "\((statistics?.completedMissions ?? 0) + (statistics?.adaptedMissions ?? 0))")
            metric("SERIES", value: "\(statistics?.totalSets ?? 0)")
            metric("VOLUMEN", value: compactVolume(statistics?.totalVolumeKg ?? 0))
        }
    }

    private func metric(_ title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.forjaLabel(8)).foregroundStyle(ForjaTheme.muted)
            Text(value).font(.forjaMetric).lineLimit(1).minimumScaleFactor(0.65)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ForjaTheme.coalRaised)
        .clipShape(RoundedRectangle(cornerRadius: 11))
        .accessibilityElement(children: .combine)
    }

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("SERIES POR SEMANA").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
                Spacer()
                Text("Últimas 6").font(.caption).foregroundStyle(ForjaTheme.muted)
            }
            PixelBarChart(data: weeklySets)
        }
        .padding(16)
        .background(ForjaTheme.coalRaised)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private var recentMissions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("MISIONES RECIENTES").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
            if profileSessions.isEmpty {
                Text("Tu primera misión aparecerá aquí, incluso si queda parcial o adaptada.")
                    .font(.subheadline)
                    .foregroundStyle(ForjaTheme.muted)
            } else {
                ForEach(profileSessions.prefix(8)) { session in
                    NavigationLink {
                        SessionHistoryDetail(session: session)
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: statusIcon(session.status))
                                .foregroundStyle(statusColor(session.status))
                                .frame(width: 28)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(session.prescriptionSnapshot.name).font(.headline)
                                Text("\(session.dateKey) · \(setCount(session.id)) series")
                                    .font(.caption)
                                    .foregroundStyle(ForjaTheme.muted)
                            }
                            Spacer()
                            Text(statusTitle(session.status))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(statusColor(session.status))
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(ForjaTheme.muted)
                        }
                        .padding(12)
                        .background(ForjaTheme.coalRaised)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .contentShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder
    private var exerciseHistory: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("HISTORIAL DE EJERCICIO").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
            if usedExerciseIDs.isEmpty {
                ContentUnavailableView(
                    "Aún no hay series",
                    systemImage: "chart.bar",
                    description: Text("Tu primer registro aparecerá aquí.")
                )
                .foregroundStyle(ForjaTheme.muted)
            } else {
                Picker("Ejercicio", selection: $selectedExerciseID) {
                    ForEach(usedExerciseIDs, id: \.self) { id in
                        Text(model.workoutName(id)).tag(Optional(id))
                    }
                }
                .tint(ForjaTheme.gold)
                .padding(12)
                .background(ForjaTheme.coalRaised)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                ForEach(exerciseSets.prefix(12)) { set in
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("\(set.weightKg.formatted(.number.precision(.fractionLength(0...2)))) kg × \(set.reps)")
                                .font(.headline.monospacedDigit())
                            Text(sessionDate(set.sessionID))
                                .font(.caption)
                                .foregroundStyle(ForjaTheme.muted)
                        }
                        Spacer()
                        Text("RIR \(set.rir == 4 ? "4+" : "\(set.rir)")")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(ForjaTheme.gold)
                    }
                    .padding(12)
                    .background(ForjaTheme.coalRaised)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    private var usedExerciseIDs: [String] {
        guard let profile else { return [] }
        let logs = model.database.setLogs.filter { $0.profileID == profile.id }
        var seen = Set<String>()
        return logs.sorted { $0.createdAt > $1.createdAt }.compactMap { seen.insert($0.exerciseID).inserted ? $0.exerciseID : nil }
    }

    private var exerciseSets: [LoggedSet] {
        guard let id = selectedExerciseID, let profile else { return [] }
        return model.database.setLogs
            .filter { $0.profileID == profile.id && $0.exerciseID == id && !$0.skipped }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var profileSessions: [TrainingSession] {
        guard let profile else { return [] }
        return model.database.sessions
            .filter { $0.profileID == profile.id }
            .sorted { $0.startedAt > $1.startedAt }
    }

    private var weeklySets: [PixelBarDatum] {
        guard let profile else { return [] }
        let calendar = Calendar.current
        let thisMonday = ForjaDate.monday(of: Date())
        return (-5...0).map { offset in
            let monday = calendar.date(byAdding: .weekOfYear, value: offset, to: thisMonday) ?? thisMonday
            let end = ForjaDate.addingDays(7, to: monday)
            let count = model.database.setLogs.filter {
                $0.profileID == profile.id && $0.createdAt >= monday && $0.createdAt < end && !$0.skipped
            }.count
            let label = offset == 0 ? "AHORA" : "S\(offset + 6)"
            return PixelBarDatum(label: label, value: Double(count))
        }
    }

    private func sessionDate(_ id: UUID) -> String {
        guard let session = model.database.sessions.first(where: { $0.id == id }) else { return "" }
        return session.dateKey
    }

    private func compactVolume(_ value: Double) -> String {
        if value >= 1_000 { return "\((value / 1_000).formatted(.number.precision(.fractionLength(1))))k" }
        return "\(Int(value))"
    }

    private func setCount(_ sessionID: UUID) -> Int {
        model.database.setLogs.filter { $0.sessionID == sessionID && !$0.skipped }.count
    }

    private func statusTitle(_ status: SessionStatus) -> String {
        switch status {
        case .active: "Activa"
        case .completed: "Completa"
        case .adapted: "Adaptada"
        case .partial: "Parcial"
        case .abandoned: "Abandonada"
        }
    }

    private func statusIcon(_ status: SessionStatus) -> String {
        switch status {
        case .active: "play.circle.fill"
        case .completed: "checkmark.seal.fill"
        case .adapted: "shield.checkered"
        case .partial: "circle.lefthalf.filled"
        case .abandoned: "xmark.circle.fill"
        }
    }

    private func statusColor(_ status: SessionStatus) -> Color {
        switch status {
        case .active: ForjaTheme.ember
        case .completed: ForjaTheme.green
        case .adapted: ForjaTheme.blue
        case .partial: ForjaTheme.gold
        case .abandoned: ForjaTheme.red
        }
    }
}

private struct SessionHistoryDetail: View {
    @EnvironmentObject private var model: AppModel
    let session: TrainingSession

    private var logs: [LoggedSet] {
        model.database.setLogs
            .filter { $0.sessionID == session.id }
            .sorted {
                if $0.exerciseID == $1.exerciseID { return $0.setNumber < $1.setNumber }
                return $0.createdAt < $1.createdAt
            }
    }

    private var discomforts: [DiscomfortRecord] {
        model.database.discomforts
            .filter { $0.sessionID == session.id }
            .sorted { $0.createdAt < $1.createdAt }
    }

    var body: some View {
        ForjaPage {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    ForjaSectionTitle(
                        kicker: "Semana \(session.campaignWeek) · \(session.dateKey)",
                        title: session.prescriptionSnapshot.name,
                        detail: session.prescriptionSnapshot.focus
                    )

                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 88), spacing: 10)], spacing: 10) {
                        summaryMetric("SERIES", "\(logs.filter { !$0.skipped }.count)")
                        summaryMetric("VOLUMEN", compactVolume)
                        summaryMetric("TIPO", session.unscheduled ? "Libre" : "Plan")
                    }

                    ForEach(session.prescriptionSnapshot.entries) { entry in
                        let exerciseLogs = logs.filter { $0.exerciseID == entry.exerciseID }
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(model.workoutName(entry.exerciseID)).font(.headline)
                                Spacer()
                                Text("\(exerciseLogs.filter { !$0.skipped }.count)/\(entry.sets)")
                                    .font(.caption.monospacedDigit())
                                    .foregroundStyle(ForjaTheme.gold)
                            }
                            if exerciseLogs.isEmpty {
                                Text("Sin series registradas")
                                    .font(.caption)
                                    .foregroundStyle(ForjaTheme.muted)
                            } else {
                                ForEach(exerciseLogs) { set in
                                    HStack {
                                        Text("#\(set.setNumber)").font(.forjaLabel(9))
                                        if set.skipped {
                                            Text("Omitida\(set.skipReason.map { ": \($0)" } ?? "")")
                                                .foregroundStyle(ForjaTheme.muted)
                                        } else {
                                            Text("\(set.weightKg.formatted(.number.precision(.fractionLength(0...2)))) kg × \(set.reps)")
                                                .font(.body.monospacedDigit())
                                            Spacer()
                                            Text("RIR \(set.rir == 4 ? "4+" : "\(set.rir)")")
                                                .font(.caption)
                                                .foregroundStyle(ForjaTheme.muted)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(14)
                        .background(ForjaTheme.coalRaised)
                        .clipShape(RoundedRectangle(cornerRadius: 11))
                    }

                    if !discomforts.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("ADAPTACIONES REGISTRADAS")
                                .font(.forjaLabel(10))
                                .foregroundStyle(ForjaTheme.blue)
                            ForEach(discomforts) { item in
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("\(model.workoutName(item.exerciseID)) · nivel \(item.level)/10")
                                        .font(.headline)
                                    Text(discomfortText(item))
                                        .font(.caption)
                                        .foregroundStyle(ForjaTheme.muted)
                                }
                            }
                        }
                    }
                }
                .padding(18)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Detalle")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
    }

    private func summaryMetric(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label).font(.forjaLabel(8)).foregroundStyle(ForjaTheme.muted)
            Text(value).font(.headline).lineLimit(1).minimumScaleFactor(0.65)
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ForjaTheme.coalRaised)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .accessibilityElement(children: .combine)
    }

    private var compactVolume: String {
        let volume = logs.filter { !$0.skipped }.reduce(0) { $0 + $1.weightKg * Double($1.reps) }
        if volume >= 1_000 {
            return "\((volume / 1_000).formatted(.number.precision(.fractionLength(1))))k"
        }
        return "\(Int(volume))"
    }

    private func discomfortText(_ item: DiscomfortRecord) -> String {
        let action: String
        switch item.action {
        case .continueTraining: action = "Continuó con atención"
        case .adapt: action = "Adaptó la etapa"
        case .stop: action = "Detuvo la etapa"
        }
        guard let note = item.note, !note.isEmpty else { return action }
        return "\(action) · \(note)"
    }
}
