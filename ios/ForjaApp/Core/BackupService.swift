import Foundation

public enum BackupError: LocalizedError, Equatable {
    case invalidJSON
    case unsupportedApp
    case unsupportedSchema(Int)
    case missingProfiles
    case brokenRelationship(String)

    public var errorDescription: String? {
        switch self {
        case .invalidJSON: "El archivo no es una copia JSON válida de FORJA."
        case .unsupportedApp: "El archivo no pertenece a FORJA."
        case let .unsupportedSchema(version): "La copia usa un esquema no compatible (\(version))."
        case .missingProfiles: "La copia no contiene perfiles."
        case let .brokenRelationship(detail): "La copia contiene una relación dañada: \(detail)."
        }
    }
}

public struct NativeBackup: Codable, Sendable {
    public var app: String
    public var schemaVersion: Int
    public var exportedAt: Date
    public var database: ForjaDatabase
}

public struct ImportSummary: Equatable, Sendable {
    public var source: String
    public var profiles: Int
    public var sessions: Int
    public var sets: Int
}

public enum BackupService {
    public static func export(_ database: ForjaDatabase, now: Date = Date()) throws -> Data {
        try JSONEncoder.forja.encode(
            NativeBackup(
                app: "forja-ios",
                schemaVersion: ForjaDatabase.currentSchemaVersion,
                exportedAt: now,
                database: database
            )
        )
    }

    public static func importBackup(
        _ data: Data,
        routine: RoutineContent
    ) throws -> (database: ForjaDatabase, summary: ImportSummary) {
        if let native = try? JSONDecoder.forja.decode(NativeBackup.self, from: data),
           native.app == "forja-ios" {
            guard native.schemaVersion <= ForjaDatabase.currentSchemaVersion else {
                throw BackupError.unsupportedSchema(native.schemaVersion)
            }
            return (
                native.database,
                ImportSummary(
                    source: "FORJA iOS",
                    profiles: native.database.profiles.count,
                    sessions: native.database.sessions.count,
                    sets: native.database.setLogs.count
                )
            )
        }
        return try importPWA(data, routine: routine)
    }

    private static func importPWA(
        _ data: Data,
        routine: RoutineContent
    ) throws -> (database: ForjaDatabase, summary: ImportSummary) {
        guard let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw BackupError.invalidJSON
        }
        guard root["app"] as? String == "forja" else { throw BackupError.unsupportedApp }
        let schema = number(root["schemaVersion"]).map(Int.init) ?? 0
        guard (1...3).contains(schema) else { throw BackupError.unsupportedSchema(schema) }
        guard let tables = root["tables"] as? [String: Any],
              let rawProfiles = tables["profiles"] as? [[String: Any]],
              !rawProfiles.isEmpty else {
            throw BackupError.missingProfiles
        }

        let rawPrefs = rows(tables, "prefs")
        var profileIDs: [String: UUID] = [:]
        var profiles: [UserProfile] = []
        for raw in rawProfiles {
            guard let legacyID = raw["id"] as? String else { throw BackupError.invalidJSON }
            let id = UUID()
            profileIDs[legacyID] = id
            let target = max(3, min(5, int(raw["weeklyTarget"]) ?? 3))
            let preferredDays = defaultDays(target)
            let pref = rawPrefs.first { ($0["profileId"] as? String) == legacyID }
            let appearance = raw["appearance"] as? [String: Any]
            let campaignStart = (raw["campaignStart"] as? String).flatMap { ForjaDate.date(from: $0) } ?? Date()
            profiles.append(
                UserProfile(
                    id: id,
                    name: (raw["name"] as? String) ?? "Forjador",
                    goal: .muscleGain,
                    experience: .intermediate,
                    trainingPlace: .gym,
                    daysPerWeek: target,
                    preferredDays: preferredDays,
                    preferredSessionMinutes: 90,
                    avatar: importedAvatar(appearance),
                    preferences: ProfilePreferences(
                        soundEnabled: bool(pref?["sonido"]) ?? false,
                        hapticsEnabled: bool(pref?["vibracion"]) ?? true,
                        restNotificationsEnabled: bool(pref?["notificacionDescanso"]) ?? true,
                        keepScreenAwake: bool(pref?["wakeLock"]) ?? true,
                        reducedMotion: (pref?["animacionReducida"] as? String) == "reducida",
                        compoundIncrementKg: number(pref?["incrementoCompuesto"]) ?? 2.5,
                        isolationIncrementKg: number(pref?["incrementoAislamiento"]) ?? 1.25
                    ),
                    xp: int(raw["xp"]) ?? 0,
                    campaignStart: campaignStart,
                    createdAt: dateFromMilliseconds(raw["createdAt"]) ?? Date()
                )
            )
        }

