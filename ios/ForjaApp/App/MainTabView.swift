import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        TabView {
            NavigationStack { TodayView() }
                .tabItem { Label("Hoy", systemImage: "flame.fill") }

            NavigationStack { CampaignView() }
                .tabItem { Label("Campaña", systemImage: "map.fill") }

            NavigationStack { ProgressScreen() }
                .tabItem { Label("Progreso", systemImage: "chart.bar.fill") }

            NavigationStack { CodexView() }
                .tabItem { Label("Códice", systemImage: "book.closed.fill") }

            NavigationStack { ProfileView() }
                .tabItem { Label("Perfil", systemImage: "person.crop.circle.fill") }
        }
        .tint(ForjaTheme.ember)
        .environment(\.forjaReduceMotion, model.activeProfile?.preferences.reducedMotion ?? false)
    }
}
