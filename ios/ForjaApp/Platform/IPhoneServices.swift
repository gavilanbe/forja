import SwiftUI
import UIKit
import UserNotifications

@MainActor
final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    func requestPermission() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound])
        } catch {
            return false
        }
    }

    func scheduleRestEnd(timer: RestTimerState, exerciseName: String) async {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["forja-rest"])
        let remaining = timer.remainingSeconds()
        guard remaining > 0 else { return }

        let content = UNMutableNotificationContent()
        content.title = "Descanso cumplido"
        content.body = "Al yunque: \(exerciseName)"
        content.sound = .default
        content.threadIdentifier = "forja-workout"

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(max(1, remaining)),
            repeats: false
        )
        try? await center.add(
            UNNotificationRequest(identifier: "forja-rest", content: content, trigger: trigger)
        )
    }

    func cancelRestEnd() {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: ["forja-rest"])
    }
}

@MainActor
enum Haptics {
    static func setSaved(enabled: Bool) {
        guard enabled else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func selection(enabled: Bool) {
        guard enabled else { return }
        UISelectionFeedbackGenerator().selectionChanged()
    }

    static func warning(enabled: Bool) {
        guard enabled else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
}

struct KeepScreenAwakeModifier: ViewModifier {
    var enabled: Bool

    func body(content: Content) -> some View {
        content
            .onAppear { UIApplication.shared.isIdleTimerDisabled = enabled }
            .onChange(of: enabled) { _, value in
                UIApplication.shared.isIdleTimerDisabled = value
            }
            .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
    }
}

extension View {
    func keepScreenAwake(_ enabled: Bool) -> some View {
        modifier(KeepScreenAwakeModifier(enabled: enabled))
    }
}
