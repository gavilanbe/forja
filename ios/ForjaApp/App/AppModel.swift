import Foundation
import SwiftUI

@MainActor
final class AppModel: ObservableObject {
    enum Phase: Equatable {
        case loading
        case ready
        case failed(String)
    }

    @Published private(set) var phase: Phase = .loading
    @Published private(set) var database = ForjaDatabase()
    @Published private(set) var routine = RoutineContent(
        version: "1.0.0",
        days: [],
        schedules: [],
        campaignWeeks: 6,
        chapters: []
    )
    @Published private(set) var guides: [ExerciseGuide] = []
    @Published var presentedError: String?
    @Published var importMessage: String?

    let store: ForjaStore

    init(fileURL: URL = ForjaStore.defaultFileURL()) {
#if DEBUG
        let resolvedFileURL: URL? = Self.isScreenshotDemoEnabled ? nil : fileURL
#else
        let resolvedFileURL: URL? = fileURL
#endif
        self.store = ForjaStore(fileURL: resolvedFileURL)
        loadBundledContent()
    }

    var activeProfile: UserProfile? {
        guard let id = database.activeProfileID else { return database.profiles.first }
        return database.profiles.first(where: { $0.id == id }) ?? database.profiles.first
    }

    var needsOnboarding: Bool { database.profiles.isEmpty }

    var activeSession: TrainingSession? {
        guard let profileID = activeProfile?.id else { return nil }
        return database.sessions
            .filter { $0.profileID == profileID && $0.status == .active }
            .sorted { $0.startedAt > $1.startedAt }
            .first
    }

