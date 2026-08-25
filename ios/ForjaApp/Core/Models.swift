import Foundation

// MARK: - Perfil y personalización

public enum TrainingGoal: String, Codable, CaseIterable, Identifiable, Sendable {
    case muscleGain
    case strength
    case consistency
    case recomposition
    case learnTechnique

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .muscleGain: "Ganar músculo"
        case .strength: "Ganar fuerza"
        case .consistency: "Crear constancia"
        case .recomposition: "Recomposición"
        case .learnTechnique: "Aprender técnica"
        }
    }

    public var detail: String {
        switch self {
        case .muscleGain: "Prioriza hipertrofia y progresión sostenible."
        case .strength: "Busca mejorar cargas sin sacrificar ejecución."
        case .consistency: "Da prioridad a completar semanas realistas."
        case .recomposition: "Entrena con regularidad mientras ajustas hábitos."
        case .learnTechnique: "Construye una base segura y repetible."
        }
    }
}

public enum ExperienceLevel: String, Codable, CaseIterable, Identifiable, Sendable {
    case beginner
    case intermediate
    case advanced

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .beginner: "Estoy empezando"
        case .intermediate: "Ya entreno"
        case .advanced: "Tengo experiencia"
        }
    }
}

public enum TrainingPlace: String, Codable, CaseIterable, Identifiable, Sendable {
    case gym
    case home
    case mixed

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .gym: "Gimnasio"
        case .home: "En casa"
        case .mixed: "Mixto"
        }
    }
}

public enum Weekday: Int, Codable, CaseIterable, Identifiable, Sendable {
    case monday = 1
    case tuesday
    case wednesday
    case thursday
    case friday
    case saturday
    case sunday

    public var id: Int { rawValue }

    public var shortTitle: String {
        switch self {
        case .monday: "L"
        case .tuesday: "M"
        case .wednesday: "X"
        case .thursday: "J"
        case .friday: "V"
        case .saturday: "S"
        case .sunday: "D"
        }
    }

    public var title: String {
        switch self {
        case .monday: "Lunes"
        case .tuesday: "Martes"
        case .wednesday: "Miércoles"
        case .thursday: "Jueves"
        case .friday: "Viernes"
        case .saturday: "Sábado"
        case .sunday: "Domingo"
        }
    }

    public static func current(using calendar: Calendar = .current, date: Date = Date()) -> Weekday {
        let appleWeekday = calendar.component(.weekday, from: date)
        let mondayBased = appleWeekday == 1 ? 7 : appleWeekday - 1
        return Weekday(rawValue: mondayBased) ?? .monday
    }
}

public enum AvatarBody: String, Codable, CaseIterable, Identifiable, Sendable {
    case agile
    case athletic
    case strong
    case broad
    public var id: String { rawValue }
}

public enum AvatarHair: String, Codable, CaseIterable, Identifiable, Sendable {
    case cropped
    case fade
    case curls
    case long
    case bun
    case shaved
    public var id: String { rawValue }
}

public enum AvatarOutfit: String, Codable, CaseIterable, Identifiable, Sendable {
    case training
    case smith
    case ranger
    case mage
    public var id: String { rawValue }
}

public enum AvatarArmor: String, Codable, CaseIterable, Identifiable, Sendable {
    case none
    case leather
    case iron
    case obsidian
    public var id: String { rawValue }
}

public enum AvatarAccessory: String, Codable, CaseIterable, Identifiable, Sendable {
    case none
    case headband
    case glasses
    case earring
    case scar
    public var id: String { rawValue }
}

public enum AvatarAura: String, Codable, CaseIterable, Identifiable, Sendable {
    case none
    case ember
    case frost
    case storm
    case arcane
    public var id: String { rawValue }
}

public struct AvatarConfiguration: Codable, Equatable, Sendable {
    public var body: AvatarBody
    public var skinToneID: String
    public var hair: AvatarHair
    public var hairColorID: String
    public var outfit: AvatarOutfit
    public var outfitColorID: String
    public var armor: AvatarArmor
    public var accessory: AvatarAccessory
    public var aura: AvatarAura

    public init(
        body: AvatarBody = .athletic,
        skinToneID: String = "skin-03",
        hair: AvatarHair = .cropped,
        hairColorID: String = "hair-02",
        outfit: AvatarOutfit = .training,
        outfitColorID: String = "cloth-ember",
        armor: AvatarArmor = .none,
        accessory: AvatarAccessory = .none,
        aura: AvatarAura = .none
    ) {
        self.body = body
        self.skinToneID = skinToneID
        self.hair = hair
        self.hairColorID = hairColorID
        self.outfit = outfit
        self.outfitColorID = outfitColorID
        self.armor = armor
        self.accessory = accessory
        self.aura = aura
    }
}

