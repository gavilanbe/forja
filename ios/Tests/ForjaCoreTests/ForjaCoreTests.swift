import XCTest
@testable import ForjaCore

final class ForjaCoreTests: XCTestCase {
    func testPlanBuilderUsesChosenDaysWithoutHardcodedPeople() {
        let profile = makeProfile(
            days: 4,
            preferred: [.monday, .tuesday, .thursday, .saturday]
        )

        let schedule = PlanBuilder.schedule(for: profile)

        XCTAssertEqual(schedule[.monday], "torso-a")
        XCTAssertEqual(schedule[.tuesday], "pierna-a")
        XCTAssertEqual(schedule[.thursday], "empuje")
        XCTAssertEqual(schedule[.saturday], "tiron")
        XCTAssertNil(schedule[.friday])
    }

    func testLevelProgressionMatchesWebRules() {
        XCTAssertEqual(GameRules.level(for: 0).level, 1)
        XCTAssertEqual(GameRules.level(for: 119).level, 1)
        XCTAssertEqual(GameRules.level(for: 120).level, 2)
        XCTAssertEqual(GameRules.level(for: 360).level, 3)
    }

    func testTimerUsesAbsoluteEndDateAndPause() {
        let now = Date(timeIntervalSince1970: 1_000)
        let timer = RestTimerState(
            sessionID: UUID(),
            exerciseID: "press",
            totalSeconds: 90,
            targetEndAt: now.addingTimeInterval(90),
            pausedRemainingSeconds: nil
        )
        XCTAssertEqual(timer.remainingSeconds(at: now), 90)
        XCTAssertEqual(timer.remainingSeconds(at: now.addingTimeInterval(30)), 60)

        var paused = timer
        paused.pausedRemainingSeconds = 42
        XCTAssertEqual(paused.remainingSeconds(at: now.addingTimeInterval(500)), 42)
    }

    func testProgressionNeverAppliesChangeAndBlocksIncreaseAfterDiscomfort() {
        let prescription = makeDay().entries[0]
        let sessionID = UUID()
        let sets = (1...3).map {
            LoggedSet(
                profileID: UUID(),
                sessionID: sessionID,
                exerciseID: prescription.exerciseID,
                setNumber: $0,
                weightKg: 40,
                reps: 10,
                rir: 2
            )
        }
        let suggestion = ProgressionEngine.suggest(
            prescription: prescription,
            previousSets: sets,
            hasActiveDiscomfort: false,
            incrementKg: 2.5
        )
        XCTAssertEqual(suggestion.kind, .increase)
        XCTAssertEqual(suggestion.weightKg, 42.5)

        let safeSuggestion = ProgressionEngine.suggest(
            prescription: prescription,
            previousSets: sets,
            hasActiveDiscomfort: true,
            incrementKg: 2.5
        )
        XCTAssertEqual(safeSuggestion.kind, .discomfort)
        XCTAssertNil(safeSuggestion.weightKg)
    }

    func testStoreAwardsPlannedSetOnlyOnceAndCompletesMission() async throws {
        let store = ForjaStore()
        let profile = makeProfile(days: 3, preferred: [.monday, .wednesday, .friday])
        try await store.createProfile(profile)
        let day = makeDay()
        let session = try await store.startSession(profileID: profile.id, day: day)

        let request = LogSetRequest(
            exerciseID: "press",
            setNumber: 1,
            weightKg: 40,
            reps: 10,
            rir: 2
        )
        _ = try await store.logSet(sessionID: session.id, request: request)
        _ = try await store.logSet(sessionID: session.id, request: request)

        var snapshot = await store.snapshot()
        XCTAssertEqual(snapshot.gameEvents.filter { $0.kind == .plannedSet }.count, 1)
        XCTAssertEqual(snapshot.setLogs.count, 1)
        XCTAssertEqual(snapshot.profiles.first?.xp, XPReward.plannedSet)

        _ = try await store.logSet(
            sessionID: session.id,
            request: LogSetRequest(exerciseID: "press", setNumber: 2, weightKg: 40, reps: 10, rir: 2)
        )
        _ = try await store.logSet(
            sessionID: session.id,
            request: LogSetRequest(exerciseID: "press", setNumber: 3, weightKg: 40, reps: 10, rir: 2)
        )
        let sealed = try await store.completeSession(session.id)
        snapshot = await store.snapshot()

        XCTAssertEqual(sealed.status, .completed)
        XCTAssertEqual(snapshot.gameEvents.filter { $0.kind == .completedMission }.count, 1)
        XCTAssertEqual(snapshot.profiles.first?.xp, 90) // 3 × 10 + 60
    }

