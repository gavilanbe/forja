import Foundation

public enum XPReward {
    public static let plannedSet = 10
    public static let completedMission = 60
    public static let adaptedMission = 60
    public static let partialMission = 25
    public static let completedChapter = 150
    public static let milestone = 25
}

public struct LevelInfo: Equatable, Sendable {
    public var level: Int
    public var title: String
    public var currentXP: Int
    public var nextLevelXP: Int
    public var progress: Double
}

public enum GameRules {
    private static let titles = [
        "Recluta de la Forja",
        "Aprendiz de fragua",
        "Portamartillos",
        "Forjador",
        "Temple de acero",
        "Herrero de guerra",
        "Maestro forjador",
        "Guardián del yunque",
        "Señor de las brasas",
        "Leyenda de la Forja"
    ]

    public static func level(for xp: Int) -> LevelInfo {
        var level = 1
        var floor = 0
        while xp >= floor + level * 120, level < 99 {
            floor += level * 120
            level += 1
        }
        let span = level * 120
        return LevelInfo(
            level: level,
            title: titles[min(level - 1, titles.count - 1)],
            currentXP: xp - floor,
            nextLevelXP: span,
            progress: min(1, Double(xp - floor) / Double(span))
        )
    }
}

public enum ProgressionKind: String, Sendable {
    case increase
    case maintain
    case reduce
    case noData
    case discomfort
}

public struct ProgressionSuggestion: Equatable, Sendable {
    public var kind: ProgressionKind
    public var weightKg: Double?
    public var reason: String
}

public enum ProgressionEngine {
    public static func suggest(
        prescription: ExercisePrescription,
        previousSets: [LoggedSet],
        hasActiveDiscomfort: Bool,
        incrementKg: Double
    ) -> ProgressionSuggestion {
        if hasActiveDiscomfort {
            return ProgressionSuggestion(
                kind: .discomfort,
                weightKg: nil,
                reason: "Hay una molestia reciente: mantén una carga tolerable y prioriza técnica. La app no propondrá una subida."
            )
        }

        let completed = previousSets.filter { !$0.skipped && $0.reps > 0 }
        guard let last = completed.last else {
            return ProgressionSuggestion(
                kind: .noData,
                weightKg: nil,
                reason: "Sin registro comparable. Elige una carga que permita la zona media del rango con RIR 2 real."
            )
        }

        let allAtTop = completed.count >= prescription.sets && completed.enumerated().allSatisfy { index, set in
            let target = prescription.rirPerSet[min(index, prescription.rirPerSet.count - 1)].rir
            return set.reps >= prescription.repMax && set.rir >= target.min
        }
        if allAtTop {
            return ProgressionSuggestion(
                kind: .increase,
                weightKg: roundedQuarter(last.weightKg + incrementKg),
                reason: "Completaste todas las series en el techo de repeticiones con el RIR previsto. Tú decides si aplicar la subida."
            )
        }

        if completed.contains(where: { $0.reps < prescription.repMin }) {
            return ProgressionSuggestion(
                kind: .reduce,
                weightKg: roundedQuarter(max(0, last.weightKg * 0.95)),
                reason: "Alguna serie quedó por debajo del rango. Mantén o reduce ligeramente para recuperar repeticiones limpias."
            )
        }

        return ProgressionSuggestion(
            kind: .maintain,
            weightKg: last.weightKg,
            reason: "Estás dentro del rango. Mantén la carga y suma repeticiones respetando el RIR."
        )
    }

    private static func roundedQuarter(_ value: Double) -> Double {
        (value * 4).rounded() / 4
    }
}

public enum PlanBuilder {
    public static func dayIDs(for daysPerWeek: Int) -> [String] {
        switch daysPerWeek {
        case ...3:
            ["torso-a", "pierna-a", "tiron"]
        case 4:
            ["torso-a", "pierna-a", "empuje", "tiron"]
        default:
            ["torso-a", "pierna-a", "empuje", "tiron", "pierna-b"]
        }
    }

    public static func schedule(for profile: UserProfile) -> [Weekday: String] {
        let days = profile.preferredDays.sorted { $0.rawValue < $1.rawValue }
        let workouts = dayIDs(for: profile.daysPerWeek)
        return Dictionary(uniqueKeysWithValues: zip(days, workouts).map { ($0.0, $0.1) })
    }
}

public struct ProfileStatistics: Equatable, Sendable {
    public var completedMissions: Int
    public var adaptedMissions: Int
    public var totalSets: Int
    public var totalVolumeKg: Double
    public var currentWeekCompleted: Int
    public var weeklyTarget: Int
}