        var campaignIDs: [String: UUID] = [:]
        var campaigns: [CampaignRecord] = []
        for raw in rows(tables, "campaigns") {
            guard let legacyID = raw["id"] as? String,
                  let legacyProfileID = raw["profileId"] as? String,
                  let profileID = profileIDs[legacyProfileID] else { continue }
            let id = UUID()
            campaignIDs[legacyID] = id
            let start = (raw["startKey"] as? String).flatMap { ForjaDate.date(from: $0) }
                ?? profiles.first(where: { $0.id == profileID })?.campaignStart
                ?? Date()
            campaigns.append(
                CampaignRecord(
                    id: id,
                    profileID: profileID,
                    startDate: start,
                    joinedDate: (raw["joinedKey"] as? String).flatMap { ForjaDate.date(from: $0) } ?? start,
                    routineVersion: (raw["routineVersion"] as? String) ?? routine.version,
                    scheduleID: (raw["scheduleId"] as? String) ?? "custom-\(int(raw["weeklyTarget"]) ?? 3)",
                    weeklyTarget: int(raw["weeklyTarget"]) ?? 3,
                    weeksTotal: int(raw["weeksTotal"]) ?? 6,
                    status: (raw["status"] as? String) == "archivada" ? .archived : .active,
                    endedAt: dateFromMilliseconds(raw["endedAt"])
                )
            )
        }
        // Las copias v1/v2 no tenían campañas como tabla: se conserva su inicio creando una.
        for profile in profiles where !campaigns.contains(where: { $0.profileID == profile.id }) {
            campaigns.append(
                CampaignRecord(
                    profileID: profile.id,
                    startDate: profile.campaignStart,
                    joinedDate: profile.createdAt,
                    routineVersion: routine.version,
                    scheduleID: "custom-\(profile.daysPerWeek)",
                    weeklyTarget: profile.daysPerWeek
                )
            )
        }

        var sessionIDs: [String: UUID] = [:]
        var sessions: [TrainingSession] = []
        for raw in rows(tables, "sessions") {
            guard let legacyID = raw["id"] as? String,
                  let legacyProfileID = raw["profileId"] as? String,
                  let profileID = profileIDs[legacyProfileID],
                  let dayID = raw["dayId"] as? String else {
                throw BackupError.brokenRelationship("sesión sin perfil o día")
            }
            let id = UUID()
            sessionIDs[legacyID] = id
            let fallbackDay = routine.days.first(where: { $0.id == dayID })
                ?? WorkoutDay(id: dayID, name: dayID, focus: "Sesión importada", durationMin: 0, durationMax: 0, entries: [])
            let snapshot = decodeSnapshot(raw["prescriptionSnapshot"], fallback: fallbackDay)
            sessions.append(
                TrainingSession(
                    id: id,
                    profileID: profileID,
                    campaignID: (raw["campaignId"] as? String).flatMap { campaignIDs[$0] }
                        ?? campaigns.first(where: { $0.profileID == profileID && $0.status == .active })?.id,
                    dayID: dayID,
                    dateKey: (raw["dateKey"] as? String) ?? ForjaDate.dateKey(Date()),
                    campaignWeek: int(raw["week"]) ?? 1,
                    status: importedStatus(raw["status"] as? String),
                    startedAt: dateFromMilliseconds(raw["startedAt"]) ?? Date(),
                    completedAt: dateFromMilliseconds(raw["completedAt"]),
                    currentExerciseIndex: int(raw["currentExerciseIndex"]) ?? 0,
                    unscheduled: bool(raw["unscheduled"]) ?? false,
                    prescriptionSnapshot: snapshot
                )
            )
        }

