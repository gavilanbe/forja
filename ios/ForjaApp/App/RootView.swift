import Foundation
import SwiftUI

struct RootView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        Group {
            switch model.phase {
            case .loading:
                ForjaPage {
                    VStack(spacing: 18) {
                        PixelAvatarView(avatar: AvatarConfiguration())
                            .frame(width: 100, height: 150)
                        ProgressView()
                            .tint(ForjaTheme.ember)
                        Text("Encendiendo la fragua…")
                            .font(.forjaLabel())
                    }
                }
            case let .failed(message):
                ForjaPage {
                    ContentUnavailableView {
                        Label("La fragua no arrancó", systemImage: "exclamationmark.triangle.fill")
                    } description: {
                        Text(message)
                    } actions: {
                        Button("Reintentar") { Task { await model.retryBootstrap() } }
                            .buttonStyle(ForjaPrimaryButtonStyle())
                    }
                    .padding()
                }
            case .ready:
                readyContent
            }
        }
        .alert(
            "No se pudo completar",
            isPresented: Binding(
                get: { model.presentedError != nil },
                set: { if !$0 { model.presentedError = nil } }
            )
        ) {
            Button("Entendido", role: .cancel) { model.presentedError = nil }
        } message: {
            Text(model.presentedError ?? "Error desconocido")
        }
    }

    @ViewBuilder
    private var readyContent: some View {
#if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-forja-workout-demo"),
           let day = model.routine.days.first {
            NavigationStack {
                WorkoutView(day: day)
            }
        } else {
            standardReadyContent
        }
#else
        standardReadyContent
#endif
    }

    @ViewBuilder
    private var standardReadyContent: some View {
        if model.needsOnboarding {
            OnboardingFlow(initialStep: onboardingInitialStep)
        } else {
            MainTabView()
        }
    }

    private var onboardingInitialStep: Int {
#if DEBUG
        let arguments = ProcessInfo.processInfo.arguments
        if let flag = arguments.firstIndex(of: "-forja-onboarding-step"),
           arguments.indices.contains(flag + 1),
           let step = Int(arguments[flag + 1]) {
            return step
        }
#endif
        return 0
    }
}