public struct ProfilePreferences: Codable, Equatable, Sendable {
    public var soundEnabled: Bool
    public var hapticsEnabled: Bool
    public var restNotificationsEnabled: Bool
    public var keepScreenAwake: Bool
    public var reducedMotion: Bool
    public var compoundIncrementKg: Double
    public var isolationIncrementKg: Double

    public init(
        soundEnabled: Bool = false,
        hapticsEnabled: Bool = true,
        restNotificationsEnabled: Bool = true,
        keepScreenAwake: Bool = true,
        reducedMotion: Bool = false,
        compoundIncrementKg: Double = 2.5,
        isolationIncrementKg: Double = 1.25
    ) {
        self.soundEnabled = soundEnabled
        self.hapticsEnabled = hapticsEnabled
        self.restNotificationsEnabled = restNotificationsEnabled
        self.keepScreenAwake = keepScreenAwake
        self.reducedMotion = reducedMotion
        self.compoundIncrementKg = compoundIncrementKg
        self.isolationIncrementKg = isolationIncrementKg
    }
}

public struct UserProfile: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var goal: TrainingGoal
    public var experience: ExperienceLevel
    public var trainingPlace: TrainingPlace
    public var daysPerWeek: Int
    public var preferredDays: [Weekday]
    public var preferredSessionMinutes: Int
    public var avatar: AvatarConfiguration
    public var preferences: ProfilePreferences
    public var xp: Int
    public var campaignStart: Date
    public var createdAt: Date

    public init(
        id: UUID = UUID(),
        name: String,
        goal: TrainingGoal,
        experience: ExperienceLevel,
        trainingPlace: TrainingPlace,
        daysPerWeek: Int,
        preferredDays: [Weekday],
        preferredSessionMinutes: Int,
        avatar: AvatarConfiguration,
        preferences: ProfilePreferences = ProfilePreferences(),
        xp: Int = 0,
        campaignStart: Date = Date(),
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.goal = goal
        self.experience = experience
        self.trainingPlace = trainingPlace
        self.daysPerWeek = min(5, max(3, daysPerWeek))
        self.preferredDays = Array(preferredDays.prefix(5))
        self.preferredSessionMinutes = preferredSessionMinutes
        self.avatar = avatar
        self.preferences = preferences
        self.xp = xp
        self.campaignStart = campaignStart
        self.createdAt = createdAt
    }
}

public enum CampaignStatus: String, Codable, Sendable {
    case active
    case archived
}

public struct CampaignRecord: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var startDate: Date
    public var joinedDate: Date
    public var routineVersion: String
    public var scheduleID: String
    public var weeklyTarget: Int
    public var weeksTotal: Int
    public var status: CampaignStatus
    public var endedAt: Date?

    public init(
        id: UUID = UUID(),
        profileID: UUID,
        startDate: Date,
        joinedDate: Date,
        routineVersion: String,
        scheduleID: String,
        weeklyTarget: Int,
        weeksTotal: Int = 6,
        status: CampaignStatus = .active,
        endedAt: Date? = nil
    ) {
        self.id = id
        self.profileID = profileID
        self.startDate = startDate
        self.joinedDate = joinedDate
        self.routineVersion = routineVersion
        self.scheduleID = scheduleID
        self.weeklyTarget = weeklyTarget
        self.weeksTotal = weeksTotal
        self.status = status
        self.endedAt = endedAt
    }
}

// MARK: - Rutina y códice

public struct RIRRange: Codable, Equatable, Sendable {
    public var min: Int
    public var max: Int

    public init(min: Int, max: Int? = nil) {
        self.min = min
        self.max = max ?? min
    }

    public var label: String { min == max ? "\(min)" : "\(min)–\(max)" }
}

public struct SetPrescription: Codable, Equatable, Sendable {
    public var rir: RIRRange

    public init(rir: RIRRange) {
        self.rir = rir
    }
}

public struct ExercisePrescription: Codable, Identifiable, Equatable, Sendable {
    public var id: String { exerciseID }
    public var exerciseID: String
    public var sets: Int
    public var perSide: String?
    public var repMin: Int
    public var repMax: Int
    public var rirPerSet: [SetPrescription]
    public var restMinSec: Int
    public var restMaxSec: Int
    public var restNote: String?
    public var note: String?

    enum CodingKeys: String, CodingKey {
        case exerciseID = "exerciseId"
        case sets, perSide, repMin, repMax, rirPerSet, restMinSec, restMaxSec, restNote, note
    }

    public init(
        exerciseID: String,
        sets: Int,
        perSide: String?,
        repMin: Int,
        repMax: Int,
        rirPerSet: [SetPrescription],
        restMinSec: Int,
        restMaxSec: Int,
        restNote: String?,
        note: String?
    ) {
        self.exerciseID = exerciseID
        self.sets = sets
        self.perSide = perSide
        self.repMin = repMin
        self.repMax = repMax
        self.rirPerSet = rirPerSet
        self.restMinSec = restMinSec
        self.restMaxSec = restMaxSec
        self.restNote = restNote
        self.note = note
    }
}

