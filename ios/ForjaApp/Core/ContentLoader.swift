import Foundation

public enum ContentLoader {
    public static func routine(from data: Data) throws -> RoutineContent {
        try JSONDecoder().decode(RoutineContent.self, from: data)
    }

    public static func codex(from data: Data) throws -> [ExerciseGuide] {
        try JSONDecoder().decode([ExerciseGuide].self, from: data)
    }
}