    func testSessionCannotCompleteByReplacingAMissingExerciseWithExtraSets() async throws {
        let store = ForjaStore()
        let profile = makeProfile()
        try await store.createProfile(profile)
        var day = makeDay()
        day.entries.append(
            ExercisePrescription(
                exerciseID: "row",
                sets: 1,
                perSide: nil,
                repMin: 8,
                repMax: 12,
                rirPerSet: [SetPrescription(rir: RIRRange(min: 2))],
                restMinSec: 90,
                restMaxSec: 120,
                restNote: nil,
                note: nil
            )
        )
        let session = try await store.startSession(profileID: profile.id, day: day)

        for number in 1...4 {
            _ = try await store.logSet(
                sessionID: session.id,
                request: LogSetRequest(
                    exerciseID: "press",
                    setNumber: number,
                    weightKg: 40,
                    reps: 10,
                    rir: 2
                )
            )
        }

        let sealed = try await store.completeSession(session.id)
        XCTAssertEqual(sealed.status, .partial)
    }

    func testDeletingASetRenumbersItsExerciseAndReconcilesXP() async throws {
        let store = ForjaStore()
        let profile = makeProfile()
        try await store.createProfile(profile)
        let session = try await store.startSession(profileID: profile.id, day: makeDay())
        var records: [LoggedSet] = []
        for number in 1...3 {
            records.append(
                try await store.logSet(
                    sessionID: session.id,
                    request: LogSetRequest(
                        exerciseID: "press",
                        setNumber: number,
                        weightKg: 40,
                        reps: 10,
                        rir: 2
                    )
                )
            )
        }

        try await store.deleteSet(records[1].id)
        let snapshot = await store.snapshot()

        XCTAssertEqual(snapshot.setLogs.map(\.setNumber).sorted(), [1, 2])
        XCTAssertEqual(snapshot.gameEvents.filter { $0.kind == .plannedSet }.count, 2)
        XCTAssertEqual(snapshot.profiles.first?.xp, 2 * XPReward.plannedSet)
    }

    func testDeletingProfileRemovesRelatedTrainingDataAndSelectsRemainingProfile() async throws {
        let store = ForjaStore()
        let deletedProfile = makeProfile()
        let remainingProfile = makeProfile(days: 4, preferred: [.monday, .tuesday, .thursday, .saturday])
        try await store.createProfile(deletedProfile)
        try await store.createProfile(remainingProfile)

        let session = try await store.startSession(profileID: deletedProfile.id, day: makeDay())
        _ = try await store.logSet(
            sessionID: session.id,
            request: LogSetRequest(exerciseID: "press", setNumber: 1, weightKg: 40, reps: 10, rir: 2)
        )
        try await store.recordDiscomfort(
            sessionID: session.id,
            exerciseID: "press",
            level: 3,
            action: .adapt,
            note: "Reducir carga"
        )
        try await store.saveNote(
            profileID: deletedProfile.id,
            sessionID: session.id,
            exerciseID: "press",
            text: "Nota temporal"
        )
        try await store.saveTimer(
            RestTimerState(
                sessionID: session.id,
                exerciseID: "press",
                totalSeconds: 90,
                targetEndAt: Date().addingTimeInterval(90),
                pausedRemainingSeconds: nil
            )
        )
        try await store.selectProfile(deletedProfile.id)

        try await store.deleteProfile(deletedProfile.id)
        let snapshot = await store.snapshot()

        XCTAssertEqual(snapshot.profiles.map(\.id), [remainingProfile.id])
        XCTAssertEqual(snapshot.activeProfileID, remainingProfile.id)
        XCTAssertFalse(snapshot.campaigns.contains { $0.profileID == deletedProfile.id })
        XCTAssertFalse(snapshot.sessions.contains { $0.profileID == deletedProfile.id })
        XCTAssertFalse(snapshot.setLogs.contains { $0.profileID == deletedProfile.id })
        XCTAssertFalse(snapshot.discomforts.contains { $0.profileID == deletedProfile.id })
        XCTAssertFalse(snapshot.gameEvents.contains { $0.profileID == deletedProfile.id })
        XCTAssertFalse(snapshot.notes.contains { $0.profileID == deletedProfile.id })
        XCTAssertNil(snapshot.activeTimer)
    }

