import Foundation
import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var model: AppModel
    @State private var selection: MainTab

    init() {
        _selection = State(initialValue: Self.initialTab)
    }

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack { TodayView() }
                .tabItem { Label("Hoy", systemImage: "flame.fill") }
                .tag(MainTab.today)

            NavigationStack { CampaignView() }
                .tabItem { Label("Campaña", systemImage: "map.fill") }
                .tag(MainTab.campaign)

            NavigationStack { ProgressScreen() }
                .tabItem { Label("Progreso", systemImage: "chart.bar.fill") }
                .tag(MainTab.progress)

            NavigationStack { CodexView() }
                .tabItem { Label("Códice", systemImage: "book.closed.fill") }
                .tag(MainTab.codex)

            NavigationStack { ProfileView() }
                .tabItem { Label("Perfil", systemImage: "person.crop.circle.fill") }
                .tag(MainTab.profile)
        }
        .tint(ForjaTheme.ember)
        .environment(\.forjaReduceMotion, model.activeProfile?.preferences.reducedMotion ?? false)
    }

    private static var initialTab: MainTab {
#if DEBUG
        let arguments = ProcessInfo.processInfo.arguments
        if let flag = arguments.firstIndex(of: "-forja-tab"),
           arguments.indices.contains(flag + 1),
           let tab = MainTab(rawValue: arguments[flag + 1]) {
            return tab
        }
#endif
        return .today
    }
}

private enum MainTab: String, Hashable {
    case today
    case campaign
    case progress
    case codex
    case profile
}