        var setLogs: [LoggedSet] = []
        for raw in rows(tables, "setLogs") {
            guard let legacyProfileID = raw["profileId"] as? String,
                  let profileID = profileIDs[legacyProfileID],
                  let legacySessionID = raw["sessionId"] as? String,
                  let sessionID = sessionIDs[legacySessionID],
                  let exerciseID = raw["exerciseId"] as? String else {
                throw BackupError.brokenRelationship("serie sin sesión o perfil")
            }
            setLogs.append(
                LoggedSet(
                    profileID: profileID,
                    sessionID: sessionID,
                    exerciseID: exerciseID,
                    setNumber: int(raw["setNumber"]) ?? 1,
                    weightKg: number(raw["weightKg"]) ?? 0,
                    reps: int(raw["reps"]) ?? 0,
                    rir: int(raw["rir"]) ?? 0,
                    variantID: raw["variantId"] as? String,
                    side: raw["side"] as? String,
                    skipped: bool(raw["skipped"]) ?? false,
                    skipReason: raw["skipReason"] as? String,
                    createdAt: dateFromMilliseconds(raw["createdAt"]) ?? Date()
                )
            )
        }

        var discomforts: [DiscomfortRecord] = []
        for raw in rows(tables, "discomforts") {
            guard let legacyProfileID = raw["profileId"] as? String,
                  let profileID = profileIDs[legacyProfileID],
                  let legacySessionID = raw["sessionId"] as? String,
                  let sessionID = sessionIDs[legacySessionID],
                  let exerciseID = raw["exerciseId"] as? String else { continue }
            discomforts.append(
                DiscomfortRecord(
                    id: UUID(),
                    profileID: profileID,
                    sessionID: sessionID,
                    exerciseID: exerciseID,
                    level: int(raw["level"]) ?? 0,
                    action: importedDiscomfortAction(raw["action"] as? String),
                    note: raw["note"] as? String,
                    createdAt: dateFromMilliseconds(raw["createdAt"]) ?? Date()
                )
            )
        }

        var events: [GameEvent] = []
        for raw in rows(tables, "gameEvents") {
            guard let legacyProfileID = raw["profileId"] as? String,
                  let profileID = profileIDs[legacyProfileID] else { continue }
            let legacySession = raw["sessionId"] as? String
            events.append(
                GameEvent(
                    id: UUID(),
                    profileID: profileID,
                    kind: importedEventKind(raw["type"] as? String),
                    xp: int(raw["xp"]) ?? 0,
                    label: (raw["label"] as? String) ?? "Evento importado",
                    dedupeKey: (raw["dedupeKey"] as? String) ?? "legacy:\((raw["id"] as? String) ?? UUID().uuidString)",
                    sessionID: legacySession.flatMap { sessionIDs[$0] },
                    exerciseID: raw["exerciseId"] as? String,
                    createdAt: dateFromMilliseconds(raw["createdAt"]) ?? Date()
                )
            )
        }

        // Conserva XP histórica aunque una copia antigua no incluyera el libro mayor completo.
        for profile in profiles {
            let ledger = events.filter { $0.profileID == profile.id }.reduce(0) { $0 + $1.xp }
            if profile.xp > ledger {
                events.append(
                    GameEvent(
                        id: UUID(),
                        profileID: profile.id,
                        kind: .milestone,
                        xp: profile.xp - ledger,
                        label: "XP de copia anterior",
                        dedupeKey: "legacy-xp:\(profile.id)",
                        sessionID: nil,
                        exerciseID: nil,
                        createdAt: Date()
                    )
                )
            }
        }

        let activeLegacyID = rows(tables, "kv")
            .first(where: { ($0["key"] as? String) == "activeProfileId" })?["value"] as? String
        let activeProfileID = activeLegacyID.flatMap { profileIDs[$0] } ?? profiles.first?.id