    func testNativeBackupRoundTrip() throws {
        let original = ForjaDatabase(profiles: [makeProfile()])
        let data = try BackupService.export(original, now: Date(timeIntervalSince1970: 10))
        let imported = try BackupService.importBackup(
            data,
            routine: RoutineContent(version: "1", days: [], schedules: [], campaignWeeks: 6, chapters: [])
        )
        XCTAssertEqual(imported.database, original)
        XCTAssertEqual(imported.summary.source, "FORJA iOS")
    }

    func testMinimalPWABackupImportsWithoutPredeterminedIdentity() throws {
        let json = """
        {
          "app": "forja",
          "schemaVersion": 2,
          "routineVersion": "1.0.0",
          "tables": {
            "profiles": [{
              "id": "perfil-nahuel",
              "name": "Nombre importado",
              "weeklyTarget": 5,
              "xp": 0,
              "campaignStart": "2026-08-24",
              "createdAt": 1787530000000,
              "updatedAt": 1787530000000
            }],
            "prefs": [], "sessions": [], "setLogs": [], "discomforts": [],
            "gameEvents": [], "kv": []
          }
        }
        """
        let imported = try BackupService.importBackup(
            Data(json.utf8),
            routine: RoutineContent(version: "1.0.0", days: [], schedules: [], campaignWeeks: 6, chapters: [])
        )
        XCTAssertEqual(imported.database.profiles.first?.name, "Nombre importado")
        XCTAssertEqual(imported.database.profiles.first?.daysPerWeek, 5)
        XCTAssertEqual(imported.database.campaigns.count, 1)
    }

    func testPWABackupRejectsSetWithoutAValidSession() throws {
        let json = """
        {
          "app": "forja",
          "schemaVersion": 2,
          "tables": {
            "profiles": [{
              "id": "profile-1",
              "name": "Alex",
              "weeklyTarget": 3,
              "campaignStart": "2026-08-24"
            }],
            "prefs": [],
            "sessions": [],
            "setLogs": [{
              "id": "set-1",
              "profileId": "profile-1",
              "sessionId": "missing-session",
              "exerciseId": "press",
              "setNumber": 1,
              "weightKg": 40,
              "reps": 10,
              "rir": 2
            }],
            "discomforts": [], "gameEvents": [], "kv": []
          }
        }
        """

        XCTAssertThrowsError(
            try BackupService.importBackup(
                Data(json.utf8),
                routine: RoutineContent(version: "1.0.0", days: [], schedules: [], campaignWeeks: 6, chapters: [])
            )
        ) { error in
            XCTAssertEqual(error as? BackupError, .brokenRelationship("serie sin sesión o perfil"))
        }
    }

    private func makeProfile(
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

    private func makeDay() -> WorkoutDay {
        WorkoutDay(
            id: "test",
            name: "Test",
            focus: "Test",
            durationMin: 30,
            durationMax: 40,
            entries: [
                ExercisePrescription(
                    exerciseID: "press",
                    sets: 3,
                    perSide: nil,
                    repMin: 6,
                    repMax: 10,
                    rirPerSet: [
                        SetPrescription(rir: RIRRange(min: 2)),
                        SetPrescription(rir: RIRRange(min: 2)),
                        SetPrescription(rir: RIRRange(min: 1))
                    ],
                    restMinSec: 180,
                    restMaxSec: 180,
                    restNote: nil,
                    note: nil
                )
            ]
        )
    }
}