    func bootstrap() async {
        do {
#if DEBUG
            if Self.isScreenshotDemoEnabled {
                try await seedScreenshotDemo()
                database = await store.snapshot()
                phase = .ready
                return
            }
#endif
            try await store.load()
            database = await store.snapshot()
            phase = .ready
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    func retryBootstrap() async {
        phase = .loading
        await bootstrap()
    }

    func scheduledWorkout(on date: Date = Date()) -> WorkoutDay? {
        guard let profile = activeProfile else { return nil }
        let schedule = PlanBuilder.schedule(for: profile)
        guard let dayID = schedule[Weekday.current(date: date)] else { return nil }
        return routine.days.first(where: { $0.id == dayID })
    }

    func workoutName(_ exerciseID: String) -> String {
        guides.first(where: { $0.id == exerciseID })?.name
            ?? exerciseID.replacingOccurrences(of: "-", with: " ").capitalized
    }

    func guide(_ exerciseID: String) -> ExerciseGuide? {
        guides.first(where: { $0.id == exerciseID })
    }

    func createProfile(_ profile: UserProfile) async -> Bool {
        do {
            _ = try await store.createProfile(profile)
            await refresh()
            return true
        } catch {
            presentedError = error.localizedDescription
            return false
        }
    }

    func updateProfile(_ profile: UserProfile) async -> Bool {
        do {
            try await store.updateProfile(profile)
            await refresh()
            return true
        } catch {
            presentedError = error.localizedDescription
            return false
        }
    }

    func selectProfile(_ id: UUID) async {
        do {
            try await store.selectProfile(id)
            await refresh()
        } catch {
            presentedError = error.localizedDescription
        }
    }

    func deleteProfile(_ id: UUID) async -> Bool {
        do {
            try await store.deleteProfile(id)
            await refresh()
            return true
        } catch {
            presentedError = error.localizedDescription
            return false
        }
    }

    func startSession(day: WorkoutDay, unscheduled: Bool = false) async -> TrainingSession? {
        guard let profile = activeProfile else { return nil }
        do {
            let session = try await store.startSession(
                profileID: profile.id,
                day: day,
                unscheduled: unscheduled
            )
            await refresh()
            return session
        } catch {
            presentedError = error.localizedDescription
            return nil
        }
    }

    func logSet(sessionID: UUID, request: LogSetRequest) async -> LoggedSet? {
        do {
            let record = try await store.logSet(sessionID: sessionID, request: request)
            await refresh()
            return record
        } catch {
            presentedError = error.localizedDescription
            return nil
        }
    }

    func setCurrentExercise(sessionID: UUID, index: Int) async {
        do {
            try await store.updateSessionExercise(sessionID: sessionID, index: index)
            await refresh()
        } catch {
            presentedError = error.localizedDescription
        }
    }

    func deleteSet(_ id: UUID) async {
        do {
            try await store.deleteSet(id)
            await refresh()
        } catch {
            presentedError = error.localizedDescription
        }
    }

    func recordDiscomfort(
        sessionID: UUID,
        exerciseID: String,
        level: Int,
        action: DiscomfortAction,
        note: String?
    ) async {
        do {
            try await store.recordDiscomfort(
                sessionID: sessionID,
                exerciseID: exerciseID,
                level: level,
                action: action,
                note: note
            )
            await refresh()
        } catch {
            presentedError = error.localizedDescription
        }
    }

    func completeSession(_ id: UUID, abandon: Bool = false) async -> TrainingSession? {
        do {
            let session = try await store.completeSession(id, abandon: abandon)
            await refresh()
            return session
        } catch {
            presentedError = error.localizedDescription
            return nil
        }
    }

    func saveTimer(_ timer: RestTimerState?) async {
        do {
            try await store.saveTimer(timer)
            await refresh()
        } catch {
            presentedError = error.localizedDescription
        }
    }

    func statistics(now: Date = Date()) async -> ProfileStatistics? {
        guard let id = activeProfile?.id else { return nil }
        return await store.statistics(profileID: id, now: now)
    }

    func exportBackup() async -> ForjaBackupDocument? {
        do {
            let snapshot = await store.snapshot()
            return ForjaBackupDocument(data: try BackupService.export(snapshot))
        } catch {
            presentedError = error.localizedDescription
            return nil
        }
    }

    func importBackup(_ data: Data) async -> Bool {
        do {
            let imported = try BackupService.importBackup(data, routine: routine)
            try await store.replace(with: imported.database)
            await refresh()
            importMessage = "Importada \(imported.summary.source): \(imported.summary.profiles) perfiles, \(imported.summary.sessions) sesiones y \(imported.summary.sets) series."
            return true
        } catch {
            presentedError = error.localizedDescription
            return false
        }
    }

    private func refresh() async {
        database = await store.snapshot()
    }

#if DEBUG
    private static var isScreenshotDemoEnabled: Bool {
        ProcessInfo.processInfo.arguments.contains("-forja-ui-demo")
    }

    private func seedScreenshotDemo() async throws {
        let now = Date()
        let calendar = Calendar(identifier: .gregorian)
        let campaignStart = calendar.date(byAdding: .day, value: -18, to: now) ?? now
        let profile = UserProfile(
            name: "Alex",
            goal: .consistency,
            experience: .intermediate,
            trainingPlace: .gym,
            daysPerWeek: 5,
            preferredDays: [.monday, .tuesday, .wednesday, .thursday, .friday],
            preferredSessionMinutes: 70,
            avatar: AvatarConfiguration(
                body: .strong,
                skinToneID: "skin-03",
                hair: .fade,
                hairColorID: "hair-02",
                outfit: .smith,
                outfitColorID: "cloth-ember",
                armor: .leather,
                accessory: .headband,
                aura: .ember
            ),
            preferences: ProfilePreferences(reducedMotion: true),
            xp: 240,
            campaignStart: campaignStart,
            createdAt: campaignStart
        )
        let campaign = CampaignRecord(
            profileID: profile.id,
            startDate: campaignStart,
            joinedDate: campaignStart,
            routineVersion: routine.version,
            scheduleID: "custom-5",
            weeklyTarget: 5
        )
        var sessions: [TrainingSession] = []
        var setLogs: [LoggedSet] = []

        for (index, dayOffset) in [-9, -5, -2].enumerated() where !routine.days.isEmpty {
            let date = calendar.date(byAdding: .day, value: dayOffset, to: now) ?? now
            let day = routine.days[index % routine.days.count]
            let session = TrainingSession(
                profileID: profile.id,
                campaignID: campaign.id,
                dayID: day.id,
                dateKey: ForjaDate.dateKey(date),
                campaignWeek: ForjaDate.campaignWeek(start: campaignStart, on: date),
                status: .completed,
                startedAt: date,
                completedAt: calendar.date(byAdding: .minute, value: 70, to: date),
                currentExerciseIndex: day.entries.count,
                prescriptionSnapshot: day
            )
            sessions.append(session)

            for entry in day.entries {
                for setNumber in 1...max(1, entry.sets) {
                    setLogs.append(
                        LoggedSet(
                            profileID: profile.id,
                            sessionID: session.id,
                            exerciseID: entry.exerciseID,
                            setNumber: setNumber,
                            weightKg: Double(20 + index * 5),
                            reps: max(1, entry.repMin),
                            rir: 2,
                            createdAt: date
                        )
                    )
                }
            }
        }

        try await store.replace(
            with: ForjaDatabase(
                profiles: [profile],
                campaigns: [campaign],
                sessions: sessions,
                setLogs: setLogs,
                activeProfileID: profile.id
            )
        )
    }
#endif

    private func loadBundledContent() {
        do {
            if let routineURL = Bundle.main.url(forResource: "routine", withExtension: "json") {
                routine = try ContentLoader.routine(from: Data(contentsOf: routineURL))
            }
            if let codexURL = Bundle.main.url(forResource: "codex", withExtension: "json") {
                guides = try ContentLoader.codex(from: Data(contentsOf: codexURL))
            }
        } catch {
            phase = .failed("No se pudieron cargar la rutina y el códice: \(error.localizedDescription)")
        }
    }
}