public struct WorkoutDay: Codable, Identifiable, Equatable, Sendable {
    public var id: String
    public var name: String
    public var focus: String
    public var durationMin: Int
    public var durationMax: Int
    public var entries: [ExercisePrescription]

    public init(
        id: String,
        name: String,
        focus: String,
        durationMin: Int,
        durationMax: Int,
        entries: [ExercisePrescription]
    ) {
        self.id = id
        self.name = name
        self.focus = focus
        self.durationMin = durationMin
        self.durationMax = durationMax
        self.entries = entries
    }
}

public struct RoutineSchedule: Codable, Identifiable, Equatable, Sendable {
    public var id: String
    public var week: [String?]
    public var weeklyTarget: Int
}

public struct CampaignChapter: Codable, Identifiable, Equatable, Sendable {
    public var id: Int { week }
    public var week: Int
    public var title: String
    public var detail: String
}

public struct RoutineContent: Codable, Equatable, Sendable {
    public var version: String
    public var days: [WorkoutDay]
    public var schedules: [RoutineSchedule]
    public var campaignWeeks: Int
    public var chapters: [CampaignChapter]

    public init(
        version: String,
        days: [WorkoutDay],
        schedules: [RoutineSchedule],
        campaignWeeks: Int,
        chapters: [CampaignChapter]
    ) {
        self.version = version
        self.days = days
        self.schedules = schedules
        self.campaignWeeks = campaignWeeks
        self.chapters = chapters
    }
}

public struct ExerciseGuide: Codable, Identifiable, Equatable, Sendable {
    public var id: String
    public var name: String
    public var muscles: String
    public var rationale: String
    public var setup: [String]
    public var execution: [String]
    public var mistakes: [String]
    public var alternatives: [String]

    enum CodingKeys: String, CodingKey {
        case id
        case name = "nombre"
        case muscles = "musculos"
        case rationale = "porQue"
        case setup = "colocacion"
        case execution = "ejecucion"
        case mistakes = "errores"
        case alternatives = "alternativas"
    }
}

// MARK: - Entrenamiento persistido

public enum SessionStatus: String, Codable, Sendable {
    case active
    case completed
    case adapted
    case partial
    case abandoned
}

public struct TrainingSession: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var campaignID: UUID?
    public var dayID: String
    public var dateKey: String
    public var campaignWeek: Int
    public var status: SessionStatus
    public var startedAt: Date
    public var completedAt: Date?
    public var currentExerciseIndex: Int
    public var unscheduled: Bool
    public var prescriptionSnapshot: WorkoutDay

    public init(
        id: UUID = UUID(),
        profileID: UUID,
        campaignID: UUID? = nil,
        dayID: String,
        dateKey: String,
        campaignWeek: Int,
        status: SessionStatus = .active,
        startedAt: Date = Date(),
        completedAt: Date? = nil,
        currentExerciseIndex: Int = 0,
        unscheduled: Bool = false,
        prescriptionSnapshot: WorkoutDay
    ) {
        self.id = id
        self.profileID = profileID
        self.campaignID = campaignID
        self.dayID = dayID
        self.dateKey = dateKey
        self.campaignWeek = campaignWeek
        self.status = status
        self.startedAt = startedAt
        self.completedAt = completedAt
        self.currentExerciseIndex = currentExerciseIndex
        self.unscheduled = unscheduled
        self.prescriptionSnapshot = prescriptionSnapshot
    }
}

public struct LoggedSet: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var sessionID: UUID
    public var exerciseID: String
    public var setNumber: Int
    public var weightKg: Double
    public var reps: Int
    public var rir: Int
    public var variantID: String?
    public var side: String?
    public var skipped: Bool
    public var skipReason: String?
    public var createdAt: Date

    public init(
        id: UUID = UUID(),
        profileID: UUID,
        sessionID: UUID,
        exerciseID: String,
        setNumber: Int,
        weightKg: Double,
        reps: Int,
        rir: Int,
        variantID: String? = nil,
        side: String? = nil,
        skipped: Bool = false,
        skipReason: String? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.profileID = profileID
        self.sessionID = sessionID
        self.exerciseID = exerciseID
        self.setNumber = setNumber
        self.weightKg = weightKg
        self.reps = reps
        self.rir = rir
        self.variantID = variantID
        self.side = side
        self.skipped = skipped
        self.skipReason = skipReason
        self.createdAt = createdAt
    }
}

public enum DiscomfortAction: String, Codable, Sendable {
    case continueTraining
    case adapt
    case stop
}

