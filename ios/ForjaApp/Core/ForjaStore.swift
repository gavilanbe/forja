import Foundation

public enum ForjaStoreError: LocalizedError, Equatable {
    case invalidProfileName
    case invalidTrainingDays
    case missingProfile
    case missingSession
    case missingExercise
    case sealedSession
    case invalidSet
    case unsupportedSchema(Int)

    public var errorDescription: String? {
        switch self {
        case .invalidProfileName: "Escribe un nombre para tu forjador."
        case .invalidTrainingDays: "Elige exactamente los días de entrenamiento indicados."
        case .missingProfile: "El perfil ya no existe."
        case .missingSession: "La sesión ya no existe."
        case .missingExercise: "El ejercicio no pertenece a esta sesión."
        case .sealedSession: "Esta sesión ya está cerrada."
        case .invalidSet: "Revisa peso, repeticiones y RIR."
        case let .unsupportedSchema(version): "La copia usa un esquema más nuevo (\(version))."
        }
    }
}

public struct LogSetRequest: Equatable, Sendable {
    public var exerciseID: String
    public var setNumber: Int
    public var weightKg: Double
    public var reps: Int
    public var rir: Int
    public var variantID: String?
    public var side: String?
    public var skipped: Bool
    public var skipReason: String?

    public init(
        exerciseID: String,
        setNumber: Int,
        weightKg: Double,
        reps: Int,
        rir: Int,
        variantID: String? = nil,
        side: String? = nil,
        skipped: Bool = false,
        skipReason: String? = nil
    ) {
        self.exerciseID = exerciseID
        self.setNumber = setNumber
        self.weightKg = weightKg
        self.reps = reps
        self.rir = rir
        self.variantID = variantID
        self.side = side
        self.skipped = skipped
        self.skipReason = skipReason
    }
}

