import SwiftUI

struct CampaignView: View {
    @EnvironmentObject private var model: AppModel

    private var profile: UserProfile? { model.activeProfile }
    private var currentWeek: Int {
        guard let profile else { return 1 }
        return ForjaDate.campaignWeek(start: profile.campaignStart, on: Date())
    }

    var body: some View {
        ForjaPage {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    campaignHeader
                    chapterPath
                    campaignRules
                }
                .padding(18)
            }
        }
        .navigationTitle("Campaña")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
    }

    private var campaignHeader: some View {
        ForjaCard(accent: ForjaTheme.ember) {
            HStack(spacing: 18) {
                PixelFlameView(intensity: weekCompletion)
                VStack(alignment: .leading, spacing: 5) {
                    Text(currentWeek <= 6 ? "CAPÍTULO \(currentWeek) DE 6" : "BLOQUE FORJADO")
                        .font(.forjaLabel(10))
                        .foregroundStyle(ForjaTheme.ember)
                    Text(currentChapter?.title ?? "La forja continúa")
                        .font(.forjaCardTitle)
                    Text(currentChapter?.detail ?? "Revisa el bloque y decide el siguiente paso sin máximos obligatorios.")
                        .font(.caption)
                        .foregroundStyle(ForjaTheme.muted)
                }
            }
        }
    }

    private var chapterPath: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("MAPA DE LA FORJA")
                .font(.forjaLabel(11))
                .foregroundStyle(ForjaTheme.gold)
                .padding(.bottom, 14)
            ForEach(model.routine.chapters) { chapter in
                let completed = completion(for: chapter.week)
                let isCurrent = chapter.week == currentWeek
                HStack(alignment: .top, spacing: 14) {
                    VStack(spacing: 0) {
                        ZStack {
                            Circle()
                                .fill(completed >= 1 ? ForjaTheme.ember : isCurrent ? ForjaTheme.gold : ForjaTheme.coalRaised)
                                .frame(width: 38, height: 38)
                            Text("\(chapter.week)")
                                .font(.forjaLabel(11))
                                .foregroundStyle(completed >= 1 || isCurrent ? ForjaTheme.ink : ForjaTheme.muted)
                        }
                        if chapter.week < model.routine.chapters.count {
                            Rectangle()
                                .fill(completed >= 1 ? ForjaTheme.ember.opacity(0.55) : ForjaTheme.coalRaised)
                                .frame(width: 3, height: 65)
                        }
                    }
                    VStack(alignment: .leading, spacing: 5) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(chapter.title).font(.headline)
                            if isCurrent { ForjaPill(text: "Ahora", color: ForjaTheme.gold) }
                        }
                        Text(chapter.detail).font(.caption).foregroundStyle(ForjaTheme.muted)
                        let count = completedMissions(week: chapter.week)
                        Text("\(count)/\(profile?.daysPerWeek ?? 0) misiones")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(completed >= 1 ? ForjaTheme.green : ForjaTheme.muted)
                    }
                    .padding(.top, 3)
                    Spacer(minLength: 0)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel(
                    "Capítulo \(chapter.week), \(chapter.title)\(isCurrent ? ", ahora" : ""). \(completedMissions(week: chapter.week)) de \(profile?.daysPerWeek ?? 0) misiones. \(chapter.detail)"
                )
            }
        }
    }

    private var campaignRules: some View {
        ForjaCard(accent: ForjaTheme.green) {
            VStack(alignment: .leading, spacing: 8) {
                Text("LA LLAMA ES SEMANAL").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.green)
                Text("Los días de campamento nunca rompen la racha. Una misión adaptada por molestia conserva la adherencia. El volumen extra no da ventaja.")
                    .font(.subheadline)
                    .foregroundStyle(ForjaTheme.muted)
            }
        }
    }

    private var currentChapter: CampaignChapter? {
        model.routine.chapters.first(where: { $0.week == currentWeek })
    }

    private var weekCompletion: Double {
        guard let target = profile?.daysPerWeek, target > 0 else { return 0 }
        return min(1, Double(completedMissions(week: currentWeek)) / Double(target))
    }

    private func completion(for week: Int) -> Double {
        guard let target = profile?.daysPerWeek, target > 0 else { return 0 }
        return min(1, Double(completedMissions(week: week)) / Double(target))
    }

    private func completedMissions(week: Int) -> Int {
        guard let profile else { return 0 }
        return model.database.sessions.filter {
            $0.profileID == profile.id &&
                $0.campaignWeek == week &&
                !$0.unscheduled &&
                ($0.status == .completed || $0.status == .adapted)
        }.count
    }
}