public struct DiscomfortRecord: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var sessionID: UUID
    public var exerciseID: String
    public var level: Int
    public var action: DiscomfortAction
    public var note: String?
    public var createdAt: Date
}

public enum GameEventKind: String, Codable, Sendable {
    case plannedSet
    case completedMission
    case adaptedMission
    case partialMission
    case completedChapter
    case milestone
    case cosmetic
}

public struct GameEvent: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var kind: GameEventKind
    public var xp: Int
    public var label: String
    public var dedupeKey: String
    public var sessionID: UUID?
    public var exerciseID: String?
    public var createdAt: Date
}

public struct RestTimerState: Codable, Equatable, Sendable {
    public var sessionID: UUID
    public var exerciseID: String
    public var totalSeconds: Int
    public var targetEndAt: Date
    public var pausedRemainingSeconds: Int?

    public init(
        sessionID: UUID,
        exerciseID: String,
        totalSeconds: Int,
        targetEndAt: Date,
        pausedRemainingSeconds: Int?
    ) {
        self.sessionID = sessionID
        self.exerciseID = exerciseID
        self.totalSeconds = totalSeconds
        self.targetEndAt = targetEndAt
        self.pausedRemainingSeconds = pausedRemainingSeconds
    }

    public func remainingSeconds(at date: Date = Date()) -> Int {
        if let pausedRemainingSeconds { return max(0, pausedRemainingSeconds) }
        return max(0, Int(targetEndAt.timeIntervalSince(date).rounded(.up)))
    }
}

public struct SessionNote: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var sessionID: UUID
    public var exerciseID: String?
    public var text: String
    public var updatedAt: Date
}

public struct GymSetting: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var exerciseID: String
    public var machineName: String?
    public var seatPosition: String?
    public var minimumIncrementKg: Double?
    public var notes: String?
}

public struct CodexPreference: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var exerciseID: String
    public var favorite: Bool
    public var personalNote: String?
}

public struct Unlock: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var itemID: String
    public var dedupeKey: String
}

public struct CustomRoutineRecord: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var baseScheduleID: String
    public var name: String
    public var days: [WorkoutDay]
    public var week: [String?]
    public var weeklyTarget: Int
    public var active: Bool
}

public enum CalendarOverrideKind: String, Codable, Sendable {
    case move
    case absence
    case deload
    case postpone
}

public struct CalendarOverrideRecord: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var profileID: UUID
    public var campaignID: UUID
    public var weekStartDate: Date
    public var kind: CalendarOverrideKind
    public var fromWeekday: Int?
    public var toWeekday: Int?
    public var dayID: String?
    public var weekdays: [Int]?
    public var volumeFactor: Double?
    public var reason: String?
}

public struct ForjaDatabase: Codable, Equatable, Sendable {
    public static let currentSchemaVersion = 1

    public var schemaVersion: Int
    public var profiles: [UserProfile]
    public var campaigns: [CampaignRecord]
    public var sessions: [TrainingSession]
    public var setLogs: [LoggedSet]
    public var discomforts: [DiscomfortRecord]
    public var gameEvents: [GameEvent]
    public var notes: [SessionNote]
    public var gymSettings: [GymSetting]
    public var codexPreferences: [CodexPreference]
    public var unlocks: [Unlock]
    public var customRoutines: [CustomRoutineRecord]
    public var calendarOverrides: [CalendarOverrideRecord]
    public var activeProfileID: UUID?
    public var activeTimer: RestTimerState?

    public init(
        schemaVersion: Int = ForjaDatabase.currentSchemaVersion,
        profiles: [UserProfile] = [],
        campaigns: [CampaignRecord] = [],
        sessions: [TrainingSession] = [],
        setLogs: [LoggedSet] = [],
        discomforts: [DiscomfortRecord] = [],
        gameEvents: [GameEvent] = [],
        notes: [SessionNote] = [],
        gymSettings: [GymSetting] = [],
        codexPreferences: [CodexPreference] = [],
        unlocks: [Unlock] = [],
        customRoutines: [CustomRoutineRecord] = [],
        calendarOverrides: [CalendarOverrideRecord] = [],
        activeProfileID: UUID? = nil,
        activeTimer: RestTimerState? = nil
    ) {
        self.schemaVersion = schemaVersion
        self.profiles = profiles
        self.campaigns = campaigns
        self.sessions = sessions
        self.setLogs = setLogs
        self.discomforts = discomforts
        self.gameEvents = gameEvents
        self.notes = notes
        self.gymSettings = gymSettings
        self.codexPreferences = codexPreferences
        self.unlocks = unlocks
        self.customRoutines = customRoutines
        self.calendarOverrides = calendarOverrides
        self.activeProfileID = activeProfileID
        self.activeTimer = activeTimer
    }
}