public actor ForjaStore {
    private var database: ForjaDatabase
    private let fileURL: URL?
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    public init(fileURL: URL? = nil, initialDatabase: ForjaDatabase = ForjaDatabase()) {
        self.fileURL = fileURL
        self.database = initialDatabase
        self.encoder = JSONEncoder.forja
        self.decoder = JSONDecoder.forja
    }

    public static func defaultFileURL(fileManager: FileManager = .default) -> URL {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? fileManager.temporaryDirectory
        return base.appendingPathComponent("FORJA", isDirectory: true)
            .appendingPathComponent("forja-database.json")
    }

    public func load() throws {
        guard let fileURL, FileManager.default.fileExists(atPath: fileURL.path) else { return }
        let data = try Data(contentsOf: fileURL)
        let decoded = try decoder.decode(ForjaDatabase.self, from: data)
        guard decoded.schemaVersion <= ForjaDatabase.currentSchemaVersion else {
            throw ForjaStoreError.unsupportedSchema(decoded.schemaVersion)
        }
        database = decoded
    }

    public func snapshot() -> ForjaDatabase { database }

    public func replace(with replacement: ForjaDatabase) throws {
        guard replacement.schemaVersion <= ForjaDatabase.currentSchemaVersion else {
            throw ForjaStoreError.unsupportedSchema(replacement.schemaVersion)
        }
        let previous = database
        database = replacement
        do {
            try persist()
        } catch {
            database = previous
            throw error
        }
    }

    @discardableResult
    public func createProfile(_ profile: UserProfile) throws -> UserProfile {
        let cleanName = profile.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanName.isEmpty else { throw ForjaStoreError.invalidProfileName }
        guard profile.preferredDays.count == profile.daysPerWeek else {
            throw ForjaStoreError.invalidTrainingDays
        }
        var candidate = profile
        candidate.name = cleanName
        database.profiles.append(candidate)
        database.campaigns.append(
            CampaignRecord(
                profileID: candidate.id,
                startDate: candidate.campaignStart,
                joinedDate: candidate.createdAt,
                routineVersion: "1.0.0",
                scheduleID: "custom-\(candidate.daysPerWeek)",
                weeklyTarget: candidate.daysPerWeek
            )
        )
        database.activeProfileID = candidate.id
        try persist()
        return candidate
    }

    public func updateProfile(_ profile: UserProfile) throws {
        guard let index = database.profiles.firstIndex(where: { $0.id == profile.id }) else {
            throw ForjaStoreError.missingProfile
        }
        let cleanName = profile.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanName.isEmpty else { throw ForjaStoreError.invalidProfileName }
        guard (3...5).contains(profile.daysPerWeek),
              Set(profile.preferredDays).count == profile.daysPerWeek else {
            throw ForjaStoreError.invalidTrainingDays
        }
        var candidate = profile
        candidate.name = cleanName
        candidate.preferredDays = Array(Set(candidate.preferredDays)).sorted { $0.rawValue < $1.rawValue }
        candidate.preferredSessionMinutes = min(120, max(45, candidate.preferredSessionMinutes))
        database.profiles[index] = candidate
        if let campaignIndex = database.campaigns.firstIndex(where: {
            $0.profileID == profile.id && $0.status == .active
        }) {
            database.campaigns[campaignIndex].weeklyTarget = candidate.daysPerWeek
            database.campaigns[campaignIndex].scheduleID = "custom-\(candidate.daysPerWeek)"
        }
        try persist()
    }

    public func selectProfile(_ profileID: UUID) throws {
        guard database.profiles.contains(where: { $0.id == profileID }) else {
            throw ForjaStoreError.missingProfile
        }
        database.activeProfileID = profileID
        try persist()
    }

    public func deleteProfile(_ profileID: UUID) throws {
        database.profiles.removeAll { $0.id == profileID }
        let campaignIDs = Set(database.campaigns.filter { $0.profileID == profileID }.map(\.id))
        database.campaigns.removeAll { $0.profileID == profileID }
        let sessionIDs = Set(database.sessions.filter { $0.profileID == profileID }.map(\.id))
        database.sessions.removeAll { $0.profileID == profileID }
        database.setLogs.removeAll { $0.profileID == profileID || sessionIDs.contains($0.sessionID) }
        database.discomforts.removeAll { $0.profileID == profileID }
        database.gameEvents.removeAll { $0.profileID == profileID }
        database.notes.removeAll { $0.profileID == profileID }
        database.gymSettings.removeAll { $0.profileID == profileID }
        database.codexPreferences.removeAll { $0.profileID == profileID }
        database.unlocks.removeAll { $0.profileID == profileID }
        database.customRoutines.removeAll { $0.profileID == profileID }
        database.calendarOverrides.removeAll { $0.profileID == profileID || campaignIDs.contains($0.campaignID) }
        if database.activeProfileID == profileID {
            database.activeProfileID = database.profiles.first?.id
        }
        if let timer = database.activeTimer, sessionIDs.contains(timer.sessionID) {
            database.activeTimer = nil
        }
        try persist()
    }

    @discardableResult
    public func startSession(
        profileID: UUID,
        day: WorkoutDay,
        on date: Date = Date(),
        unscheduled: Bool = false
    ) throws -> TrainingSession {
        guard let profile = database.profiles.first(where: { $0.id == profileID }) else {
            throw ForjaStoreError.missingProfile
        }
        let key = ForjaDate.dateKey(date)
        if let active = database.sessions.first(where: {
            $0.profileID == profileID && $0.dayID == day.id && $0.dateKey == key && $0.status == .active
        }) {
            return active
        }
        let session = TrainingSession(
            profileID: profileID,
            campaignID: database.campaigns.first(where: { $0.profileID == profileID && $0.status == .active })?.id,
            dayID: day.id,
            dateKey: key,
            campaignWeek: ForjaDate.campaignWeek(start: profile.campaignStart, on: date),
            unscheduled: unscheduled,
            prescriptionSnapshot: day
        )
        database.sessions.append(session)
        try persist()
        return session
    }

    @discardableResult
    public func logSet(sessionID: UUID, request: LogSetRequest) throws -> LoggedSet {
        guard let sessionIndex = database.sessions.firstIndex(where: { $0.id == sessionID }) else {
            throw ForjaStoreError.missingSession
        }
        let session = database.sessions[sessionIndex]
        guard session.status == .active else { throw ForjaStoreError.sealedSession }
        guard let prescription = session.prescriptionSnapshot.entries.first(where: { $0.exerciseID == request.exerciseID }) else {
            throw ForjaStoreError.missingExercise
        }
        guard request.setNumber > 0 else { throw ForjaStoreError.invalidSet }
        if !request.skipped {
            guard request.weightKg >= 0, request.reps > 0, (0...4).contains(request.rir) else {
                throw ForjaStoreError.invalidSet
            }
        }

        if let existing = database.setLogs.first(where: {
            $0.sessionID == session.id &&
                $0.exerciseID == request.exerciseID &&
                $0.setNumber == request.setNumber &&
                $0.side == request.side
        }) {
            let matchesRequest = existing.weightKg == (request.skipped ? 0 : request.weightKg) &&
                existing.reps == (request.skipped ? 0 : request.reps) &&
                existing.rir == (request.skipped ? 0 : request.rir) &&
                existing.variantID == request.variantID &&
                existing.skipped == request.skipped &&
                existing.skipReason == request.skipReason
            guard matchesRequest else { throw ForjaStoreError.invalidSet }
            return existing
        }

        let record = LoggedSet(
            profileID: session.profileID,
            sessionID: session.id,
            exerciseID: request.exerciseID,
            setNumber: request.setNumber,
            weightKg: request.skipped ? 0 : request.weightKg,
            reps: request.skipped ? 0 : request.reps,
            rir: request.skipped ? 0 : request.rir,
            variantID: request.variantID,
            side: request.side,
            skipped: request.skipped,
            skipReason: request.skipReason
        )

        let previous = database
        database.setLogs.append(record)
        let earnsXP = !request.skipped && !session.unscheduled && request.setNumber <= prescription.sets
        if earnsXP {
            awardOnce(
                profileID: session.profileID,
                kind: .plannedSet,
                xp: XPReward.plannedSet,
                label: "Serie prevista registrada",
                dedupeKey: "set:\(session.dateKey):\(session.dayID):\(request.exerciseID):\(request.setNumber)",
                sessionID: session.id,
                exerciseID: request.exerciseID
            )
        }
        recomputeXP(profileID: session.profileID)
        do {
            try persist()
        } catch {
            database = previous
            throw error
        }
        return record
    }

    public func updateSessionExercise(sessionID: UUID, index: Int) throws {
        guard let sessionIndex = database.sessions.firstIndex(where: { $0.id == sessionID }) else {
            throw ForjaStoreError.missingSession
        }
        database.sessions[sessionIndex].currentExerciseIndex = max(0, index)
        try persist()
    }

    public func deleteSet(_ setID: UUID) throws {
        guard let record = database.setLogs.first(where: { $0.id == setID }) else { return }
        let previous = database
        database.setLogs.removeAll { $0.id == setID }

        let siblingIndexes = database.setLogs.indices
            .filter {
                database.setLogs[$0].sessionID == record.sessionID &&
                    database.setLogs[$0].exerciseID == record.exerciseID &&
                    database.setLogs[$0].side == record.side
            }
            .sorted { database.setLogs[$0].setNumber < database.setLogs[$1].setNumber }
        for (offset, index) in siblingIndexes.enumerated() {
            database.setLogs[index].setNumber = offset + 1
        }

        reconcilePlannedSetEvents(sessionID: record.sessionID)
        recomputeXP(profileID: record.profileID)
        do {
            try persist()
        } catch {
            database = previous
            throw error
        }
    }

    public func recordDiscomfort(
        sessionID: UUID,
        exerciseID: String,
        level: Int,
        action: DiscomfortAction,
        note: String?
    ) throws {
        guard let session = database.sessions.first(where: { $0.id == sessionID }) else {
            throw ForjaStoreError.missingSession
        }
        database.discomforts.append(
            DiscomfortRecord(
                id: UUID(),
                profileID: session.profileID,
                sessionID: sessionID,
                exerciseID: exerciseID,
                level: min(10, max(0, level)),
                action: action,
                note: note,
                createdAt: Date()
            )
        )
        try persist()
    }

    @discardableResult
    public func completeSession(_ sessionID: UUID, abandon: Bool = false) throws -> TrainingSession {
        guard let index = database.sessions.firstIndex(where: { $0.id == sessionID }) else {
            throw ForjaStoreError.missingSession
        }
        if database.sessions[index].status != .active { return database.sessions[index] }

        let session = database.sessions[index]
        let sets = database.setLogs.filter { $0.sessionID == sessionID && !$0.skipped && $0.reps > 0 }
        let hasEveryPlannedSet = session.prescriptionSnapshot.entries.allSatisfy { entry in
            let completedNumbers = Set(
                sets
                    .filter { $0.exerciseID == entry.exerciseID && $0.setNumber <= entry.sets }
                    .map(\.setNumber)
            )
            return completedNumbers.count >= entry.sets
        }
        let adapted = database.discomforts.contains {
            $0.sessionID == sessionID && ($0.action == .adapt || $0.action == .stop)
        }

        let status: SessionStatus
        if abandon || sets.isEmpty {
            status = .abandoned
        } else if hasEveryPlannedSet {
            status = adapted ? .adapted : .completed
        } else {
            status = adapted ? .adapted : .partial
        }

        database.sessions[index].status = status
        database.sessions[index].completedAt = Date()
        let sealed = database.sessions[index]

        if !sealed.unscheduled {
            switch status {
            case .completed:
                awardOnce(
                    profileID: sealed.profileID,
                    kind: .completedMission,
                    xp: XPReward.completedMission,
                    label: "Misión completada",
                    dedupeKey: "mission:\(sealed.id)",
                    sessionID: sealed.id
                )
            case .adapted:
                awardOnce(
                    profileID: sealed.profileID,
                    kind: .adaptedMission,
                    xp: XPReward.adaptedMission,
                    label: "Misión adaptada con cabeza",
                    dedupeKey: "mission:\(sealed.id)",
                    sessionID: sealed.id
                )
            case .partial:
                awardOnce(
                    profileID: sealed.profileID,
                    kind: .partialMission,
                    xp: XPReward.partialMission,
                    label: "Misión parcial",
                    dedupeKey: "mission:\(sealed.id)",
                    sessionID: sealed.id
                )
            case .active, .abandoned:
                break
            }
        }

        if let profile = database.profiles.first(where: { $0.id == sealed.profileID }),
           status == .completed || status == .adapted {
            let completedThisWeek = database.sessions.filter {
                $0.profileID == sealed.profileID &&
                    $0.campaignWeek == sealed.campaignWeek &&
                    !$0.unscheduled &&
                    ($0.status == .completed || $0.status == .adapted)
            }.count
            if completedThisWeek >= profile.daysPerWeek {
                awardOnce(
                    profileID: sealed.profileID,
                    kind: .completedChapter,
                    xp: XPReward.completedChapter,
                    label: "Capítulo \(sealed.campaignWeek) completado",
                    dedupeKey: "chapter:\(sealed.profileID):\(sealed.campaignWeek)",
                    sessionID: sealed.id
                )
            }
        }

        recomputeXP(profileID: sealed.profileID)
        if database.activeTimer?.sessionID == sealed.id { database.activeTimer = nil }
        try persist()
        return database.sessions[index]
    }

    public func saveTimer(_ timer: RestTimerState?) throws {
        database.activeTimer = timer
        try persist()
    }

    public func saveNote(
        profileID: UUID,
        sessionID: UUID,
        exerciseID: String?,
        text: String
    ) throws {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if let index = database.notes.firstIndex(where: {
            $0.sessionID == sessionID && $0.exerciseID == exerciseID
        }) {
            if clean.isEmpty {
                database.notes.remove(at: index)
            } else {
                database.notes[index].text = clean
                database.notes[index].updatedAt = Date()
            }
        } else if !clean.isEmpty {
            database.notes.append(
                SessionNote(
                    id: UUID(),
                    profileID: profileID,
                    sessionID: sessionID,
                    exerciseID: exerciseID,
                    text: clean,
                    updatedAt: Date()
                )
            )
        }
        try persist()
    }

    public func statistics(profileID: UUID, now: Date = Date()) -> ProfileStatistics {
        guard let profile = database.profiles.first(where: { $0.id == profileID }) else {
            return ProfileStatistics(
                completedMissions: 0,
                adaptedMissions: 0,
                totalSets: 0,
                totalVolumeKg: 0,
                currentWeekCompleted: 0,
                weeklyTarget: 0
            )
        }
        let sessions = database.sessions.filter { $0.profileID == profileID }
        let logs = database.setLogs.filter { $0.profileID == profileID && !$0.skipped }
        let week = ForjaDate.campaignWeek(start: profile.campaignStart, on: now)
        return ProfileStatistics(
            completedMissions: sessions.filter { $0.status == .completed }.count,
            adaptedMissions: sessions.filter { $0.status == .adapted }.count,
            totalSets: logs.count,
            totalVolumeKg: logs.reduce(0) { $0 + $1.weightKg * Double($1.reps) },
            currentWeekCompleted: sessions.filter {
                $0.campaignWeek == week && ($0.status == .completed || $0.status == .adapted)
            }.count,
            weeklyTarget: profile.daysPerWeek
        )
    }

    private func awardOnce(
        profileID: UUID,
        kind: GameEventKind,
        xp: Int,
        label: String,
        dedupeKey: String,
        sessionID: UUID?,
        exerciseID: String? = nil
    ) {
        guard !database.gameEvents.contains(where: {
            $0.profileID == profileID && $0.dedupeKey == dedupeKey
        }) else { return }
        database.gameEvents.append(
            GameEvent(
                id: UUID(),
                profileID: profileID,
                kind: kind,
                xp: xp,
                label: label,
                dedupeKey: dedupeKey,
                sessionID: sessionID,
                exerciseID: exerciseID,
                createdAt: Date()
            )
        )
    }

    private func recomputeXP(profileID: UUID) {
        guard let index = database.profiles.firstIndex(where: { $0.id == profileID }) else { return }
        database.profiles[index].xp = database.gameEvents
            .filter { $0.profileID == profileID }
            .reduce(0) { $0 + $1.xp }
    }

    private func reconcilePlannedSetEvents(sessionID: UUID) {
        guard let session = database.sessions.first(where: { $0.id == sessionID }) else { return }
        database.gameEvents.removeAll { $0.sessionID == sessionID && $0.kind == .plannedSet }
        guard !session.unscheduled else { return }

        for prescription in session.prescriptionSnapshot.entries {
            let completedNumbers = Set(
                database.setLogs
                    .filter {
                        $0.sessionID == sessionID &&
                            $0.exerciseID == prescription.exerciseID &&
                            !$0.skipped &&
                            $0.reps > 0 &&
                            $0.setNumber <= prescription.sets
                    }
                    .map(\.setNumber)
            )
            for number in completedNumbers.sorted() {
                awardOnce(
                    profileID: session.profileID,
                    kind: .plannedSet,
                    xp: XPReward.plannedSet,
                    label: "Serie prevista registrada",
                    dedupeKey: "set:\(session.dateKey):\(session.dayID):\(prescription.exerciseID):\(number)",
                    sessionID: session.id,
                    exerciseID: prescription.exerciseID
                )
            }
        }
    }

    private func persist() throws {
        guard let fileURL else { return }
        let directory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let data = try encoder.encode(database)
        try data.write(to: fileURL, options: [.atomic, .completeFileProtection])
    }
}

extension JSONEncoder {
    static var forja: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(date.timeIntervalSince1970)
        }
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        return encoder
    }
}

extension JSONDecoder {
    static var forja: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            if let timestamp = try? container.decode(Double.self) {
                return Date(timeIntervalSince1970: timestamp)
            }
            let value = try container.decode(String.self)
            guard let date = ForjaISO8601.date(from: value) else {
                throw DecodingError.dataCorruptedError(
                    in: container,
                    debugDescription: "Fecha ISO 8601 no válida: \(value)"
                )
            }
            return date
        }
        return decoder
    }
}

private enum ForjaISO8601 {
    static func date(from value: String) -> Date? {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractional.date(from: value) { return date }

        let legacy = ISO8601DateFormatter()
        legacy.formatOptions = [.withInternetDateTime]
        return legacy.date(from: value)
    }
}
