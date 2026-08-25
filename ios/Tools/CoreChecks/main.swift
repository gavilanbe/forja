import Darwin
import Foundation
import ForjaCore

private struct CheckFailure: Error, CustomStringConvertible {
    let description: String
}

@main
enum ForjaCoreChecks {
    static func main() async {
        do {
            try checkBundledContent()
            try checkPlanAndLevels()
            try checkAbsoluteTimer()
            try await checkStoreIdempotencyAndCompletion()
            try await checkMissingExerciseStaysPartial()
            try await checkDeletionReconcilesXP()
            try checkBackupRoundTrip()
            print("FORJA core checks: 7/7 OK")
        } catch {
            fputs("FORJA core checks failed: \(error)\n", stderr)
            exit(1)
        }
    }

    private static func checkBundledContent() throws {
        let base = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
            .appendingPathComponent("ForjaApp/Resources", isDirectory: true)
        let routine = try ContentLoader.routine(
            from: Data(contentsOf: base.appendingPathComponent("routine.json"))
        )
        let codex = try ContentLoader.codex(
            from: Data(contentsOf: base.appendingPathComponent("codex.json"))
        )
        let guideIDs = Set(codex.map(\.id))
        let prescribedIDs = Set(routine.days.flatMap(\.entries).map(\.exerciseID))
        try require(routine.days.count == 5, "La rutina importada no contiene sus cinco días")
        try require(codex.count == 33, "El Códice importado no contiene sus 33 fichas")
        try require(prescribedIDs.isSubset(of: guideIDs), "Hay ejercicios prescritos sin ficha en el Códice")
    }

    private static func checkPlanAndLevels() throws {
        let profile = makeProfile(
            days: 4,
            preferred: [.monday, .tuesday, .thursday, .saturday]
        )
        let schedule = PlanBuilder.schedule(for: profile)
        try require(schedule[.monday] == "torso-a", "El lunes no conserva torso-a")
        try require(schedule[.saturday] == "tiron", "El sábado no conserva tirón")
        try require(schedule[.friday] == nil, "Se creó una misión en un día no elegido")
        try require(GameRules.level(for: 119).level == 1, "Nivel incorrecto antes de 120 XP")
        try require(GameRules.level(for: 120).level == 2, "Nivel incorrecto en 120 XP")
    }

    private static func checkAbsoluteTimer() throws {
        let now = Date(timeIntervalSince1970: 1_000)
        var timer = RestTimerState(
            sessionID: UUID(),
            exerciseID: "press",
            totalSeconds: 90,
            targetEndAt: now.addingTimeInterval(90),
            pausedRemainingSeconds: nil
        )
        try require(timer.remainingSeconds(at: now.addingTimeInterval(30)) == 60, "El temporizador no usa una fecha absoluta")
        timer.pausedRemainingSeconds = 42
        try require(timer.remainingSeconds(at: now.addingTimeInterval(500)) == 42, "La pausa del temporizador no es estable")
    }

    private static func checkStoreIdempotencyAndCompletion() async throws {
        let store = ForjaStore()
        let profile = makeProfile()
        try await store.createProfile(profile)
        let session = try await store.startSession(profileID: profile.id, day: makeDay())
        let first = LogSetRequest(exerciseID: "press", setNumber: 1, weightKg: 40, reps: 10, rir: 2)
        _ = try await store.logSet(sessionID: session.id, request: first)
        _ = try await store.logSet(sessionID: session.id, request: first)
        for number in 2...3 {
            _ = try await store.logSet(
                sessionID: session.id,
                request: LogSetRequest(exerciseID: "press", setNumber: number, weightKg: 40, reps: 10, rir: 2)
            )
        }
        let sealed = try await store.completeSession(session.id)
        let snapshot = await store.snapshot()
        try require(snapshot.setLogs.count == 3, "Una doble pulsación duplicó una serie")
        try require(sealed.status == .completed, "La misión completa no quedó sellada")
        try require(snapshot.profiles.first?.xp == 90, "El XP no es 3 x 10 + 60")
    }

    private static func checkMissingExerciseStaysPartial() async throws {
        let store = ForjaStore()
        let profile = makeProfile()
        try await store.createProfile(profile)
        var day = makeDay()
        day.entries.append(makePrescription(id: "row", sets: 1))
        let session = try await store.startSession(profileID: profile.id, day: day)
        for number in 1...4 {
            _ = try await store.logSet(
                sessionID: session.id,
                request: LogSetRequest(exerciseID: "press", setNumber: number, weightKg: 40, reps: 10, rir: 2)
            )
        }
        let sealed = try await store.completeSession(session.id)
        try require(sealed.status == .partial, "Las series extra ocultaron un ejercicio sin registrar")
    }

    private static func checkDeletionReconcilesXP() async throws {
        let store = ForjaStore()
        let profile = makeProfile()
        try await store.createProfile(profile)
        let session = try await store.startSession(profileID: profile.id, day: makeDay())
        var records: [LoggedSet] = []
        for number in 1...3 {
            records.append(
                try await store.logSet(
                    sessionID: session.id,
                    request: LogSetRequest(exerciseID: "press", setNumber: number, weightKg: 40, reps: 10, rir: 2)
                )
            )
        }
        try await store.deleteSet(records[1].id)
        let snapshot = await store.snapshot()
        try require(snapshot.setLogs.map(\.setNumber).sorted() == [1, 2], "Las series no se renumeraron tras borrar")
        try require(snapshot.profiles.first?.xp == 20, "El XP no se reconcilió tras borrar")
    }

    private static func checkBackupRoundTrip() throws {
        let database = ForjaDatabase(profiles: [makeProfile()])
        let data = try BackupService.export(database, now: Date(timeIntervalSince1970: 10))
        let imported = try BackupService.importBackup(
            data,
            routine: RoutineContent(version: "1", days: [], schedules: [], campaignWeeks: 6, chapters: [])
        )
        try require(imported.database == database, "La copia nativa no completa un viaje de ida y vuelta")
    }

    private static func makeProfile(
        days: Int = 3,
        preferred: [Weekday] = [.monday, .wednesday, .friday]
    ) -> UserProfile {
        UserProfile(
            name: "Alex",
            goal: .muscleGain,
            experience: .beginner,
            trainingPlace: .gym,
            daysPerWeek: days,
            preferredDays: preferred,
            preferredSessionMinutes: 75,
            avatar: AvatarConfiguration(),
            campaignStart: Date(timeIntervalSince1970: 0),
            createdAt: Date(timeIntervalSince1970: 0)
        )
    }

    private static func makeDay() -> WorkoutDay {
        WorkoutDay(
            id: "test",
            name: "Test",
            focus: "Test",
            durationMin: 30,
            durationMax: 40,
            entries: [makePrescription(id: "press", sets: 3)]
        )
    }

    private static func makePrescription(id: String, sets: Int) -> ExercisePrescription {
        ExercisePrescription(
            exerciseID: id,
            sets: sets,
            perSide: nil,
            repMin: 6,
            repMax: 10,
            rirPerSet: (0..<sets).map { _ in SetPrescription(rir: RIRRange(min: 2)) },
            restMinSec: 120,
            restMaxSec: 180,
            restNote: nil,
            note: nil
        )
    }

    private static func require(_ condition: @autoclosure () -> Bool, _ message: String) throws {
        guard condition() else { throw CheckFailure(description: message) }
    }
}