        let database = ForjaDatabase(
            profiles: profiles,
            campaigns: campaigns,
            sessions: sessions,
            setLogs: setLogs,
            discomforts: discomforts,
            gameEvents: events,
            notes: importNotes(tables: tables, profileIDs: profileIDs, sessionIDs: sessionIDs),
            gymSettings: importGymSettings(tables: tables, profileIDs: profileIDs),
            codexPreferences: importCodexPreferences(tables: tables, profileIDs: profileIDs),
            unlocks: importUnlocks(tables: tables, profileIDs: profileIDs),
            customRoutines: importCustomRoutines(tables: tables, profileIDs: profileIDs),
            calendarOverrides: importCalendarOverrides(
                tables: tables,
                profileIDs: profileIDs,
                campaignIDs: campaignIDs,
                campaigns: campaigns
            ),
            activeProfileID: activeProfileID
        )
        return (
            database,
            ImportSummary(source: "FORJA web v\(schema)", profiles: profiles.count, sessions: sessions.count, sets: setLogs.count)
        )
    }

    private static func rows(_ tables: [String: Any], _ name: String) -> [[String: Any]] {
        tables[name] as? [[String: Any]] ?? []
    }

    private static func number(_ value: Any?) -> Double? {
        if let value = value as? NSNumber { return value.doubleValue }
        if let value = value as? Double { return value }
        if let value = value as? Int { return Double(value) }
        return nil
    }

    private static func int(_ value: Any?) -> Int? { number(value).map(Int.init) }
    private static func bool(_ value: Any?) -> Bool? { (value as? NSNumber)?.boolValue ?? value as? Bool }

    private static func dateFromMilliseconds(_ value: Any?) -> Date? {
        number(value).map { Date(timeIntervalSince1970: $0 / 1_000) }
    }

    private static func defaultDays(_ count: Int) -> [Weekday] {
        switch count {
        case ...3: [.monday, .wednesday, .friday]
        case 4: [.monday, .tuesday, .thursday, .saturday]
        default: [.monday, .tuesday, .thursday, .friday, .saturday]
        }
    }

    private static func importedAvatar(_ raw: [String: Any]?) -> AvatarConfiguration {
        var avatar = AvatarConfiguration()
        if let value = raw?["skinTone"] as? String, !value.isEmpty { avatar.skinToneID = value }
        if let value = raw?["hair"] as? String, let hair = AvatarHair(rawValue: value) { avatar.hair = hair }
        if let value = raw?["outfit"] as? String, let outfit = AvatarOutfit(rawValue: value) { avatar.outfit = outfit }
        if let value = raw?["armor"] as? String, let armor = AvatarArmor(rawValue: value) { avatar.armor = armor }
        if let value = raw?["aura"] as? String, let aura = AvatarAura(rawValue: value) { avatar.aura = aura }
        return avatar
    }

    private static func decodeSnapshot(_ raw: Any?, fallback: WorkoutDay) -> WorkoutDay {
        guard let dictionary = raw as? [String: Any],
              let entriesRaw = dictionary["entries"] as? [[String: Any]],
              let data = try? JSONSerialization.data(withJSONObject: entriesRaw),
              let entries = try? JSONDecoder().decode([ExercisePrescription].self, from: data) else {
            return fallback
        }
        return WorkoutDay(
            id: fallback.id,
            name: (dictionary["dayName"] as? String) ?? fallback.name,
            focus: fallback.focus,
            durationMin: fallback.durationMin,
            durationMax: fallback.durationMax,
            entries: entries
        )
    }

    private static func importedStatus(_ value: String?) -> SessionStatus {
        switch value {
        case "completada": .completed
        case "adaptada": .adapted
        case "parcial": .partial
        case "abandonada": .abandoned
        default: .active
        }
    }

    private static func importedDiscomfortAction(_ value: String?) -> DiscomfortAction {
        switch value {
        case "adaptar": .adapt
        case "detener": .stop
        default: .continueTraining
        }
    }

    private static func importedEventKind(_ value: String?) -> GameEventKind {
        switch value {
        case "serie": .plannedSet
        case "mision-completada": .completedMission
        case "mision-adaptada": .adaptedMission
        case "mision-parcial": .partialMission
        case "capitulo-completado": .completedChapter
        case "cosmetico": .cosmetic
        default: .milestone
        }
    }

    private static func importNotes(
        tables: [String: Any],
        profileIDs: [String: UUID],
        sessionIDs: [String: UUID]
    ) -> [SessionNote] {
        rows(tables, "notes").compactMap { raw in
            guard let profile = (raw["profileId"] as? String).flatMap({ profileIDs[$0] }),
                  let session = (raw["sessionId"] as? String).flatMap({ sessionIDs[$0] }),
                  let text = raw["text"] as? String else { return nil }
            let exercise = raw["exerciseId"] as? String
            return SessionNote(
                id: UUID(),
                profileID: profile,
                sessionID: session,
                exerciseID: exercise?.isEmpty == true ? nil : exercise,
                text: text,
                updatedAt: dateFromMilliseconds(raw["updatedAt"]) ?? Date()
            )
        }
    }

    private static func importGymSettings(
        tables: [String: Any],
        profileIDs: [String: UUID]
    ) -> [GymSetting] {
        rows(tables, "gymSettings").compactMap { raw in
            guard let profile = (raw["profileId"] as? String).flatMap({ profileIDs[$0] }),
                  let exercise = raw["exerciseId"] as? String else { return nil }
            return GymSetting(
                id: UUID(),
                profileID: profile,
                exerciseID: exercise,
                machineName: raw["machineName"] as? String,
                seatPosition: raw["seatPosition"] as? String,
                minimumIncrementKg: number(raw["minIncrementKg"]),
                notes: raw["setupNotes"] as? String
            )
        }
    }

    private static func importCodexPreferences(
        tables: [String: Any],
        profileIDs: [String: UUID]
    ) -> [CodexPreference] {
        rows(tables, "codexPrefs").compactMap { raw in
            guard let profile = (raw["profileId"] as? String).flatMap({ profileIDs[$0] }),
                  let exercise = raw["exerciseId"] as? String else { return nil }
            return CodexPreference(
                id: UUID(),
                profileID: profile,
                exerciseID: exercise,
                favorite: bool(raw["favorite"]) ?? false,
                personalNote: raw["personalNote"] as? String
            )
        }
    }

    private static func importUnlocks(
        tables: [String: Any],
        profileIDs: [String: UUID]
    ) -> [Unlock] {
        rows(tables, "unlocks").compactMap { raw in
            guard let profile = (raw["profileId"] as? String).flatMap({ profileIDs[$0] }),
                  let item = raw["itemId"] as? String else { return nil }
            return Unlock(
                id: UUID(),
                profileID: profile,
                itemID: item,
                dedupeKey: (raw["dedupeKey"] as? String) ?? "legacy-unlock:\(item)"
            )
        }
    }

    private static func importCustomRoutines(
        tables: [String: Any],
        profileIDs: [String: UUID]
    ) -> [CustomRoutineRecord] {
        rows(tables, "customRoutines").compactMap { raw in
            guard let profile = (raw["profileId"] as? String).flatMap({ profileIDs[$0] }),
                  let rawDays = raw["days"] as? [[String: Any]],
                  let data = try? JSONSerialization.data(withJSONObject: rawDays),
                  let days = try? JSONDecoder().decode([WorkoutDay].self, from: data) else { return nil }
            let week = (raw["week"] as? [Any])?.map { $0 as? String } ?? []
            return CustomRoutineRecord(
                id: UUID(),
                profileID: profile,
                baseScheduleID: (raw["baseScheduleId"] as? String) ?? "imported",
                name: (raw["name"] as? String) ?? "Rutina importada",
                days: days,
                week: week,
                weeklyTarget: int(raw["weeklyTarget"]) ?? 3,
                active: bool(raw["active"]) ?? false
            )
        }
    }

    private static func importCalendarOverrides(
        tables: [String: Any],
        profileIDs: [String: UUID],
        campaignIDs: [String: UUID],
        campaigns: [CampaignRecord]
    ) -> [CalendarOverrideRecord] {
        rows(tables, "calendarOverrides").compactMap { raw in
            guard let profile = (raw["profileId"] as? String).flatMap({ profileIDs[$0] }),
                  let weekKey = raw["weekStartKey"] as? String,
                  let weekStart = ForjaDate.date(from: weekKey),
                  let kind = importedOverrideKind(raw["type"] as? String) else { return nil }
            let campaign = (raw["campaignId"] as? String).flatMap { campaignIDs[$0] }
                ?? campaigns.first(where: { $0.profileID == profile })?.id
            guard let campaign else { return nil }
            return CalendarOverrideRecord(
                id: UUID(),
                profileID: profile,
                campaignID: campaign,
                weekStartDate: weekStart,
                kind: kind,
                fromWeekday: int(raw["fromWeekday"]),
                toWeekday: int(raw["toWeekday"]),
                dayID: raw["dayId"] as? String,
                weekdays: (raw["weekdays"] as? [NSNumber])?.map(\.intValue),
                volumeFactor: number(raw["volumeFactor"]),
                reason: raw["reason"] as? String
            )
        }
    }

    private static func importedOverrideKind(_ value: String?) -> CalendarOverrideKind? {
        switch value {
        case "mover": .move
        case "ausencia": .absence
        case "descarga": .deload
        case "posponer": .postpone
        default: nil
        }
    }
}
